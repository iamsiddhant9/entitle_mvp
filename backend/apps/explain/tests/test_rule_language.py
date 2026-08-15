"""Deterministic rendering of rule-engine conditions into plain language."""

from django.test import SimpleTestCase

from apps.explain.services.rule_language import (
    describe_rule,
    describe_rules,
    describe_rules_sentence,
    field_label,
    format_indian_currency,
    join_clauses,
)

#: Tokens that must never reach a citizen.
ENGINE_TOKENS = ("lte", "gte", "neq", " eq ", "'field'", "'op'", "'value'", "True", "False")


class CurrencyFormattingTests(SimpleTestCase):
    def test_indian_digit_grouping(self):
        self.assertEqual(format_indian_currency(200000), "₹2,00,000")
        self.assertEqual(format_indian_currency(500000), "₹5,00,000")
        self.assertEqual(format_indian_currency(1000000), "₹10,00,000")
        self.assertEqual(format_indian_currency(250000), "₹2,50,000")

    def test_small_amounts(self):
        self.assertEqual(format_indian_currency(0), "₹0")
        self.assertEqual(format_indian_currency(999), "₹999")
        self.assertEqual(format_indian_currency(1000), "₹1,000")

    def test_non_numeric_is_returned_unchanged(self):
        self.assertEqual(format_indian_currency("abc"), "abc")


class OperatorRenderingTests(SimpleTestCase):
    def test_every_supported_operator_has_a_plain_language_form(self):
        expected = {
            "eq": "is",
            "neq": "is not",
            "lte": "is less than or equal to",
            "gte": "is greater than or equal to",
            "lt": "is less than",
            "gt": "is greater than",
        }
        for op, phrase in expected.items():
            with self.subTest(op=op):
                rendered = describe_rule({"field": "age", "op": op, "value": 30})
                self.assertIn(phrase, rendered)
                self.assertNotIn(op, rendered.split())

    def test_income_condition(self):
        self.assertEqual(
            describe_rule({"field": "income", "op": "lte", "value": 200000}),
            "your annual family income is less than or equal to ₹2,00,000",
        )

    def test_the_exact_string_from_the_old_leak(self):
        """The PMJAY condition that used to render as 'income (requires lte 500000)'."""
        rendered = describe_rule({"field": "income", "op": "lte", "value": 500000})
        self.assertEqual(
            rendered, "your annual family income is less than or equal to ₹5,00,000"
        )
        self.assertNotIn("lte", rendered)
        self.assertNotIn("500000", rendered)

    def test_boolean_fields_read_as_statements(self):
        self.assertEqual(
            describe_rule({"field": "land_owned", "op": "eq", "value": True}),
            "you own land",
        )
        self.assertEqual(
            describe_rule({"field": "land_owned", "op": "eq", "value": False}),
            "you do not own land",
        )
        self.assertEqual(
            describe_rule({"field": "has_bank_account", "op": "eq", "value": True}),
            "you have a bank account",
        )

    def test_negated_boolean_is_equivalent_to_the_opposite(self):
        self.assertEqual(
            describe_rule({"field": "land_owned", "op": "neq", "value": True}),
            "you do not own land",
        )

    def test_list_values_are_joined_readably(self):
        rendered = describe_rule(
            {"field": "occupation", "op": "in", "value": ["self_employed", "worker", "artisan"]}
        )
        self.assertEqual(
            rendered, "your occupation is one of self employed, worker and artisan"
        )
        self.assertNotIn("[", rendered)
        self.assertNotIn("'", rendered)

    def test_text_values_have_underscores_removed(self):
        self.assertEqual(
            describe_rule({"field": "occupation", "op": "eq", "value": "farmer"}),
            "your occupation is farmer",
        )


class FieldLabelTests(SimpleTestCase):
    def test_known_fields_get_readable_labels(self):
        self.assertEqual(field_label("income"), "your annual family income")
        self.assertEqual(field_label("girl_child_age"), "the girl child's age")

    def test_unknown_field_never_exposes_a_raw_identifier(self):
        self.assertEqual(field_label("some_new_field"), "some new field")

    def test_empty_field(self):
        self.assertEqual(field_label(""), "this detail")


class RobustnessTests(SimpleTestCase):
    def test_malformed_rules_do_not_raise(self):
        for rule in (None, [], "not a rule", {}, {"field": "income"}):
            with self.subTest(rule=rule):
                describe_rule(rule)

    def test_unknown_operator_does_not_leak_the_token(self):
        rendered = describe_rule({"field": "income", "op": "between", "value": 5})
        self.assertNotIn("between", rendered)

    def test_describe_rules_drops_unrenderable_entries(self):
        rules = [{"field": "income", "op": "lte", "value": 100}, "junk", None]
        self.assertEqual(len(describe_rules(rules)), 1)

    def test_non_list_input(self):
        self.assertEqual(describe_rules(None), [])
        self.assertEqual(describe_rules({"field": "x"}), [])


class JoiningTests(SimpleTestCase):
    def test_joining(self):
        self.assertEqual(join_clauses(["a"]), "a")
        self.assertEqual(join_clauses(["a", "b"]), "a and b")
        self.assertEqual(join_clauses(["a", "b", "c"]), "a, b and c")
        self.assertEqual(join_clauses([]), "")

    def test_sentence_for_the_full_pm_kisan_rule_set(self):
        rules = [
            {"field": "occupation", "op": "eq", "value": "farmer"},
            {"field": "land_owned", "op": "eq", "value": True},
            {"field": "income", "op": "lte", "value": 200000},
        ]
        sentence = describe_rules_sentence(rules)
        self.assertEqual(
            sentence,
            "your occupation is farmer, you own land and your annual family income is "
            "less than or equal to ₹2,00,000",
        )
        for token in ENGINE_TOKENS:
            self.assertNotIn(token, sentence)


class HindiRenderingTests(SimpleTestCase):
    def test_hindi_uses_devanagari_and_no_operators(self):
        rendered = describe_rule({"field": "income", "op": "lte", "value": 200000}, "hi")
        self.assertIn("आय", rendered)
        self.assertIn("₹2,00,000", rendered)
        self.assertNotIn("lte", rendered)

    def test_hindi_boolean(self):
        self.assertEqual(
            describe_rule({"field": "land_owned", "op": "eq", "value": True}, "hi"),
            "आपके पास ज़मीन है",
        )

    def test_hindi_conjunction(self):
        self.assertEqual(join_clauses(["क", "ख", "ग"], "hi"), "क, ख और ग")

    def test_language_aliases(self):
        for language in ("hi", "Hindi", "HINDI"):
            with self.subTest(language=language):
                self.assertIn(
                    "आयु", describe_rule({"field": "age", "op": "gte", "value": 18}, language)
                )
