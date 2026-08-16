"""
Canonical SHA-256 hashing of eligibility results.

The hash must be reproducible by any third party, so the JSON serialization
is pinned down exactly:

  * keys sorted lexicographically at every nesting level
  * compact separators ("," and ":") — no whitespace
  * UTF-8 encoding with ensure_ascii=False (Devanagari etc. stay as-is)

hash_payload(payload) == "0x" + sha256(canonical_json(payload)) and is what
gets stored on the Polygon Amoy EligibilityRegistry contract.
"""
import hashlib
import json


def canonical_json(payload):
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def hash_payload(payload):
    digest = hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()
    return "0x" + digest
