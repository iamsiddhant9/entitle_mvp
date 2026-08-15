from django.test import TestCase
from django.core.management import call_command
from rest_framework.test import APIClient
from rest_framework import status
from apps.citizens.models import CitizenProfile
from apps.schemes.models import Scheme
from apps.eligibility.models import EligibilityResult
from apps.certificates.models import Certificate

class CertificateAPITestCase(TestCase):
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

    def test_issue_certificate(self):
        payload = {"eligibility_result_id": self.result.id}
        res = self.client.post('/api/certificates/issue/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('eligibility_hash', res.data)
        self.assertIn('tx_hash', res.data)
        self.assertIn('explorer_url', res.data)
        self.assertTrue(res.data['eligibility_hash'].startswith('0x'))

        cert_id = res.data['certificate_id']
        get_res = self.client.get(f'/api/certificates/{cert_id}/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['eligibility_hash'], res.data['eligibility_hash'])
