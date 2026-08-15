"""The /api/explain/ and /api/knowledge/ask/ endpoints.

Every test pins GEMINI_API_KEY so behaviour does not depend on the developer's environment
and no test can reach the network. The Gemini path is exercised by patching the `_generate`
seam; live model behaviour is a separate manual check requiring a real key.
"""

from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.citizens.models import CitizenProfile
from apps.eligibility.models import EligibilityResult
from apps.schemes.models import Scheme

EXPLAIN_URL = '/api/explain/'
ASK_URL = '/api/knowledge/ask/'
GENERATE = 'apps.explain.services.gemini_client._generate'


@override_settings(GEMINI_API_KEY='')
class ExplainEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        call_command('seed_schemes')
        self.citizen = CitizenProfile.objects.create(
            age=35,
            state="Maharashtra",
            occupation="farmer",
            income=150000,
            land_owned=True,
        )
        self.other_citizen = CitizenProfile.objects.create(occupation="student")
        self.scheme = Scheme.objects.get(code='pm_kisan')
        self.result = EligibilityResult.objects.create(
            citizen=self.citizen,
            scheme=self.scheme,
            status='eligible',
            matched_rules=self.scheme.rules_json.get('conditions', []),
            missing_rules=[],
        )

    def _post(self, **overrides):
        payload = {
            "eligibility_result_id": self.result.id,
            "language": "en",
            "citizen_id": str(self.citizen.citizen_id),
        }
        payload.update(overrides)
        payload = {k: v for k, v in payload.items() if v is not None}
        return self.client.post(EXPLAIN_URL, payload, format='json')

    # --- Contract ---

    def test_explain_english(self):
        res = self._post()
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['eligibility_result_id'], self.result.id)
        self.assertTrue(len(res.data['explanation']) > 10)

    def test_explain_hindi(self):
        res = self._post(language="hi")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(
            any("ऀ" <= ch <= "ॿ" for ch in res.data['explanation']),
            "Hindi request should return Devanagari text",
        )

    def test_response_shape_is_unchanged(self):
        res = self._post()
        self.assertEqual(set(res.data.keys()), {"eligibility_result_id", "explanation"})

    # --- The behaviour the old tests never checked ---

    def test_explanation_never_leaks_rule_syntax(self):
        res = self._post()
        explanation = res.data['explanation']
        for token in ("lte", "gte", "'field'", "'op'", "requires", "True"):
            self.assertNotIn(token, explanation, f"leaked {token!r}: {explanation}")

    def test_explanation_agrees_with_the_engine_verdict(self):
        self.result.status = 'not_eligible'
        self.result.matched_rules = []
        self.result.missing_rules = self.scheme.rules_json['conditions']
        self.result.save()

        res = self._post()
        self.assertIn("not eligible", res.data['explanation'].lower())

    def test_near_miss_names_the_missing_condition(self):
        conditions = self.scheme.rules_json['conditions']
        self.result.status = 'near_miss'
        self.result.matched_rules = conditions[:2]
        self.result.missing_rules = [conditions[2]]
        self.result.save()

        res = self._post()
        self.assertIn("annual family income", res.data['explanation'])

    # --- Ownership ---

    def test_another_citizen_cannot_read_the_explanation(self):
        res = self._post(citizen_id=str(self.other_citizen.citizen_id))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data['error']['code'], 'PERMISSION_DENIED')

    def test_ownership_proof_is_required(self):
        res = self._post(citizen_id=None)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_integer_primary_key_does_not_prove_ownership(self):
        for guess in (str(self.citizen.id), '1', '2'):
            with self.subTest(guess=guess):
                res = self._post(citizen_id=guess)
                self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_header_proves_ownership(self):
        res = self.client.post(
            EXPLAIN_URL,
            {"eligibility_result_id": self.result.id},
            format='json',
            headers={'X-Citizen-Id': str(self.citizen.citizen_id)},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_session_proves_ownership(self):
        session = self.client.session
        session['citizen_id'] = str(self.citizen.citizen_id)
        session.save()
        res = self.client.post(
            EXPLAIN_URL, {"eligibility_result_id": self.result.id}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    # --- Validation ---

    def test_missing_result_id(self):
        res = self.client.post(EXPLAIN_URL, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_result_id(self):
        res = self._post(eligibility_result_id=999999)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_numeric_result_id(self):
        res = self._post(eligibility_result_id="not-a-number")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(GEMINI_API_KEY='')
class KnowledgeEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        call_command('seed_schemes')

    def _ask(self, **overrides):
        payload = {"question": "What is the benefit under PM Kisan?", "scheme_code": "pm_kisan"}
        payload.update(overrides)
        payload = {k: v for k, v in payload.items() if v is not None}
        return self.client.post(ASK_URL, payload, format='json')

    def test_known_scheme(self):
        res = self._ask()
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('answer', res.data)
        self.assertEqual(res.data['source_url'], 'https://pmkisan.gov.in/')
        self.assertIn('PM Kisan', res.data['answer'])

    def test_unknown_scheme_says_so_rather_than_answering_generically(self):
        """It used to return a 'Government Scheme' stub, inviting invention."""
        res = self._ask(scheme_code="not_a_real_scheme")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        answer = res.data['answer'].lower()
        self.assertIn("does not have information", answer)
        self.assertNotIn("government scheme,", answer)

    def test_absent_scheme_code_says_so(self):
        res = self._ask(scheme_code=None)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("does not have information", res.data['answer'].lower())

    def test_missing_question(self):
        res = self.client.post(ASK_URL, {"scheme_code": "pm_kisan"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_answer_does_not_leak_engine_internals(self):
        res = self._ask()
        for token in ("near_miss_threshold", "'op'", "lte"):
            self.assertNotIn(token, res.data['answer'])

    def test_alias_route_still_works(self):
        res = self.client.post(
            '/api/explain/ask/',
            {"question": "What is this?", "scheme_code": "pm_kisan"},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class GeminiPathTests(TestCase):
    """The model path, exercised through the patch seam (no network, no key needed)."""

    def setUp(self):
        self.client = APIClient()
        call_command('seed_schemes')
        self.citizen = CitizenProfile.objects.create(occupation="farmer")
        self.scheme = Scheme.objects.get(code='pm_kisan')
        self.result = EligibilityResult.objects.create(
            citizen=self.citizen,
            scheme=self.scheme,
            status='eligible',
            matched_rules=self.scheme.rules_json['conditions'],
            missing_rules=[],
        )

    def _post(self):
        return self.client.post(
            EXPLAIN_URL,
            {
                "eligibility_result_id": self.result.id,
                "citizen_id": str(self.citizen.citizen_id),
            },
            format='json',
        )

    @override_settings(GEMINI_API_KEY='real-key')
    def test_model_text_is_returned_when_available(self):
        with patch(GENERATE, return_value="You qualify because you farm your own land."):
            res = self._post()
        self.assertEqual(res.data['explanation'], "You qualify because you farm your own land.")

    @override_settings(GEMINI_API_KEY='real-key')
    def test_model_failure_falls_back_without_error(self):
        with patch(GENERATE, side_effect=RuntimeError("upstream down")):
            res = self._post()
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("eligible", res.data['explanation'].lower())
        self.assertNotIn("lte", res.data['explanation'])

    @override_settings(GEMINI_API_KEY='real-key')
    def test_empty_model_response_falls_back(self):
        with patch(GENERATE, return_value=None):
            res = self._post()
        self.assertTrue(len(res.data['explanation']) > 20)

    @override_settings(GEMINI_API_KEY='')
    def test_no_key_uses_the_fallback_without_calling_the_model(self):
        with patch(GENERATE) as mock_generate:
            res = self._post()
        mock_generate.assert_not_called()
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    @override_settings(GEMINI_API_KEY='your-gemini-api-key')
    def test_placeholder_key_is_treated_as_unconfigured(self):
        with patch(GENERATE) as mock_generate:
            self._post()
        mock_generate.assert_not_called()

    @override_settings(GEMINI_API_KEY='real-key')
    def test_knowledge_assistant_can_reach_the_model(self):
        """The legacy SDK was never installed, so this path was previously dead."""
        with patch(GENERATE, return_value="Farmers receive Rs 6000 per year.") as mock_generate:
            res = self.client.post(
                ASK_URL,
                {"question": "What is the benefit?", "scheme_code": "pm_kisan"},
                format='json',
            )
        mock_generate.assert_called_once()
        self.assertEqual(res.data['answer'], "Farmers receive Rs 6000 per year.")

    @override_settings(GEMINI_API_KEY='real-key')
    def test_unknown_scheme_never_reaches_the_model(self):
        with patch(GENERATE) as mock_generate:
            self.client.post(
                ASK_URL,
                {"question": "Tell me about it", "scheme_code": "does_not_exist"},
                format='json',
            )
        mock_generate.assert_not_called()

    @override_settings(GEMINI_API_KEY='real-key')
    def test_model_is_configured_from_settings(self):
        captured = {}

        def fake(*, api_key, model, timeout_ms, prompt):
            captured.update(model=model, timeout_ms=timeout_ms)
            return "ok"

        with override_settings(GEMINI_MODEL='gemini-2.5-flash', GEMINI_TIMEOUT_MS=12345):
            with patch(GENERATE, fake):
                self._post()

        self.assertEqual(captured['model'], 'gemini-2.5-flash')
        self.assertEqual(captured['timeout_ms'], 12345)
