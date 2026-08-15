import hashlib
import json
from typing import Any, Dict

def compute_hash(data: Dict[str, Any]) -> str:
    """
    Computes a canonical SHA-256 hash of the eligibility result dictionary.
    Ensures zero PII is included, only verifiable status, scheme, and rule outcomes.
    Returns 32-byte hex prefixed with 0x.
    """
    # Sort keys for deterministic output
    canonical_json = json.dumps(data, sort_keys=True, separators=(',', ':'))
    raw_hash = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()
    return f"0x{raw_hash}"
