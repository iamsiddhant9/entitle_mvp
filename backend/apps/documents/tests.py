import io
from PIL import Image
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from apps.citizens.models import CitizenProfile
from apps.schemes.models import Scheme
from apps.documents.models import Document

class DocumentAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.citizen = CitizenProfile.objects.create(
            age=35,
            state="Maharashtra",
            occupation="farmer"
        )
        self.scheme = Scheme.objects.create(
            code="pm_kisan",
            name="PM Kisan Samman Nidhi",
            description="Test description",
            required_documents_json=["land_ownership_document", "aadhaar_card"]
        )

    def _create_test_image(self):
        file = io.BytesIO()
        image = Image.new('RGB', (100, 100), color='white')
        image.save(file, 'jpeg')
        file.seek(0)
        return SimpleUploadedFile("test_doc.jpg", file.read(), content_type="image/jpeg")

    def test_upload_and_confirm_document(self):
        test_file = self._create_test_image()
        upload_data = {
            'file': test_file,
            'doc_type': 'aadhaar_card',
            'citizen_id': str(self.citizen.citizen_id)
        }
        res = self.client.post('/api/documents/upload/', upload_data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('document_id', res.data)
        doc_id = res.data['document_id']

        # Confirm Document
        confirm_payload = {
            "confirmed": True,
            "extracted_fields": {
                "name": "Citizen User",
                "aadhaar_no": "1234-5678-9012"
            }
        }
        confirm_res = self.client.post(f'/api/documents/{doc_id}/confirm/', confirm_payload, format='json')
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)
        self.assertTrue(confirm_res.data['confirmed'])
        self.assertEqual(confirm_res.data['extracted_fields']['name'], "Citizen User")

    def test_missing_documents_diff(self):
        # Upload only aadhaar_card and confirm
        Document.objects.create(
            citizen=self.citizen,
            doc_type='aadhaar_card',
            confirmed=True
        )

        res = self.client.get(f'/api/documents/missing/{self.citizen.citizen_id}/pm_kisan/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['required_documents'], ["land_ownership_document", "aadhaar_card"])
        self.assertEqual(res.data['uploaded_documents'], ["aadhaar_card"])
        self.assertEqual(res.data['missing_documents'], ["land_ownership_document"])
