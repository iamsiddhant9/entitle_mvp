"""
End-to-end API tests for the citizen → profile → evaluate → explain →
certificate flow, exercising the contract shapes in docs/api-contract.md.
External services (Gemini, Polygon) are unconfigured in tests, so the
deterministic fallbacks are what get exercised.
"""
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.schemes.models import Scheme

PM_KISAN_RULES = {
    "code": "pm_kisan",
    "near_miss_threshold": 1,
    "conditions": [
        {"field": "occupation", "op": "eq", "value": "farmer", "label": "Must be a farmer"},
        {"field": "land_owned", "op": "eq", "value": True, "label": "Must own cultivable land"},
        {"field": "income", "op": "lte", "value": 200000, "label": "Annual family income must be at most ₹2,00,000"},
    ],
}

PMJJBY_RULES = {
    "code": "pmjjby",
    "near_miss_threshold": 1,
    "conditions": [
        {"field": "age", "op": "gte", "value": 18, "label": "Must be at least 18 years old"},
        {"field": "age", "op": "lte", "value": 50, "label": "Must be at most 50 years old"},
        {"field": "bank_account", "op": "eq", "value": True, "label": "Must have a savings bank account"},
    ],
}


class EligibilityFlowTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.pm_kisan = Scheme.objects.create(
            code="pm_kisan",
            name="PM Kisan Samman Nidhi",
            domain="Agriculture",
            rules_json=PM_KISAN_RULES,
            required_documents_json=["aadhaar_card", "land_ownership_document"],
            source_url="https://pmkisan.gov.in/",
        )
        cls.pmjjby = Scheme.objects.create(
            code="pmjjby",
            name="PM Jeevan Jyoti Bima Yojana",
            domain="Insurance",
            rules_json=PMJJBY_RULES,
            required_documents_json=["aadhaar_card", "bank_passbook"],
            source_url="https://www.jansuraksha.gov.in/",
        )

    def create_citizen(self):
        response = self.client.post("/api/citizens/")
        self.assertEqual(response.status_code, 201)
        return response.data["citizen_id"]

    def test_full_flow_eligible_and_near_miss(self):
        citizen_id = self.create_citizen()

        patch = self.client.patch(
            "/api/citizens/{}/profile/".format(citizen_id),
            {"age": 55, "occupation": "farmer", "income": 150000, "land_owned": True, "bank_account": True},
            format="json",
        )
        self.assertEqual(patch.status_code, 200)
        self.assertEqual(patch.data["age"], 55)

        evaluate = self.client.post("/api/eligibility/evaluate/", {"citizen_id": citizen_id}, format="json")
        self.assertEqual(evaluate.status_code, 200)
        by_code = {r["scheme_code"]: r for r in evaluate.data["results"]}
        self.assertEqual(by_code["pm_kisan"]["status"], "eligible")
        # age 55 > PMJJBY's 50 cap, one failing condition → near miss
        self.assertEqual(by_code["pmjjby"]["status"], "near_miss")
        self.assertEqual(by_code["pmjjby"]["missing_rules"][0]["field"], "age")

        results = self.client.get("/api/eligibility/results/{}/".format(citizen_id))
        self.assertEqual(results.status_code, 200)
        self.assertEqual(len(results.data), 2)
        self.assertIn("created_at", results.data[0])

    def test_reevaluation_updates_in_place(self):
        citizen_id = self.create_citizen()
        self.client.patch(
            "/api/citizens/{}/profile/".format(citizen_id),
            {"age": 30, "occupation": "farmer", "income": 300000, "land_owned": True, "bank_account": True},
            format="json",
        )
        first = self.client.post("/api/eligibility/evaluate/", {"citizen_id": citizen_id}, format="json")
        self.assertEqual({r["scheme_code"]: r["status"] for r in first.data["results"]}["pm_kisan"], "near_miss")

        self.client.patch("/api/citizens/{}/profile/".format(citizen_id), {"income": 100000}, format="json")
        second = self.client.post("/api/eligibility/evaluate/", {"citizen_id": citizen_id}, format="json")
        self.assertEqual({r["scheme_code"]: r["status"] for r in second.data["results"]}["pm_kisan"], "eligible")

        # still one row per citizen+scheme
        results = self.client.get("/api/eligibility/results/{}/".format(citizen_id))
        self.assertEqual(len(results.data), 2)

    def test_error_envelope_for_unknown_citizen(self):
        response = self.client.post(
            "/api/eligibility/evaluate/",
            {"citizen_id": "00000000-0000-0000-0000-000000000000"},
            format="json",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["error"]["code"], "CITIZEN_NOT_FOUND")
        self.assertIn("message", response.data["error"])

    def test_schemes_endpoints(self):
        listing = self.client.get("/api/schemes/")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(len(listing.data), 2)

        detail = self.client.get("/api/schemes/pm_kisan/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["rules_json"]["code"], "pm_kisan")
        self.assertIn("required_documents_json", detail.data)

        missing = self.client.get("/api/schemes/does_not_exist/")
        self.assertEqual(missing.status_code, 404)
        self.assertEqual(missing.data["error"]["code"], "SCHEME_NOT_FOUND")


class ExplainAndCertificateTests(APITestCase):
    def setUp(self):
        self.scheme = Scheme.objects.create(
            code="pm_kisan",
            name="PM Kisan Samman Nidhi",
            domain="Agriculture",
            benefit="₹6,000 per year",
            rules_json=PM_KISAN_RULES,
            source_url="https://pmkisan.gov.in/",
        )
        self.citizen_id = self.client.post("/api/citizens/").data["citizen_id"]
        self.client.patch(
            "/api/citizens/{}/profile/".format(self.citizen_id),
            {"occupation": "farmer", "income": 150000, "land_owned": True},
            format="json",
        )
        evaluate = self.client.post("/api/eligibility/evaluate/", {"citizen_id": self.citizen_id}, format="json")
        self.result_id = evaluate.data["results"][0]["id"]

    def test_explain_fallback_without_gemini(self):
        response = self.client.post("/api/explain/", {"eligibility_result_id": self.result_id}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["eligibility_result_id"], self.result_id)
        self.assertIn("PM Kisan", response.data["explanation"])
        self.assertIn("eligible", response.data["explanation"].lower())

    def test_knowledge_ask_fallback(self):
        response = self.client.post(
            "/api/knowledge/ask/",
            {"question": "What is the benefit?", "scheme_code": "pm_kisan"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["answer"])
        self.assertEqual(response.data["source_url"], "https://pmkisan.gov.in/")

    def test_certificate_issue_and_verify_simulated(self):
        issue = self.client.post("/api/certificates/issue/", {"eligibility_result_id": self.result_id}, format="json")
        self.assertEqual(issue.status_code, 201)
        self.assertTrue(issue.data["eligibility_hash"].startswith("0x"))
        self.assertEqual(len(issue.data["eligibility_hash"]), 66)
        self.assertEqual(issue.data["chain_status"], "simulated")

        cert_id = issue.data["certificate_id"]
        detail = self.client.get("/api/certificates/{}/".format(cert_id))
        self.assertEqual(detail.status_code, 200)
        self.assertIn(issue.data["eligibility_hash"], detail.data["qr_payload"])
        self.assertEqual(detail.data["payload"]["scheme_code"], "pm_kisan")

        verify = self.client.get("/api/certificates/verify/{}/".format(issue.data["eligibility_hash"]))
        self.assertEqual(verify.status_code, 200)
        self.assertTrue(verify.data["exists"])

        bogus = self.client.get("/api/certificates/verify/0x{}/".format("ab" * 32))
        self.assertEqual(bogus.status_code, 200)
        self.assertFalse(bogus.data["exists"])

    def test_certificate_hash_is_deterministic(self):
        from apps.certificates.services.hashing import hash_payload

        payload = {"b": 2, "a": 1, "nested": {"y": [1, 2], "x": "ट"}}
        self.assertEqual(hash_payload(payload), hash_payload({"nested": {"x": "ट", "y": [1, 2]}, "a": 1, "b": 2}))
