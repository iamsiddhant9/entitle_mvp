"""Upload endpoint: validation, storage and provenance."""

from django.test import override_settings
from rest_framework import status

from apps.citizens.models import CitizenProfile
from apps.documents.models import Document
from apps.documents.services import groq_vision

from .fixtures import (
    DocumentTestCase,
    blank_image_bytes,
    corrupt_image_bytes,
    fake_pdf_bytes,
    not_an_image_bytes,
    png_bytes,
    sharp_document_bytes,
    upload_file,
    webp_bytes,
)

URL = '/api/documents/upload/'


class DocumentUploadTests(DocumentTestCase):
    def setUp(self):
        super().setUp()
        self.citizen = CitizenProfile.objects.create(state="Maharashtra")

    def _post(self, **overrides):
        payload = {
            'file': upload_file(sharp_document_bytes()),
            'doc_type': 'aadhaar_card',
            'citizen_id': str(self.citizen.citizen_id),
        }
        payload.update(overrides)
        payload = {k: v for k, v in payload.items() if v is not None}
        return self.client.post(URL, payload, format='multipart')

    # --- Happy path ---

    def test_valid_upload_returns_contract_fields(self):
        response = self._post()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        for key in ('document_id', 'doc_type', 'file_ref', 'extracted_fields',
                    'is_blurry', 'is_expired'):
            self.assertIn(key, response.data, f"contract field '{key}' missing")

        self.assertEqual(response.data['doc_type'], 'aadhaar_card')
        self.assertFalse(response.data['is_blurry'])
        self.assertFalse(response.data['is_expired'])
        self.assertFalse(response.data['confirmed'])

    def test_upload_attaches_document_to_citizen(self):
        response = self._post()
        document = Document.objects.get(id=response.data['document_id'])
        self.assertEqual(document.citizen, self.citizen)

    def test_missing_api_key_reports_not_configured_with_no_data(self):
        """The critical guarantee: no key means no data, never fabricated data."""
        response = self._post()
        self.assertEqual(response.data['extraction_status'], groq_vision.STATUS_NOT_CONFIGURED)
        self.assertEqual(response.data['extracted_fields'], {})
        self.assertEqual(response.data['extraction_source'], groq_vision.SOURCE_NONE)

    def test_document_type_without_schema_is_accepted_but_not_extracted(self):
        response = self._post(doc_type='bank_passbook')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data['extraction_status'], groq_vision.STATUS_UNSUPPORTED_DOC_TYPE
        )
        self.assertEqual(response.data['extracted_fields'], {})

    def test_png_upload_is_accepted(self):
        response = self._post(file=upload_file(png_bytes(), name='scan.png', content_type='image/png'))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_webp_upload_is_accepted_and_stored_with_the_detected_extension(self):
        response = self._post(
            file=upload_file(webp_bytes(), name='scan.webp', content_type='image/webp')
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        document = Document.objects.get(id=response.data['document_id'])
        self.assertTrue(document.file.name.endswith('.webp'))

    def test_stored_filename_is_generated_not_client_supplied(self):
        response = self._post(
            file=upload_file(sharp_document_bytes(), name='../../evil.html')
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        document = Document.objects.get(id=response.data['document_id'])
        self.assertNotIn('evil', document.file.name)
        self.assertNotIn('..', document.file.name)
        self.assertTrue(document.file.name.startswith('documents/'))
        self.assertTrue(document.file.name.endswith('.jpg'))

    def test_content_type_is_sniffed_not_trusted(self):
        """A text file claiming to be a JPEG is still rejected."""
        response = self._post(
            file=upload_file(not_an_image_bytes(), name='x.jpg', content_type='image/jpeg')
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'UNSUPPORTED_FILE_TYPE')

    def test_session_can_supply_citizen(self):
        session = self.client.session
        session['citizen_id'] = str(self.citizen.citizen_id)
        session.save()

        response = self._post(citizen_id=None)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        document = Document.objects.get(id=response.data['document_id'])
        self.assertEqual(document.citizen, self.citizen)

    # --- Rejections ---

    def test_missing_file_is_rejected(self):
        response = self.client.post(
            URL,
            {'doc_type': 'aadhaar_card', 'citizen_id': str(self.citizen.citizen_id)},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'FILE_REQUIRED')

    def test_pdf_is_rejected_with_a_clear_message(self):
        response = self._post(
            file=upload_file(fake_pdf_bytes(), name='cert.pdf', content_type='application/pdf')
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'UNSUPPORTED_FILE_TYPE')
        self.assertIn('PDF', response.data['error']['message'])

    def test_corrupt_image_is_rejected(self):
        response = self._post(file=upload_file(corrupt_image_bytes()))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            response.data['error']['code'], ('CORRUPT_IMAGE', 'UNSUPPORTED_FILE_TYPE')
        )

    def test_empty_file_is_rejected(self):
        response = self._post(file=upload_file(b'', name='empty.jpg'))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'FILE_REQUIRED')

    @override_settings(DOCUMENT_MAX_UPLOAD_BYTES=2048)
    def test_oversized_file_is_rejected(self):
        response = self._post()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'FILE_TOO_LARGE')

    @override_settings(DOCUMENT_MAX_IMAGE_PIXELS=1000)
    def test_image_with_too_many_pixels_is_rejected(self):
        """Decompression-bomb guard: refused on declared dimensions, before decoding."""
        response = self._post()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'IMAGE_TOO_LARGE')

    def test_unknown_doc_type_is_rejected(self):
        response = self._post(doc_type='not_a_real_document')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'UNSUPPORTED_DOC_TYPE')

    def test_missing_doc_type_is_rejected(self):
        response = self._post(doc_type=None)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'UNSUPPORTED_DOC_TYPE')

    def test_missing_citizen_id_is_rejected(self):
        response = self._post(citizen_id=None)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'CITIZEN_ID_REQUIRED')

    def test_unknown_citizen_id_is_rejected_not_orphaned(self):
        response = self._post(citizen_id='00000000-0000-0000-0000-000000000000')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Document.objects.count(), 0)

    def test_garbage_citizen_id_is_rejected_not_orphaned(self):
        response = self._post(citizen_id='not-a-uuid')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Document.objects.count(), 0)

    def test_no_document_is_stored_when_validation_fails(self):
        self._post(file=upload_file(not_an_image_bytes()))
        self.assertEqual(Document.objects.count(), 0)


class BlurryUploadTests(DocumentTestCase):
    def setUp(self):
        super().setUp()
        self.citizen = CitizenProfile.objects.create()

    def test_blurry_upload_still_returns_201_per_contract(self):
        from .fixtures import blurred_document_bytes

        response = self.client.post(
            URL,
            {
                'file': upload_file(blurred_document_bytes()),
                'doc_type': 'aadhaar_card',
                'citizen_id': str(self.citizen.citizen_id),
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_blurry'])
        self.assertEqual(
            response.data['extraction_status'], groq_vision.STATUS_SKIPPED_LOW_QUALITY
        )
        self.assertEqual(response.data['extracted_fields'], {})

    def test_small_image_is_not_treated_as_blurry(self):
        """Low resolution is a different defect from blur and must not block the flow."""
        response = self.client.post(
            URL,
            {
                'file': upload_file(blank_image_bytes(100, 100)),
                'doc_type': 'aadhaar_card',
                'citizen_id': str(self.citizen.citizen_id),
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['is_blurry'])
        self.assertEqual(response.data['quality_status'], 'too_small')
