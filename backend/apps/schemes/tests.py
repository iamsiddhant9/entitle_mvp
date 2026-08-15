from django.test import TestCase
from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework import status
from .models import Scheme

class SchemeAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        call_command('seed_schemes')

    def test_list_schemes(self):
        response = self.client.get('/api/schemes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 12)
        codes = [s['code'] for s in response.data]
        self.assertIn('pm_kisan', codes)
        self.assertIn('pmay_g', codes)

    def test_get_scheme_detail(self):
        response = self.client.get('/api/schemes/pm_kisan/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 'pm_kisan')
        self.assertIn('rules_json', response.data)
        self.assertIn('required_documents_json', response.data)
        self.assertIn('land_ownership_document', response.data['required_documents_json'])

    def test_create_scheme(self):
        payload = {
            "code": "test_scheme",
            "name": "Test Welfare Scheme",
            "description": "Test description",
            "ministry": "Test Ministry",
            "rules_json": {"conditions": [{"field": "age", "op": "gte", "value": 18}]},
            "required_documents_json": ["aadhaar_card"],
            "source_url": "https://example.gov.in"
        }
        res = self.client.post('/api/schemes/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['code'], 'test_scheme')

    def test_unknown_scheme_error_envelope(self):
        res = self.client.get('/api/schemes/unknown_xyz/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', res.data)
        self.assertEqual(res.data['error']['code'], 'NOT_FOUND')
