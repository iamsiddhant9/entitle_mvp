"""Document expiry parsing and status."""

from datetime import date

from django.test import SimpleTestCase

from apps.documents.document_types import get_spec
from apps.documents.services.expiry import (
    STATUS_EXPIRED,
    STATUS_NOT_APPLICABLE,
    STATUS_UNKNOWN,
    STATUS_VALID,
    evaluate_expiry,
    is_expired,
    parse_document_date,
)

INCOME = get_spec('income_certificate')
AADHAAR = get_spec('aadhaar_card')
PASSBOOK = get_spec('bank_passbook')

TODAY = date(2026, 8, 15)


class DateParsingTests(SimpleTestCase):
    def test_iso_format(self):
        self.assertEqual(parse_document_date('2027-03-31'), date(2027, 3, 31))

    def test_day_first_slash_format(self):
        self.assertEqual(parse_document_date('31/03/2027'), date(2027, 3, 31))

    def test_day_first_dash_format(self):
        self.assertEqual(parse_document_date('31-03-2027'), date(2027, 3, 31))

    def test_day_first_dot_format(self):
        self.assertEqual(parse_document_date('31.03.2027'), date(2027, 3, 31))

    def test_ambiguous_numeric_date_is_read_day_first(self):
        """Indian government documents print DD/MM/YYYY."""
        self.assertEqual(parse_document_date('01/02/2027'), date(2027, 2, 1))

    def test_textual_month(self):
        self.assertEqual(parse_document_date('31 March 2027'), date(2027, 3, 31))
        self.assertEqual(parse_document_date('31 Mar 2027'), date(2027, 3, 31))

    def test_whitespace_is_tolerated(self):
        self.assertEqual(parse_document_date('  31/03/2027 '), date(2027, 3, 31))

    def test_unparseable_values_return_none(self):
        for value in ('', '   ', 'sometime next year', '31/13/2027', 'null', '2027'):
            self.assertIsNone(parse_document_date(value), f"unexpectedly parsed {value!r}")

    def test_two_digit_years_are_refused_rather_than_guessed(self):
        self.assertIsNone(parse_document_date('31/03/27'))

    def test_absurd_years_are_refused(self):
        self.assertIsNone(parse_document_date('31/03/1687'))

    def test_none_and_non_strings(self):
        self.assertIsNone(parse_document_date(None))
        self.assertIsNone(parse_document_date(12345))


class ExpiryEvaluationTests(SimpleTestCase):
    def test_future_date_is_valid(self):
        status, parsed = evaluate_expiry(INCOME, {'valid_until': '31/03/2027'}, today=TODAY)
        self.assertEqual(status, STATUS_VALID)
        self.assertEqual(parsed, date(2027, 3, 31))
        self.assertFalse(is_expired(status))

    def test_past_date_is_expired(self):
        status, parsed = evaluate_expiry(INCOME, {'valid_until': '31/03/2024'}, today=TODAY)
        self.assertEqual(status, STATUS_EXPIRED)
        self.assertEqual(parsed, date(2024, 3, 31))
        self.assertTrue(is_expired(status))

    def test_missing_date_is_unknown_not_expired(self):
        status, parsed = evaluate_expiry(INCOME, {'annual_income': '150000'}, today=TODAY)
        self.assertEqual(status, STATUS_UNKNOWN)
        self.assertIsNone(parsed)
        self.assertFalse(is_expired(status))

    def test_unparseable_date_is_unknown_not_expired(self):
        status, parsed = evaluate_expiry(INCOME, {'valid_until': 'whenever'}, today=TODAY)
        self.assertEqual(status, STATUS_UNKNOWN)
        self.assertIsNone(parsed)
        self.assertFalse(is_expired(status))

    def test_type_without_expiry_is_not_applicable(self):
        status, parsed = evaluate_expiry(AADHAAR, {'valid_until': '31/03/2024'}, today=TODAY)
        self.assertEqual(status, STATUS_NOT_APPLICABLE)
        self.assertIsNone(parsed)
        self.assertFalse(is_expired(status))

    def test_type_without_schema_is_not_applicable(self):
        status, _ = evaluate_expiry(PASSBOOK, {}, today=TODAY)
        self.assertEqual(status, STATUS_NOT_APPLICABLE)

    def test_missing_spec_is_not_applicable(self):
        status, _ = evaluate_expiry(None, {'valid_until': '31/03/2024'}, today=TODAY)
        self.assertEqual(status, STATUS_NOT_APPLICABLE)

    def test_empty_fields(self):
        status, _ = evaluate_expiry(INCOME, None, today=TODAY)
        self.assertEqual(status, STATUS_UNKNOWN)

    def test_expiry_today_is_still_valid(self):
        status, _ = evaluate_expiry(INCOME, {'valid_until': '15/08/2026'}, today=TODAY)
        self.assertEqual(status, STATUS_VALID)
