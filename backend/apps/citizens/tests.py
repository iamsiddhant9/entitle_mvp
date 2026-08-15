from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import CitizenProfile

class CitizenAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_citizen_session(self):
        response = self.client.post('/api/citizens/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('citizen_id', response.data)
        citizen_id = response.data['citizen_id']
        self.assertTrue(CitizenProfile.objects.filter(citizen_id=citizen_id).exists())

    def test_get_and_patch_profile(self):
        create_res = self.client.post('/api/citizens/')
        citizen_id = create_res.data['citizen_id']

        # GET Profile
        get_res = self.client.get(f'/api/citizens/{citizen_id}/profile/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['citizen_id'], citizen_id)
        self.assertIsNone(get_res.data['age'])

        # PATCH Profile
        patch_payload = {
            "age": 35,
            "state": "Maharashtra",
            "occupation": "farmer",
            "income": 150000,
            "land_owned": True,
            "disability": False,
            "gender": "female",
            "caste": "obc",
            "has_bank_account": True
        }
        patch_res = self.client.patch(f'/api/citizens/{citizen_id}/profile/', patch_payload, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['occupation'], "farmer")
        self.assertEqual(patch_res.data['income'], 150000)
        self.assertTrue(patch_res.data['land_owned'])

    def test_nonexistent_citizen_error_envelope(self):
        res = self.client.get('/api/citizens/00000000-0000-0000-0000-000000000000/profile/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', res.data)
        self.assertEqual(res.data['error']['code'], 'NOT_FOUND')
