"""End-to-end: documents influence eligibility only after human confirmation, and the
deterministic rule engine remains the sole decision maker.
"""

from rest_framework import status

from apps.citizens.models import CitizenProfile
from apps.eligibility.models import EligibilityResult
from apps.schemes.models import Scheme

from .fixtures import DocumentTestCase, sharp_document_bytes, upload_file

UPLOAD_URL = '/api/documents/upload/'
EVALUATE_URL = '/api/eligibility/evaluate/'


class DocumentDrivenEligibilityTests(DocumentTestCase):
    """PM Kisan requires occupation=farmer, land_owned=True and income<=200000.

    The citizen declares only their occupation; the other two facts can come from
    confirmed documents.
    """

    def setUp(self):
        super().setUp()
        self.citizen = CitizenProfile.objects.create(occupation="farmer")
        self.scheme = Scheme.objects.create(
            code="pm_kisan",
            name="PM Kisan Samman Nidhi",
            description="Income support for landholding farmer families.",
            rules_json={
                "code": "pm_kisan",
                "near_miss_threshold": 1,
                "conditions": [
                    {"field": "occupation", "op": "eq", "value": "farmer"},
                    {"field": "land_owned", "op": "eq", "value": True},
                    {"field": "income", "op": "lte", "value": 200000},
                ],
            },
            required_documents_json=["land_ownership_document", "aadhaar_card"],
        )

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
        response = self.client.post(
            f'/api/documents/{document_id}/confirm/',
            {
                'confirmed': True,
                'citizen_id': str(self.citizen.citizen_id),
                'extracted_fields': fields,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response

    def _evaluate(self):
        response = self.client.post(
            EVALUATE_URL, {"citizen_id": str(self.citizen.citizen_id)}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return next(r for r in response.data['results'] if r['scheme_code'] == 'pm_kisan')

    def test_unconfirmed_documents_cannot_influence_eligibility(self):
        self._upload('land_ownership_document')
        self._upload('income_certificate')

        result = self._evaluate()
        self.assertEqual(result['status'], 'not_eligible')
        missing_fields = {rule['field'] for rule in result['missing_rules']}
        self.assertEqual(missing_fields, {'land_owned', 'income'})

    def test_confirmed_documents_make_the_citizen_eligible(self):
        land_id = self._upload('land_ownership_document')
        self._confirm(land_id, {'owner_name': 'Rekha Devi', 'khasra_no': '778/3'})

        income_id = self._upload('income_certificate')
        self._confirm(
            income_id, {'annual_income': 'Rs. 1,50,000', 'valid_until': '31/03/2027'}
        )

        result = self._evaluate()
        self.assertEqual(result['status'], 'eligible')
        self.assertEqual(result['missing_rules'], [])

    def test_confirming_one_document_moves_the_citizen_to_near_miss(self):
        land_id = self._upload('land_ownership_document')
        self._confirm(land_id, {'owner_name': 'Rekha Devi', 'khasra_no': '778/3'})

        result = self._evaluate()
        self.assertEqual(result['status'], 'near_miss')
        self.assertEqual([r['field'] for r in result['missing_rules']], ['income'])

    def test_expired_certificate_does_not_make_the_citizen_eligible(self):
        land_id = self._upload('land_ownership_document')
        self._confirm(land_id, {'owner_name': 'Rekha Devi', 'khasra_no': '778/3'})

        income_id = self._upload('income_certificate')
        self._confirm(
            income_id, {'annual_income': 'Rs. 1,50,000', 'valid_until': '31/03/2020'}
        )

        result = self._evaluate()
        self.assertEqual(result['status'], 'near_miss')
        self.assertEqual([r['field'] for r in result['missing_rules']], ['income'])

    def test_evaluation_is_deterministic_and_repeatable(self):
        land_id = self._upload('land_ownership_document')
        self._confirm(land_id, {'owner_name': 'Rekha Devi', 'khasra_no': '778/3'})
        income_id = self._upload('income_certificate')
        self._confirm(income_id, {'annual_income': '150000'})

        first = self._evaluate()
        second = self._evaluate()
        self.assertEqual(first['status'], second['status'])
        self.assertEqual(first['matched_rules'], second['matched_rules'])
        self.assertEqual(EligibilityResult.objects.filter(citizen=self.citizen).count(), 1)

    def test_document_data_reaches_eligibility_only_through_the_profile(self):
        """The rule engine reads CitizenProfile and nothing else — no document field
        bypasses it."""
        income_id = self._upload('income_certificate')
        self._confirm(income_id, {'annual_income': '150000'})

        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.income, 150000)

        result = self._evaluate()
        matched_fields = {rule['field'] for rule in result['matched_rules']}
        self.assertIn('income', matched_fields)
