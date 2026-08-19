"""Gemini extraction: structured output, validation, provenance, and above all the
guarantee that a failed extraction never produces document data."""

from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from apps.documents.document_types import get_spec
from apps.documents.services import groq_vision
from apps.documents.services.groq_vision import ExtractionResult, extract_fields

from .fixtures import (
    LEGACY_FABRICATED_VALUES,
    SAMPLE_AADHAAR_PAYLOAD,
    SAMPLE_INCOME_PAYLOAD,
    SAMPLE_LAND_PAYLOAD,
    FakeResponse,
    FakeResponseNoCandidates,
)

AADHAAR = get_spec('aadhaar_card')
INCOME = get_spec('income_certificate')
PASSBOOK = get_spec('bank_passbook')

PATCH_TARGET = 'apps.documents.services.groq_vision._generate'


def _extract(spec=AADHAAR) -> ExtractionResult:
    return extract_fields(image_bytes=b'fake-jpeg-bytes', mime_type='image/jpeg', spec=spec)


class NoFabricationTests(SimpleTestCase):
    """Every failure mode must yield empty fields — never invented values."""

    def assert_no_fabrication(self, result: ExtractionResult):
        self.assertEqual(result.fields, {})
        self.assertNotEqual(result.status, groq_vision.STATUS_SUCCESS)
        self.assertEqual(result.source, groq_vision.SOURCE_NONE)
        serialised = str(result.fields)
        for fabricated in LEGACY_FABRICATED_VALUES:
            self.assertNotIn(fabricated, serialised)

    @override_settings(GROQ_API_KEY='')
    def test_missing_api_key(self):
        result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_NOT_CONFIGURED)
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='your-groq-api-key')
    def test_placeholder_api_key_is_treated_as_unconfigured(self):
        """The placeholder shipped in .env.example and docker-compose.yml."""
        result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_NOT_CONFIGURED)
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='your_groq_key_here')
    def test_docker_placeholder_api_key_is_treated_as_unconfigured(self):
        result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_NOT_CONFIGURED)
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='real-key')
    def test_api_exception(self):
        with patch(PATCH_TARGET, side_effect=RuntimeError('upstream exploded')):
            result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='real-key')
    def test_sdk_import_failure(self):
        with patch(PATCH_TARGET, side_effect=ImportError('no module named google')):
            result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assertEqual(result.error, 'sdk_unavailable')
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='real-key')
    def test_malformed_json(self):
        with patch(PATCH_TARGET, return_value=FakeResponse(text='{"name": "Rekha"')):
            result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assertEqual(result.error, 'invalid_json')
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='real-key')
    def test_non_object_json_array(self):
        with patch(PATCH_TARGET, return_value=FakeResponse(text='["a", "b"]')):
            result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assertEqual(result.error, 'non_object_response')
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='real-key')
    def test_non_object_json_scalar(self):
        with patch(PATCH_TARGET, return_value=FakeResponse(text='42')):
            result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assertEqual(result.error, 'non_object_response')
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='real-key')
    def test_null_json(self):
        with patch(PATCH_TARGET, return_value=FakeResponse(text='null')):
            result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='real-key')
    def test_empty_response(self):
        with patch(PATCH_TARGET, return_value=FakeResponse(text=None)):
            result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assertEqual(result.error, 'empty_response')
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='real-key')
    def test_safety_block(self):
        with patch(PATCH_TARGET, return_value=FakeResponse(block_reason='SAFETY')):
            result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assertEqual(result.error, 'blocked_by_safety')
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='real-key')
    def test_no_candidates(self):
        with patch(PATCH_TARGET, return_value=FakeResponseNoCandidates()):
            result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assertEqual(result.error, 'no_candidates')
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='real-key')
    def test_truncated_response(self):
        with patch(PATCH_TARGET, return_value=FakeResponse(text='{}', finish_reason='MAX_TOKENS')):
            result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assertEqual(result.error, 'response_truncated')
        self.assert_no_fabrication(result)

    @override_settings(GROQ_API_KEY='real-key')
    def test_all_null_payload_is_not_success(self):
        """A call that returns only nulls found nothing; reporting success would
        present an empty result as a verified reading."""
        payload = {name: None for name in AADHAAR.field_names}
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=payload)):
            result = _extract()
        self.assertEqual(result.status, groq_vision.STATUS_FAILED)
        self.assertEqual(result.error, 'no_fields_extracted')
        self.assert_no_fabrication(result)

    def test_document_type_without_schema(self):
        result = _extract(spec=PASSBOOK)
        self.assertEqual(result.status, groq_vision.STATUS_UNSUPPORTED_DOC_TYPE)
        self.assert_no_fabrication(result)


@override_settings(GROQ_API_KEY='real-key')
class SuccessfulExtractionTests(SimpleTestCase):
    def test_success_returns_normalised_fields_and_provenance(self):
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=dict(SAMPLE_AADHAAR_PAYLOAD))):
            result = _extract()

        self.assertEqual(result.status, groq_vision.STATUS_SUCCESS)
        self.assertEqual(result.source, groq_vision.SOURCE_GROQ)
        self.assertEqual(result.model, groq_vision.get_model_name())
        self.assertEqual(result.fields['name'], 'Rekha Devi Sharma')
        self.assertEqual(result.fields['dob'], '12/07/1988')

    def test_aadhaar_number_is_masked_before_it_can_be_stored(self):
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=dict(SAMPLE_AADHAAR_PAYLOAD))):
            result = _extract()
        self.assertEqual(result.fields['aadhaar_no'], 'XXXX-XXXX-2109')
        self.assertNotIn('4321', str(result.fields))

    def test_response_text_is_used_when_parsed_is_absent(self):
        import json

        with patch(
            PATCH_TARGET,
            return_value=FakeResponse(text=json.dumps(SAMPLE_INCOME_PAYLOAD)),
        ):
            result = _extract(spec=INCOME)
        self.assertEqual(result.status, groq_vision.STATUS_SUCCESS)
        self.assertEqual(result.fields['annual_income'], SAMPLE_INCOME_PAYLOAD['annual_income'])

    def test_key_aliases_are_normalised(self):
        payload = {
            "Full Name": "Rekha Devi Sharma",
            "Aadhaar Number": "4321 8765 2109",
            "Date of Birth": "12/07/1988",
            "Sex": "Female",
        }
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=payload)):
            result = _extract()
        self.assertEqual(result.fields['name'], 'Rekha Devi Sharma')
        self.assertEqual(result.fields['aadhaar_no'], 'XXXX-XXXX-2109')
        self.assertEqual(result.fields['dob'], '12/07/1988')
        self.assertEqual(result.fields['gender'], 'Female')

    def test_hindi_keys_are_normalised(self):
        payload = {"नाम": "रेखा देवी", "आधार संख्या": "4321 8765 2109"}
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=payload)):
            result = _extract()
        self.assertEqual(result.fields['name'], 'रेखा देवी')
        self.assertEqual(result.fields['aadhaar_no'], 'XXXX-XXXX-2109')

    def test_unknown_keys_are_dropped(self):
        payload = dict(SAMPLE_AADHAAR_PAYLOAD, injected_field='evil', another='x')
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=payload)):
            result = _extract()
        self.assertNotIn('injected_field', result.fields)
        self.assertNotIn('another', result.fields)
        self.assertLessEqual(set(result.fields), set(AADHAAR.field_names))

    def test_null_and_placeholder_values_are_dropped(self):
        payload = dict(SAMPLE_AADHAAR_PAYLOAD, dob=None, gender='N/A', state='not visible')
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=payload)):
            result = _extract()
        self.assertNotIn('dob', result.fields)
        self.assertNotIn('gender', result.fields)
        self.assertNotIn('state', result.fields)

    def test_oversized_values_are_bounded(self):
        payload = dict(SAMPLE_AADHAAR_PAYLOAD, name='A' * 5000)
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=payload)):
            result = _extract()
        self.assertLessEqual(len(result.fields['name']), 200)

    def test_request_uses_structured_json_config(self):
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=dict(SAMPLE_AADHAAR_PAYLOAD))) as mock:
            _extract()
        kwargs = mock.call_args.kwargs
        self.assertEqual(kwargs['mime_type'], 'image/jpeg')
        self.assertEqual(kwargs['model'], groq_vision.get_model_name())
        schema = kwargs['response_schema']
        self.assertEqual(schema['type'], 'object')
        self.assertEqual(set(schema['properties']), set(AADHAAR.field_names))
        # The Gemini Developer API rejects additionalProperties client-side.
        self.assertNotIn('additionalProperties', schema)

    def test_land_document_schema_normalises(self):
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=dict(SAMPLE_LAND_PAYLOAD))):
            result = _extract(spec=get_spec('land_ownership_document'))
        self.assertEqual(result.status, groq_vision.STATUS_SUCCESS)
        self.assertEqual(result.fields['owner_name'], 'Rekha Devi Sharma')
        self.assertEqual(result.fields['khasra_no'], '778/3')

    def test_land_document_owner_alias_maps_from_name(self):
        payload = {"Name": "Rekha Devi Sharma", "Survey Number": "778/3"}
        with patch(PATCH_TARGET, return_value=FakeResponse(parsed=payload)):
            result = _extract(spec=get_spec('land_ownership_document'))
        self.assertEqual(result.fields['owner_name'], 'Rekha Devi Sharma')
        self.assertEqual(result.fields['khasra_no'], '778/3')

    def test_schema_is_not_mutated_between_calls(self):
        """The SDK's transformer mutates the schema dict it is given, so a fresh copy
        must be produced per call."""
        first = AADHAAR.response_schema()
        second = AADHAAR.response_schema()
        self.assertEqual(first, second)
        first['properties'].clear()
        self.assertNotEqual(first, AADHAAR.response_schema())
