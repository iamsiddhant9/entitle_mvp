from django.test import TestCase
from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework import status
from apps.citizens.models import CitizenProfile
from apps.schemes.models import Scheme
from apps.eligibility.models import EligibilityResult

class ExplainAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        call_command('seed_schemes')
        self.citizen = CitizenProfile.objects.create(
            age=35,
            state="Maharashtra",
            occupation="farmer",
            income=150000,
            land_owned=True
        )
        self.scheme = Scheme.objects.get(code='pm_kisan')
        self.result = EligibilityResult.objects.create(
            citizen=self.citizen,
            scheme=self.scheme,
            status='eligible',
            matched_rules=self.scheme.rules_json.get('conditions', []),
            missing_rules=[]
        )

    def test_explain_eligibility_english(self):
        payload = {
            "eligibility_result_id": self.result.id,
            "language": "en"
        }
        res = self.client.post('/api/explain/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['eligibility_result_id'], self.result.id)
        self.assertTrue(len(res.data['explanation']) > 10)

    def test_explain_eligibility_hindi(self):
        payload = {
            "eligibility_result_id": self.result.id,
            "language": "hi"
        }
        res = self.client.post('/api/explain/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['eligibility_result_id'], self.result.id)
        self.assertTrue(len(res.data['explanation']) > 5)

    def test_knowledge_ask(self):
        payload = {
            "question": "What is the financial assistance in PM Kisan?",
            "scheme_code": "pm_kisan"
        }
        res = self.client.post('/api/knowledge/ask/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('answer', res.data)
        self.assertIn('source_url', res.data)
