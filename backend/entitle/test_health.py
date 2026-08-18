"""Health endpoints.

The key-leak assertions here are regression tests: ``/api/health/`` previously returned the
first 10 characters of the live Gemini API key on a public, unauthenticated route.
"""

import os
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

FAKE_KEY = 'AIzaSyFAKEKEYFORTESTSONLY0000000000000000'


class HealthCheckTests(SimpleTestCase):
    @override_settings(GEMINI_API_KEY=FAKE_KEY)
    def test_reports_configuration_without_exposing_the_key(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertTrue(payload['gemini_configured'])
        self.assertEqual(payload['gemini_model'], 'gemini-2.5-flash')

        # No prefix, no suffix, no fragment of any length.
        body = response.content.decode()
        self.assertNotIn(FAKE_KEY, body)
        for length in range(4, len(FAKE_KEY)):
            self.assertNotIn(FAKE_KEY[:length], body)
        self.assertNotIn('gemini_key_prefix', payload)

    @override_settings(GEMINI_API_KEY='')
    def test_reports_unconfigured_key(self):
        payload = self.client.get('/api/health/').json()
        self.assertFalse(payload['gemini_configured'])

    @override_settings(GEMINI_API_KEY='your-gemini-api-key')
    def test_placeholder_key_is_not_configured(self):
        payload = self.client.get('/api/health/').json()
        self.assertFalse(payload['gemini_configured'])


class GeminiSelfTestGateTests(SimpleTestCase):
    """The self-test makes live model calls, so it must stay shut by default."""

    def test_404_when_no_token_is_configured(self):
        self.assertEqual(self.client.get('/api/health/gemini/').status_code, 404)

    @patch.dict(os.environ, {'HEALTHCHECK_TOKEN': 'expected-token'})
    def test_404_when_token_is_wrong(self):
        response = self.client.get(
            '/api/health/gemini/', headers={'x-healthcheck-token': 'wrong'}
        )
        self.assertEqual(response.status_code, 404)

    @patch.dict(os.environ, {'HEALTHCHECK_TOKEN': 'expected-token'})
    def test_404_when_token_header_is_absent(self):
        self.assertEqual(self.client.get('/api/health/gemini/').status_code, 404)
