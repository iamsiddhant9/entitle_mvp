"""The non-Gemini fallback explanation.

This path runs whenever Gemini is unavailable — which, with no API key configured, is
always. It must be genuinely useful and must never leak rule-engine syntax.
"""

from django.test import SimpleTestCase

from apps.explain.services.gemini_client import _get_fallback_explanation

#: Substrings that would mean engine internals reached a citizen.
FORBIDDEN = ("lte", "gte", "neq", "'field'", "'op'", "'value'", "requires", "{", "}", "[", "]")

PM_KISAN_RULES = [
    {"field": "occupation", "op": "eq", "value": "farmer"},
    {"field": "land_owned", "op": "eq", "value": True},
    {"field": "income", "op": "lte", "value": 200000},
]

PMJAY_RULE = [{"field": "income", "op": "lte", "value": 500000}]


class NoSyntaxLeakTests(SimpleTestCase):
    """The previous implementation leaked in 5 of 6 status/language branches."""

    def assert_clean(self, text):
        self.assertTrue(text.strip(), "explanation must not be empty")
        for token in FORBIDDEN:
            self.assertNotIn(token, text, f"leaked {token!r} in: {text}")
        # Bare `eq`/`lt`/`gt` as standalone words.
        for token in ("eq", "lt", "gt"):
            self.assertNotIn(f" {token} ", text, f"leaked {token!r} in: {text}")
        # Python booleans rendered raw.
        self.assertNotIn("True", text)
        self.assertNotIn("False", text)

    def test_all_status_and_language_combinations_are_clean(self):
        cases = [
            ("eligible", PM_KISAN_RULES, []),
            ("near_miss", PM_KISAN_RULES[:2], [PM_KISAN_RULES[2]]),
            ("not_eligible", [], PM_KISAN_RULES),
        ]
        for status, matched, missing in cases:
            for language in ("en", "hi"):
                with self.subTest(status=status, language=language):
                    text = _get_fallback_explanation(
                        "PM Kisan Samman Nidhi", status, matched, missing, language
                    )
                    self.assert_clean(text)

    def test_the_exact_previously_leaking_pmjay_case(self):
        """Used to render: '... due to the following criteria: income (requires lte 500000).'"""
        text = _get_fallback_explanation(
            "Ayushman Bharat (PMJAY)", "not_eligible", [], PMJAY_RULE, "en"
        )
        self.assertNotIn("requires", text)
        self.assertNotIn("lte", text)
        self.assertIn("₹5,00,000", text)

    def test_list_valued_rule_does_not_leak_python_repr(self):
        rules = [
            {"field": "occupation", "op": "in", "value": ["self_employed", "worker", "artisan"]}
        ]
        text = _get_fallback_explanation("PM Mudra Yojana", "not_eligible", [], rules, "en")
        self.assertNotIn("['", text)
        self.assertIn("self employed", text)


class ContentTests(SimpleTestCase):
    def test_eligible_explanation_states_eligibility(self):
        text = _get_fallback_explanation(
            "PM Kisan Samman Nidhi", "eligible", PM_KISAN_RULES, [], "en"
        )
        self.assertIn("eligible", text.lower())
        self.assertNotIn("not eligible", text.lower())
        self.assertIn("PM Kisan Samman Nidhi", text)

    def test_not_eligible_explanation_never_claims_eligibility(self):
        text = _get_fallback_explanation(
            "PM Kisan Samman Nidhi", "not_eligible", [], PM_KISAN_RULES, "en"
        )
        self.assertIn("not eligible", text.lower())

    def test_near_miss_names_the_missing_condition(self):
        text = _get_fallback_explanation(
            "PM Kisan Samman Nidhi", "near_miss", PM_KISAN_RULES[:2], [PM_KISAN_RULES[2]], "en"
        )
        self.assertIn("annual family income", text)
        self.assertIn("₹2,00,000", text)

    def test_singular_and_plural_are_count_accurate(self):
        """The old Hindi text hard-coded 'only ONE condition' regardless of the count."""
        one = _get_fallback_explanation("X", "near_miss", [], [PM_KISAN_RULES[2]], "en")
        self.assertIn("This condition is not met", one)

        many = _get_fallback_explanation("X", "not_eligible", [], PM_KISAN_RULES, "en")
        self.assertIn("These conditions are not met", many)

    def test_hindi_output_is_actually_hindi(self):
        text = _get_fallback_explanation(
            "PM Kisan Samman Nidhi", "eligible", PM_KISAN_RULES, [], "hi"
        )
        self.assertTrue(
            any("ऀ" <= ch <= "ॿ" for ch in text),
            f"expected Devanagari in: {text}",
        )

    def test_hindi_near_miss_is_count_accurate(self):
        many = _get_fallback_explanation("X", "not_eligible", [], PM_KISAN_RULES, "hi")
        self.assertIn("ये शर्तें", many)

    def test_empty_rule_lists_still_produce_an_explanation(self):
        text = _get_fallback_explanation("Some Scheme", "not_eligible", [], [], "en")
        self.assertIn("Some Scheme", text)
        self.assertTrue(len(text) > 20)

    def test_eligible_result_invites_the_citizen_to_apply(self):
        text = _get_fallback_explanation("X", "eligible", PM_KISAN_RULES, [], "en")
        self.assertIn("apply", text.lower())

    def test_no_other_scheme_is_ever_suggested(self):
        """The old prompt told the model to 'suggest they explore other schemes'."""
        text = _get_fallback_explanation(
            "PM Kisan Samman Nidhi", "not_eligible", [], PM_KISAN_RULES, "en"
        )
        for other in ("PMJAY", "Ayushman", "Mudra", "eShram", "Sukanya"):
            self.assertNotIn(other, text)
