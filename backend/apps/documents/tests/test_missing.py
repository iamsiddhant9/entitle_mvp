"""Missing-document diff: only confirmed, in-date documents satisfy a requirement."""

from rest_framework import status

from apps.citizens.models import CitizenProfile
from apps.documents.models import Document
from apps.schemes.models import Scheme

from .fixtures import DocumentTestCase


class MissingDocumentsTests(DocumentTestCase):
    def setUp(self):
        super().setUp()
        self.citizen = CitizenProfile.objects.create(
            age=35, state="Maharashtra", occupation="farmer"
        )
        self.scheme = Scheme.objects.create(
            code="pm_kisan",
            name="PM Kisan Samman Nidhi",
            description="Test description",
            required_documents_json=["land_ownership_document", "aadhaar_card"],
        )

    def _get(self):
        return self.client.get(
            f'/api/documents/missing/{self.citizen.citizen_id}/{self.scheme.code}/'
        )

    def test_confirmed_document_counts(self):
        Document.objects.create(
            citizen=self.citizen, doc_type='aadhaar_card', confirmed=True
        )

        response = self._get()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data['required_documents'],
            ["land_ownership_document", "aadhaar_card"],
        )
        self.assertEqual(response.data['uploaded_documents'], ["aadhaar_card"])
        self.assertEqual(response.data['missing_documents'], ["land_ownership_document"])

    def test_unconfirmed_document_does_not_count(self):
        """The old implementation counted every upload when nothing was confirmed,
        which let unreviewed files satisfy a scheme's requirements."""
        Document.objects.create(
            citizen=self.citizen, doc_type='aadhaar_card', confirmed=False
        )
        Document.objects.create(
            citizen=self.citizen, doc_type='land_ownership_document', confirmed=False
        )

        response = self._get()
        self.assertEqual(response.data['uploaded_documents'], [])
        self.assertEqual(
            response.data['missing_documents'],
            ["land_ownership_document", "aadhaar_card"],
        )
        self.assertEqual(
            sorted(response.data['unconfirmed_documents']),
            ["aadhaar_card", "land_ownership_document"],
        )

    def test_expired_document_does_not_count(self):
        Document.objects.create(
            citizen=self.citizen,
            doc_type='aadhaar_card',
            confirmed=True,
            is_expired=True,
        )

        response = self._get()
        self.assertEqual(response.data['uploaded_documents'], [])
        self.assertIn('aadhaar_card', response.data['missing_documents'])
        self.assertEqual(response.data['expired_documents'], ['aadhaar_card'])

    def test_all_requirements_satisfied(self):
        for doc_type in ("aadhaar_card", "land_ownership_document"):
            Document.objects.create(
                citizen=self.citizen, doc_type=doc_type, confirmed=True
            )

        response = self._get()
        self.assertEqual(response.data['missing_documents'], [])

    def test_another_citizens_documents_do_not_count(self):
        other = CitizenProfile.objects.create()
        Document.objects.create(citizen=other, doc_type='aadhaar_card', confirmed=True)

        response = self._get()
        self.assertEqual(response.data['uploaded_documents'], [])

    def test_unknown_citizen(self):
        response = self.client.get(
            f'/api/documents/missing/00000000-0000-0000-0000-000000000000/{self.scheme.code}/'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unknown_scheme(self):
        response = self.client.get(
            f'/api/documents/missing/{self.citizen.citizen_id}/not_a_scheme/'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
