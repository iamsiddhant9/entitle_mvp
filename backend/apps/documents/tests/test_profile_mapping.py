"""Confirmed document data -> CitizenProfile mapping, and contradiction detection."""

from datetime import date

from django.test import SimpleTestCase
from rest_framework import status

from apps.citizens.models import CitizenProfile
from apps.documents.models import Document
from apps.documents.services.profile_mapping import (
    age_from_dob,
    apply_confirmed_document,
    normalise_gender,
    normalise_state,
    parse_income,
)

from .fixtures import DocumentTestCase, sharp_document_bytes, upload_file

UPLOAD_URL = '/api/documents/upload/'
TODAY = date(2026, 8, 15)


class ConverterTests(SimpleTestCase):
    def test_income_parsing(self):
        self.assertEqual(parse_income('150000'), 150000)
        self.assertEqual(parse_income('1,50,000'), 150000)
        self.assertEqual(parse_income('Rs. 1,50,000'), 150000)
        self.assertEqual(parse_income('₹ 1,50,000/-'), 150000)
        self.assertEqual(
            parse_income('Rs. 1,50,000 (One Lakh Fifty Thousand Only)'), 150000
        )
        self.assertEqual(parse_income('150000.00'), 150000)

    def test_income_parsing_rejects_unusable_values(self):
        for value in (None, '', 'One Lakh Fifty Thousand', 'not stated', '-'):
            self.assertIsNone(parse_income(value), f"unexpectedly parsed {value!r}")

    def test_income_parsing_rejects_absurd_values(self):
        self.assertIsNone(parse_income('999999999999999'))

    def test_age_from_dob(self):
        self.assertEqual(age_from_dob('12/07/1988', today=TODAY), 38)
        self.assertEqual(age_from_dob('1988-07-12', today=TODAY), 38)

    def test_age_uses_whole_years_only(self):
        self.assertEqual(age_from_dob('16/08/1988', today=TODAY), 37)
        self.assertEqual(age_from_dob('15/08/1988', today=TODAY), 38)

    def test_age_rejects_unparseable_or_impossible_dates(self):
        for value in (None, '', 'unknown', '12/07/1820', '12/07/2090'):
            self.assertIsNone(age_from_dob(value, today=TODAY), f"unexpectedly parsed {value!r}")

    def test_gender_normalisation(self):
        self.assertEqual(normalise_gender('Female'), 'female')
        self.assertEqual(normalise_gender('  FEMALE '), 'female')
        self.assertEqual(normalise_gender('F'), 'female')
        self.assertEqual(normalise_gender('Male'), 'male')
        self.assertEqual(normalise_gender('Transgender'), 'other')

    def test_gender_normalisation_rejects_junk(self):
        for value in (None, '', 'yes', '12'):
            self.assertIsNone(normalise_gender(value))

    def test_state_normalisation(self):
        self.assertEqual(normalise_state('  Madhya   Pradesh '), 'Madhya Pradesh')
        self.assertIsNone(normalise_state(''))
        self.assertIsNone(normalise_state('x' * 200))


class ProfileMappingTests(DocumentTestCase):
    def setUp(self):
        super().setUp()
        self.citizen = CitizenProfile.objects.create()

    def _upload(self, doc_type):
        response = self.client.post(
            UPLOAD_URL,
            {
                'file': upload_file(sharp_document_bytes()),
                'doc_type': doc_type,
                'citizen_id': str(self.citizen.citizen_id),
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data['document_id']

    def _confirm(self, document_id, fields):
        return self.client.post(
            f'/api/documents/{document_id}/confirm/',
            {
                'confirmed': True,
                'citizen_id': str(self.citizen.citizen_id),
                'extracted_fields': fields,
            },
            format='json',
        )

    def test_confirmed_income_populates_profile(self):
        document_id = self._upload('income_certificate')
        response = self._confirm(
            document_id, {'annual_income': 'Rs. 1,50,000', 'valid_until': '31/03/2027'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.income, 150000)
        self.assertEqual(response.data['profile_update']['applied']['income'], 150000)

    def test_confirmed_dob_populates_age(self):
        document_id = self._upload('aadhaar_card')
        self._confirm(document_id, {'name': 'Rekha', 'dob': '12/07/1988', 'gender': 'Female'})
        self.citizen.refresh_from_db()
        self.assertIsNotNone(self.citizen.age)
        self.assertEqual(self.citizen.gender, 'female')

    def test_confirmed_land_document_sets_land_owned(self):
        document_id = self._upload('land_ownership_document')
        self._confirm(document_id, {'owner_name': 'Rekha Devi', 'khasra_no': '778/3'})
        self.citizen.refresh_from_db()
        self.assertIs(self.citizen.land_owned, True)

    def test_declared_data_is_never_overwritten(self):
        self.citizen.income = 90000
        self.citizen.save()

        document_id = self._upload('income_certificate')
        response = self._confirm(document_id, {'annual_income': '400000'})

        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.income, 90000, "declared value must be preserved")

        conflicts = response.data['profile_update']['conflicts']
        self.assertEqual(len(conflicts), 1)
        self.assertEqual(conflicts[0]['field'], 'income')
        self.assertEqual(conflicts[0]['declared'], 90000)
        self.assertEqual(conflicts[0]['document'], 400000)

    def test_agreeing_values_are_not_reported_as_conflicts(self):
        self.citizen.income = 150000
        self.citizen.save()

        document_id = self._upload('income_certificate')
        response = self._confirm(document_id, {'annual_income': '1,50,000'})

        self.assertEqual(response.data['profile_update']['conflicts'], [])
        reasons = [s.get('reason') for s in response.data['profile_update']['skipped']]
        self.assertIn('already_matches', reasons)

    def test_unparseable_income_is_not_applied(self):
        document_id = self._upload('income_certificate')
        response = self._confirm(document_id, {'annual_income': 'not stated'})
        self.citizen.refresh_from_db()
        self.assertIsNone(self.citizen.income)
        self.assertEqual(response.data['profile_update']['applied'], {})

    def test_parent_aadhaar_does_not_map_to_the_citizen(self):
        """A parent's document must not set the applicant's own age or gender."""
        document_id = self._upload('parent_aadhaar')
        response = self._confirm(document_id, {'name': 'Ramesh', 'dob': '01/01/1960'})
        self.citizen.refresh_from_db()
        self.assertIsNone(self.citizen.age)
        self.assertEqual(response.data['profile_update']['applied'], {})

    def test_schemaless_document_type_does_not_map(self):
        document_id = self._upload('bank_passbook')
        response = self._confirm(document_id, {'bank': 'SBI'})
        self.assertEqual(response.data['profile_update']['applied'], {})

    def test_unconfirmed_document_never_touches_the_profile(self):
        self._upload('income_certificate')
        self.citizen.refresh_from_db()
        self.assertIsNone(self.citizen.income)

    def test_expired_document_does_not_map(self):
        document_id = self._upload('income_certificate')
        response = self._confirm(
            document_id, {'annual_income': '150000', 'valid_until': '31/03/2020'}
        )
        self.citizen.refresh_from_db()
        self.assertIsNone(self.citizen.income, "an expired certificate must not set income")
        reasons = [s.get('reason') for s in response.data['profile_update']['skipped']]
        self.assertIn('document_expired', reasons)

    def test_mapping_is_idempotent(self):
        document_id = self._upload('income_certificate')
        self._confirm(document_id, {'annual_income': '150000'})
        document = Document.objects.get(id=document_id)

        result = apply_confirmed_document(document)
        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.income, 150000)
        self.assertEqual(result.applied, {})
        self.assertEqual(result.conflicts, [])

    def test_document_without_citizen_is_skipped_safely(self):
        document = Document.objects.create(
            citizen=None, doc_type='income_certificate', confirmed=True
        )
        result = apply_confirmed_document(document)
        self.assertEqual(result.applied, {})
        self.assertEqual(result.skipped[0]['reason'], 'no_citizen')
