"""Regression tests for defects found by adversarial review of the hardened pipeline.

Each test here corresponds to a specific bug that existed in the first implementation and
was reproduced before being fixed.
"""

import io
import struct
from datetime import timedelta
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from PIL import Image, ImageFilter
from rest_framework import status

from apps.citizens.models import CitizenProfile
from apps.documents.document_types import get_spec
from apps.documents.models import Document
from apps.documents.services import groq_vision
from apps.documents.services.normalization import (
    mask_aadhaar_like,
    mask_identifier,
    normalise_fields,
    normalise_freeform_fields,
)
from apps.documents.services.profile_mapping import parse_income
from apps.documents.services.quality import STATUS_OK, STATUS_TOO_SMALL, assess_image_quality
from apps.schemes.models import Scheme

from .fixtures import (
    DocumentTestCase,
    FakeResponse,
    sharp_document_bytes,
    upload_file,
)

AADHAAR = get_spec('aadhaar_card')
PATCH_TARGET = 'apps.documents.services.groq_vision._generate'
UPLOAD_URL = '/api/documents/upload/'

FULL_AADHAAR = "4321 8765 2109"


class TruncatedImageTests(DocumentTestCase):
    """A truncated JPEG passed validation (JPEG's verify() never decodes scan data) and
    then raised deep in preprocessing, surfacing as HTTP 500."""

    def setUp(self):
        super().setUp()
        self.citizen = CitizenProfile.objects.create()

    def _post(self, data):
        return self.client.post(
            UPLOAD_URL,
            {
                'file': upload_file(data),
                'doc_type': 'aadhaar_card',
                'citizen_id': str(self.citizen.citizen_id),
            },
            format='multipart',
        )

    def test_truncated_jpeg_is_rejected_with_400_not_500(self):
        full = sharp_document_bytes()
        for fraction in (0.9, 0.6, 0.3):
            with self.subTest(fraction=fraction):
                response = self._post(full[: int(len(full) * fraction)])
                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST,
                    f"{fraction:.0%} of a JPEG should be a clean rejection, not a 500",
                )
                self.assertEqual(response.data['error']['code'], 'CORRUPT_IMAGE')

    def test_truncated_upload_stores_nothing(self):
        full = sharp_document_bytes()
        self._post(full[: len(full) // 2])
        self.assertEqual(Document.objects.count(), 0)


class AadhaarMaskingTests(SimpleTestCase):
    """The full number leaked through several paths that masking did not cover."""

    def test_masking_returns_none_when_no_last_four_recoverable(self):
        """Returning a well-formed 'XXXX-XXXX-XXXX' manufactured a plausible value from
        junk, and — being non-empty — let a failed reading pass the success gate."""
        for junk in ("Illegible", "??", "AADHAAR", "Government of India", "आधार"):
            self.assertIsNone(mask_identifier(junk), f"{junk!r} should not yield a value")

    def test_masking_still_works_for_real_numbers(self):
        self.assertEqual(mask_identifier("4321 8765 2109"), "XXXX-XXXX-2109")
        self.assertEqual(mask_identifier("4321-8765-2109"), "XXXX-XXXX-2109")
        self.assertEqual(mask_identifier("432187652109"), "XXXX-XXXX-2109")

    def test_aadhaar_shaped_numbers_are_masked_in_any_separator_form(self):
        for form in (
            "4321 8765 2109",
            "4321-8765-2109",
            "4321.8765.2109",
            "432187652109",
            "4321-8765 2109",
        ):
            self.assertEqual(
                mask_aadhaar_like(form), "XXXX-XXXX-2109", f"{form!r} was not masked"
            )

    def test_aadhaar_embedded_in_free_text_is_masked(self):
        self.assertEqual(
            mask_aadhaar_like("Rekha Devi Sharma 4321 8765 2109"),
            "Rekha Devi Sharma XXXX-XXXX-2109",
        )

    def test_longer_digit_runs_are_not_mistaken_for_aadhaar(self):
        """A 16-digit card number is not a 12-digit Aadhaar number."""
        self.assertEqual(mask_aadhaar_like("4321876521091234"), "4321876521091234")

    def test_already_masked_values_are_left_alone(self):
        self.assertEqual(mask_aadhaar_like("XXXX-XXXX-2109"), "XXXX-XXXX-2109")

    def test_ordinary_numbers_are_untouched(self):
        for value in ("150000", "31/03/2027", "2.5", "778/3"):
            self.assertEqual(mask_aadhaar_like(value), value)

    def test_full_aadhaar_in_a_non_identifier_schema_field_is_masked(self):
        """`state` is mapped onto CitizenProfile, so an unmasked number there would
        escape the documents app entirely."""
        fields = normalise_fields(AADHAAR, {"name": "Rekha", "state": "4321-8765-2109"})
        self.assertEqual(fields['state'], "XXXX-XXXX-2109")

    def test_full_aadhaar_inside_a_name_is_masked(self):
        fields = normalise_fields(AADHAAR, {"name": f"Rekha Devi {FULL_AADHAAR}"})
        self.assertNotIn("8765", fields['name'])
        self.assertIn("XXXX-XXXX-2109", fields['name'])

    def test_freeform_masking_covers_separator_forms(self):
        """The schemaless safety net only stripped whitespace, so hyphenated numbers
        under unrecognised keys were stored in full."""
        for form in ("4321-8765-2109", "4321.8765.2109", "4321 8765 2109"):
            fields = normalise_freeform_fields({"linked_id": form})
            self.assertEqual(fields['linked_id'], "XXXX-XXXX-2109", f"{form!r} leaked")


@override_settings(GROQ_API_KEY='real-key')
class ExtractionSuccessGateTests(SimpleTestCase):
    def test_unreadable_identifier_does_not_count_as_a_successful_extraction(self):
        payload = {
            "name": None,
            "aadhaar_no": "Illegible",
            "dob": "12/07/1988",
            "gender": "Female",
            "state": "Bihar",
        }
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=payload)):
            result = groq_vision.extract_fields(
                image_bytes=b'x', mime_type='image/jpeg', spec=AADHAAR
            )
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assertEqual(result.error, 'no_fields_extracted')
        self.assertEqual(result.fields, {})


class IncomeParsingTests(SimpleTestCase):
    def test_leading_unrelated_number_is_not_taken_as_the_income(self):
        """'first number wins' read a certificate number as the income."""
        self.assertEqual(
            parse_income("Certificate No 0098421 - Annual Income Rs 1,50,000"), 150000
        )

    def test_monthly_figures_are_refused_rather_than_annualised(self):
        """Storing a monthly figure as an annual income under-reports it 12x and would
        wrongly grant eligibility."""
        for value in ("Rs 12,000 per month", "12000/month", "Rs. 12,000 monthly"):
            self.assertIsNone(parse_income(value), f"{value!r} should not be accepted")

    def test_documented_formats_still_parse(self):
        self.assertEqual(parse_income("Rs. 1,50,000 (One Lakh Fifty Thousand Only)"), 150000)
        self.assertEqual(parse_income("₹ 1,50,000/-"), 150000)
        self.assertEqual(parse_income("150000"), 150000)


class QualityRegressionTests(SimpleTestCase):
    def test_blurred_small_image_is_still_detected(self):
        """Normalisation only downscaled, so a blurred 300px image scored 566 —
        above the threshold — and passed as acceptable."""
        base = Image.open(io.BytesIO(sharp_document_bytes())).resize((300, 424), Image.LANCZOS)
        blurred = base.filter(ImageFilter.GaussianBlur(5 * 300 / 1240))
        buffer = io.BytesIO()
        blurred.convert("RGB").save(buffer, "JPEG")

        result = assess_image_quality(buffer.getvalue())
        self.assertTrue(result.is_blurry, f"variance {result.laplacian_variance} should flag")

    def test_sharp_images_stay_acceptable_across_resolutions(self):
        base = Image.open(io.BytesIO(sharp_document_bytes()))
        for size in ((300, 424), (620, 877), (1240, 1754), (2480, 3508)):
            with self.subTest(size=size):
                buffer = io.BytesIO()
                base.resize(size, Image.LANCZOS).convert("RGB").save(buffer, "JPEG")
                result = assess_image_quality(buffer.getvalue())
                self.assertEqual(result.status, STATUS_OK)

    def test_extreme_aspect_ratio_is_not_reported_acceptable(self):
        """After normalisation a 10000x5 image is 1024x1, which the 3x3 kernel cannot
        convolve at all — every pixel is copied border, previously measured as signal."""
        buffer = io.BytesIO()
        Image.new("RGB", (10000, 5), "white").save(buffer, "PNG")
        result = assess_image_quality(buffer.getvalue())
        self.assertEqual(result.status, STATUS_TOO_SMALL)

    def test_16_bit_greyscale_scan_is_rescaled_not_clamped(self):
        """Pillow clamps I;16 -> L at 255, blanking the page and reporting a sharp scan
        as blurry."""
        source = Image.open(io.BytesIO(sharp_document_bytes())).convert("L")
        # Widen each 8-bit sample to full 16-bit scale (x257), little-endian.
        deep_bytes = b"".join(struct.pack("<H", p * 257) for p in source.tobytes())
        deep = Image.frombytes("I;16", source.size, deep_bytes)
        buffer = io.BytesIO()
        deep.save(buffer, "PNG")

        result = assess_image_quality(buffer.getvalue())
        self.assertEqual(
            result.status, STATUS_OK, "a sharp 16-bit scan must not read as blurry"
        )


class ProfileMappingRegressionTests(DocumentTestCase):
    def setUp(self):
        super().setUp()
        self.citizen = CitizenProfile.objects.create()

    def _upload_and_confirm(self, doc_type, fields):
        upload = self.client.post(
            UPLOAD_URL,
            {
                'file': upload_file(sharp_document_bytes()),
                'doc_type': doc_type,
                'citizen_id': str(self.citizen.citizen_id),
            },
            format='multipart',
        )
        self.assertEqual(upload.status_code, status.HTTP_201_CREATED)
        return self.client.post(
            f"/api/documents/{upload.data['document_id']}/confirm/",
            {
                'confirmed': True,
                'citizen_id': str(self.citizen.citizen_id),
                'extracted_fields': fields,
            },
            format='json',
        )

    def test_blank_declared_value_is_filled_not_treated_as_a_contradiction(self):
        """Django stores '' for a blank submission; treating that as declared blocked the
        field forever and reported a conflict against nothing."""
        self.citizen.state = ''
        self.citizen.gender = ''
        self.citizen.save()

        response = self._upload_and_confirm(
            'aadhaar_card', {'name': 'Rekha', 'gender': 'Female', 'state': 'Madhya Pradesh'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.state, 'Madhya Pradesh')
        self.assertEqual(self.citizen.gender, 'female')
        self.assertEqual(response.data['profile_update']['conflicts'], [])

    def test_declared_gender_is_canonicalised_before_comparison(self):
        """A declared 'M' against a document 'Male' is not a contradiction."""
        self.citizen.gender = 'M'
        self.citizen.save()

        response = self._upload_and_confirm(
            'aadhaar_card', {'name': 'Rekha', 'gender': 'Male'}
        )
        conflict_fields = [c['field'] for c in response.data['profile_update']['conflicts']]
        self.assertNotIn('gender', conflict_fields)

    def test_genuine_gender_disagreement_is_still_a_conflict(self):
        self.citizen.gender = 'male'
        self.citizen.save()

        response = self._upload_and_confirm(
            'aadhaar_card', {'name': 'Rekha', 'gender': 'Female'}
        )
        conflict_fields = [c['field'] for c in response.data['profile_update']['conflicts']]
        self.assertIn('gender', conflict_fields)


class LiveExpiryTests(DocumentTestCase):
    """`is_expired` is a snapshot taken at confirmation; the missing-documents diff must
    derive expiry against today, or a certificate stays valid forever."""

    def setUp(self):
        super().setUp()
        self.citizen = CitizenProfile.objects.create()
        self.scheme = Scheme.objects.create(
            code="pmay_g",
            name="PMAY-G",
            description="Test",
            required_documents_json=["income_certificate"],
        )

    def _missing(self):
        return self.client.get(
            f'/api/documents/missing/{self.citizen.citizen_id}/{self.scheme.code}/'
        )

    def test_certificate_that_expired_after_confirmation_stops_counting(self):
        yesterday = timezone.localdate() - timedelta(days=1)
        # Confirmed while valid: the stored snapshot says not expired.
        Document.objects.create(
            citizen=self.citizen,
            doc_type='income_certificate',
            confirmed=True,
            is_expired=False,
            expiry_status='valid',
            expiry_date=yesterday,
        )

        response = self._missing()
        self.assertEqual(response.data['uploaded_documents'], [])
        self.assertEqual(response.data['missing_documents'], ['income_certificate'])
        self.assertEqual(response.data['expired_documents'], ['income_certificate'])

    def test_certificate_still_in_date_counts(self):
        tomorrow = timezone.localdate() + timedelta(days=1)
        Document.objects.create(
            citizen=self.citizen,
            doc_type='income_certificate',
            confirmed=True,
            is_expired=False,
            expiry_status='valid',
            expiry_date=tomorrow,
        )

        response = self._missing()
        self.assertEqual(response.data['uploaded_documents'], ['income_certificate'])
        self.assertEqual(response.data['missing_documents'], [])

    def test_document_without_an_expiry_date_still_counts(self):
        Document.objects.create(
            citizen=self.citizen,
            doc_type='income_certificate',
            confirmed=True,
            expiry_status='not_applicable',
            expiry_date=None,
        )
        response = self._missing()
        self.assertEqual(response.data['uploaded_documents'], ['income_certificate'])
