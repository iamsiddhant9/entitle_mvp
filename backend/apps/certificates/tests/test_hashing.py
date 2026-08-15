"""
test_hashing.py — Pytest suite for apps.certificates.services.hashing
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))

from apps.certificates.services.hashing import compute_hash, hash_to_bytes32

BASE_RESULT = {
    "citizen_id":    "abc-123",
    "scheme_code":   "pm_kisan",
    "status":        "eligible",
    "matched_rules": [{"field": "occupation", "op": "eq", "value": "farmer"}],
    "missing_rules": [],
}


class TestComputeHash:
    def test_returns_hex_string(self):
        h = compute_hash(BASE_RESULT)
        assert isinstance(h, str)

    def test_starts_with_0x(self):
        h = compute_hash(BASE_RESULT)
        assert h.startswith("0x")

    def test_length_is_66(self):
        h = compute_hash(BASE_RESULT)
        assert len(h) == 66

    def test_deterministic(self):
        """Same input always produces same hash."""
        h1 = compute_hash(BASE_RESULT)
        h2 = compute_hash(BASE_RESULT)
        assert h1 == h2

    def test_dict_order_independent(self):
        """Key insertion order must not affect the hash."""
        r1 = {
            "citizen_id": "abc-123", "scheme_code": "pm_kisan",
            "status": "eligible", "matched_rules": [], "missing_rules": [],
        }
        r2 = {
            "status": "eligible", "missing_rules": [], "matched_rules": [],
            "scheme_code": "pm_kisan", "citizen_id": "abc-123",
        }
        assert compute_hash(r1) == compute_hash(r2)

    def test_different_status_different_hash(self):
        r_near = {**BASE_RESULT, "status": "near_miss"}
        assert compute_hash(BASE_RESULT) != compute_hash(r_near)

    def test_pii_fields_excluded(self):
        """Extra fields (e.g. name) must not change the hash."""
        r_with_pii = {**BASE_RESULT, "name": "Siddhant", "aadhaar": "XXXX-1234"}
        assert compute_hash(BASE_RESULT) == compute_hash(r_with_pii)


class TestHashToBytes32:
    def test_valid_conversion(self):
        h = compute_hash(BASE_RESULT)
        b = hash_to_bytes32(h)
        assert isinstance(b, bytes)
        assert len(b) == 32

    def test_invalid_length_raises(self):
        with pytest.raises(ValueError):
            hash_to_bytes32("0xdeadbeef")  # too short
