"""Confirmation endpoint: the trust boundary, its ownership check and its side effects."""

from unittest.mock import patch

from django.test import override_settings
from rest_framework import status

from apps.citizens.models import CitizenProfile
from apps.documents.models import Document
from apps.documents.services import groq_vision

from .fixtures import (
    SAMPLE_AADHAAR_PAYLOAD,
    DocumentTestCase,
    FakeResponse,
    blurred_document_bytes,
    sharp_document_bytes,
    upload_file,
)

UPLOAD_URL = '/api/documents/upload/'
PATCH_TARGET = 'apps.documents.services.groq_vision._generate'


def confirm_url(document_id):
    return f'/api/documents/{document_id}/confirm/'


class ConfirmationTests(DocumentTestCase):
    def setUp(self):
        super().setUp()
        self.citizen = CitizenProfile.objects.create()
        self.other_citizen = CitizenProfile.objects.create()

    def _upload(self, doc_type='aadhaar_card', data=None):
        response = self.client.post(
            UPLOAD_URL,
            {
                'file': upload_file(data or sharp_document_bytes()),
                'doc_type': doc_type,
                'citizen_id': str(self.citizen.citizen_id),
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data['document_id']

    # --- Legacy flow preserved ---

    def test_upload_then_confirm(self):
        document_id = self._upload()
        response = self.client.post(
            confirm_url(document_id),
            {
                'confirmed': True,
                'extracted_fields': {'name': 'Citizen User', 'aadhaar_no': '1234-5678-9012'},
                'citizen_id': str(self.citizen.citizen_id),
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['confirmed'])
        self.assertEqual(response.data['extracted_fields']['name'], 'Citizen User')

    def test_confirmation_records_provenance(self):
        document_id = self._upload()
        self.client.post(
            confirm_url(document_id),
            {'confirmed': True, 'extracted_fields': {'name': 'Rekha Devi'},
             'citizen_id': str(self.citizen.citizen_id)},
            format='json',
        )
        document = Document.objects.get(id=document_id)
        self.assertTrue(document.confirmed)
        self.assertIsNotNone(document.confirmed_at)
        self.assertEqual(document.extraction_source, groq_vision.SOURCE_HUMAN)

    def test_confirming_without_editing_keeps_extraction_source(self):
        with override_settings(GROQ_API_KEY='real-key'):
            with patch(PATCH_TARGET, return_value=FakeResponse(parsed=dict(SAMPLE_AADHAAR_PAYLOAD))):
                document_id = self._upload()

        response = self.client.post(
            confirm_url(document_id),
            {'confirmed': True, 'citizen_id': str(self.citizen.citizen_id)},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        document = Document.objects.get(id=document_id)
        self.assertEqual(document.extraction_source, groq_vision.SOURCE_GROQ)
        self.assertTrue(document.confirmed)

    # --- Ownership ---

    def test_confirm_requires_ownership_proof(self):
        document_id = self._upload()
        response = self.client.post(
            confirm_url(document_id), {'confirmed': True}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error']['code'], 'PERMISSION_DENIED')

    def test_another_citizen_cannot_confirm(self):
        document_id = self._upload()
        response = self.client.post(
            confirm_url(document_id),
            {'confirmed': True, 'citizen_id': str(self.other_citizen.citizen_id)},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Document.objects.get(id=document_id).confirmed)

    def test_enumerating_document_ids_does_not_grant_access(self):
        document_id = self._upload()
        for guess in (str(self.citizen.id), '1', 'true', ''):
            response = self.client.post(
                confirm_url(document_id),
                {'confirmed': True, 'citizen_id': guess},
                format='json',
            )
            self.assertEqual(
                response.status_code,
                status.HTTP_403_FORBIDDEN,
                f"integer/guessed identifier {guess!r} must not prove ownership",
            )

    def test_header_can_prove_ownership(self):
        document_id = self._upload()
        response = self.client.post(
            confirm_url(document_id),
            {'confirmed': True},
            format='json',
            headers={'X-Citizen-Id': str(self.citizen.citizen_id)},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_session_can_prove_ownership(self):
        document_id = self._upload()
        session = self.client.session
        session['citizen_id'] = str(self.citizen.citizen_id)
        session.save()

        response = self.client.post(
            confirm_url(document_id), {'confirmed': True}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ownerless_document_cannot_be_confirmed(self):
        document = Document.objects.create(citizen=None, doc_type='aadhaar_card')
        response = self.client.post(
            confirm_url(document.id),
            {'confirmed': True, 'citizen_id': str(self.citizen.citizen_id)},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unknown_document_id(self):
        response = self.client.post(
            confirm_url(999999),
            {'confirmed': True, 'citizen_id': str(self.citizen.citizen_id)},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- Quality gate ---

    def test_blurry_document_cannot_be_confirmed(self):
        document_id = self._upload(data=blurred_document_bytes())
        response = self.client.post(
            confirm_url(document_id),
            {'confirmed': True, 'extracted_fields': {'name': 'Anything'},
             'citizen_id': str(self.citizen.citizen_id)},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'DOCUMENT_QUALITY_TOO_LOW')
        self.assertFalse(Document.objects.get(id=document_id).confirmed)

    # --- Payload handling ---

    def test_documents_cannot_be_unconfirmed(self):
        document_id = self._upload()
        response = self.client.post(
            confirm_url(document_id),
            {'confirmed': False, 'citizen_id': str(self.citizen.citizen_id)},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'VALIDATION_ERROR')
        self.assertFalse(Document.objects.get(id=document_id).confirmed)

    def test_validation_errors_use_the_project_error_envelope(self):
        document_id = self._upload()
        response = self.client.post(
            confirm_url(document_id),
            {'confirmed': True, 'citizen_id': str(self.citizen.citizen_id),
             'extracted_fields': 'not-a-dict'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('code', response.data['error'])
        self.assertIn('message', response.data['error'])

    def test_submitted_fields_are_normalised_and_unknown_keys_dropped(self):
        document_id = self._upload()
        response = self.client.post(
            confirm_url(document_id),
            {
                'confirmed': True,
                'citizen_id': str(self.citizen.citizen_id),
                'extracted_fields': {
                    'Full Name': 'Rekha Devi Sharma',
                    'Aadhaar Number': '4321 8765 2109',
                    'unexpected_key': 'dropped',
                },
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        fields = response.data['extracted_fields']
        self.assertEqual(fields['name'], 'Rekha Devi Sharma')
        self.assertNotIn('unexpected_key', fields)

    def test_full_aadhaar_number_is_masked_even_when_submitted_by_a_client(self):
        document_id = self._upload()
        response = self.client.post(
            confirm_url(document_id),
            {
                'confirmed': True,
                'citizen_id': str(self.citizen.citizen_id),
                'extracted_fields': {'name': 'Rekha', 'aadhaar_no': '432187652109'},
            },
            format='json',
        )
        self.assertEqual(response.data['extracted_fields']['aadhaar_no'], 'XXXX-XXXX-2109')
        document = Document.objects.get(id=document_id)
        self.assertNotIn('432187652109', str(document.extracted_fields))

    def test_freeform_fields_are_bounded_for_schemaless_types(self):
        document_id = self._upload(doc_type='bank_passbook')
        response = self.client.post(
            confirm_url(document_id),
            {
                'confirmed': True,
                'citizen_id': str(self.citizen.citizen_id),
                'extracted_fields': {f'key_{i}': 'x' * 500 for i in range(60)},
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        fields = response.data['extracted_fields']
        self.assertLessEqual(len(fields), 25)
        for value in fields.values():
            self.assertLessEqual(len(value), 200)

    def test_expiry_is_recomputed_from_confirmed_fields(self):
        document_id = self._upload(doc_type='income_certificate')
        response = self.client.post(
            confirm_url(document_id),
            {
                'confirmed': True,
                'citizen_id': str(self.citizen.citizen_id),
                'extracted_fields': {'annual_income': '150000', 'valid_until': '31/03/2020'},
            },
            format='json',
        )
        self.assertEqual(response.data['expiry_status'], 'expired')
        self.assertTrue(response.data['is_expired'])
        self.assertTrue(Document.objects.get(id=document_id).is_expired)
