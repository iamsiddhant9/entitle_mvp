from django.test import TestCase
from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework import status
from apps.citizens.models import CitizenProfile
from apps.schemes.models import Scheme
from apps.eligibility.models import EligibilityResult

class EligibilityAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        call_command('seed_schemes')
        self.citizen = CitizenProfile.objects.create(
            age=35,
            state="Maharashtra",
            occupation="farmer",
            income=150000,
            land_owned=True,
            disability=False,
            gender="female",
            caste="obc",
            has_bank_account=True
        )

    def test_evaluate_eligibility(self):
        payload = {"citizen_id": str(self.citizen.citizen_id)}
        response = self.client.post('/api/eligibility/evaluate/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['citizen_id'], str(self.citizen.citizen_id))
        results = response.data['results']
        self.assertEqual(len(results), 12)
        
        pm_kisan_res = next(r for r in results if r['scheme_code'] == 'pm_kisan')
        self.assertEqual(pm_kisan_res['status'], 'eligible')

    def test_get_results_history(self):
        # Run evaluation first
        self.client.post('/api/eligibility/evaluate/', {"citizen_id": str(self.citizen.citizen_id)}, format='json')
        
        # Retrieve results
        get_res = self.client.get(f'/api/eligibility/results/{self.citizen.citizen_id}/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.data), 12)

    def test_evaluate_invalid_citizen(self):
        payload = {"citizen_id": "00000000-0000-0000-0000-000000000000"}
        response = self.client.post('/api/eligibility/evaluate/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error']['code'], 'NOT_FOUND')
