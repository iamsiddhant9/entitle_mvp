"""
Unit tests for the deterministic rule engine. These are pure-python tests
(no database): the engine must stay importable without Django so it can be
audited and reasoned about in isolation.
"""
import unittest

from apps.eligibility.services.rule_engine import check, evaluate


class CheckOperatorTests(unittest.TestCase):
    def test_eq(self):
        self.assertTrue(check({"field": "occupation", "op": "eq", "value": "farmer"}, {"occupation": "farmer"}))
        self.assertFalse(check({"field": "occupation", "op": "eq", "value": "farmer"}, {"occupation": "student"}))

    def test_eq_boolean(self):
        self.assertTrue(check({"field": "land_owned", "op": "eq", "value": True}, {"land_owned": True}))
        self.assertFalse(check({"field": "land_owned", "op": "eq", "value": True}, {"land_owned": False}))
        self.assertTrue(check({"field": "house_owned", "op": "eq", "value": False}, {"house_owned": False}))

    def test_neq(self):
        self.assertTrue(check({"field": "state", "op": "neq", "value": "Goa"}, {"state": "Kerala"}))
        self.assertFalse(check({"field": "state", "op": "neq", "value": "Goa"}, {"state": "Goa"}))

    def test_numeric_comparisons(self):
        profile = {"income": 200000}
        self.assertTrue(check({"field": "income", "op": "lte", "value": 200000}, profile))
        self.assertFalse(check({"field": "income", "op": "lt", "value": 200000}, profile))
        self.assertTrue(check({"field": "income", "op": "gte", "value": 200000}, profile))
        self.assertFalse(check({"field": "income", "op": "gt", "value": 200000}, profile))
        self.assertTrue(check({"field": "income", "op": "lt", "value": 200001}, profile))
        self.assertTrue(check({"field": "income", "op": "gt", "value": 199999}, profile))

    def test_in(self):
        rule = {"field": "occupation", "op": "in", "value": ["self_employed", "artisan"]}
        self.assertTrue(check(rule, {"occupation": "artisan"}))
        self.assertFalse(check(rule, {"occupation": "farmer"}))

    def test_in_with_non_list_value_fails_closed(self):
        self.assertFalse(check({"field": "occupation", "op": "in", "value": "artisan"}, {"occupation": "artisan"}))

    def test_missing_field_fails(self):
        self.assertFalse(check({"field": "income", "op": "lte", "value": 100}, {}))

    def test_none_value_fails(self):
        self.assertFalse(check({"field": "income", "op": "lte", "value": 100}, {"income": None}))
        self.assertFalse(check({"field": "land_owned", "op": "eq", "value": False}, {"land_owned": None}))

    def test_unknown_operator_fails_closed(self):
        self.assertFalse(check({"field": "income", "op": "between", "value": [0, 10]}, {"income": 5}))


class EvaluateTests(unittest.TestCase):
    RULES = {
        "code": "pm_kisan",
        "near_miss_threshold": 1,
        "conditions": [
            {"field": "occupation", "op": "eq", "value": "farmer"},
            {"field": "land_owned", "op": "eq", "value": True},
            {"field": "income", "op": "lte", "value": 200000},
        ],
    }

    def test_eligible_when_all_conditions_pass(self):
        result = evaluate(self.RULES, {"occupation": "farmer", "land_owned": True, "income": 150000})
        self.assertEqual(result.status, "eligible")
        self.assertEqual(len(result.matched), 3)
        self.assertEqual(result.missing, [])

    def test_near_miss_when_within_threshold(self):
        result = evaluate(self.RULES, {"occupation": "farmer", "land_owned": True, "income": 250000})
        self.assertEqual(result.status, "near_miss")
        self.assertEqual(len(result.missing), 1)
        self.assertEqual(result.missing[0]["field"], "income")

    def test_not_eligible_beyond_threshold(self):
        result = evaluate(self.RULES, {"occupation": "student", "land_owned": False, "income": 250000})
        self.assertEqual(result.status, "not_eligible")
        self.assertEqual(len(result.missing), 3)

    def test_zero_threshold_disables_near_miss(self):
        rules = dict(self.RULES, near_miss_threshold=0)
        result = evaluate(rules, {"occupation": "farmer", "land_owned": True, "income": 250000})
        self.assertEqual(result.status, "not_eligible")

    def test_incomplete_profile_counts_as_missing(self):
        result = evaluate(self.RULES, {"occupation": "farmer", "land_owned": True})
        self.assertEqual(result.status, "near_miss")
        self.assertEqual(result.missing[0]["field"], "income")

    def test_no_conditions_means_eligible(self):
        result = evaluate({"code": "open", "conditions": []}, {})
        self.assertEqual(result.status, "eligible")

    def test_extra_rule_keys_flow_through(self):
        rules = {
            "code": "x",
            "near_miss_threshold": 1,
            "conditions": [{"field": "age", "op": "gte", "value": 18, "label": "Must be an adult"}],
        }
        result = evaluate(rules, {"age": 12})
        self.assertEqual(result.missing[0]["label"], "Must be an adult")

    def test_determinism(self):
        profile = {"occupation": "farmer", "land_owned": True, "income": 250000}
        first = evaluate(self.RULES, profile)
        for _ in range(5):
            again = evaluate(self.RULES, profile)
            self.assertEqual(again.status, first.status)
            self.assertEqual(again.matched, first.matched)
            self.assertEqual(again.missing, first.missing)


if __name__ == "__main__":
    unittest.main()
