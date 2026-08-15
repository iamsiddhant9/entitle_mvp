from dataclasses import dataclass
from typing import Any, Dict, List

@dataclass
class RuleResult:
    status: str  # eligible | near_miss | not_eligible
    matched: List[Dict[str, Any]]
    missing: List[Dict[str, Any]]

def check(rule: Dict[str, Any], profile: Dict[str, Any]) -> bool:
    """
    Evaluates a single rule condition against the citizen's profile.
    Each rule structure: {"field": "field_name", "op": "operator", "value": expected_value}
    Supported operators: eq, neq, lte, gte, lt, gt, in
    """
    field = rule.get("field")
    op = rule.get("op")
    expected = rule.get("value")
    
    if field not in profile:
        return False
        
    actual = profile[field]
    if actual is None:
        return False
        
    try:
        # String case-insensitive normalization if both are strings
        if isinstance(actual, str) and isinstance(expected, str):
            actual_norm = actual.strip().lower()
            expected_norm = expected.strip().lower()
        else:
            actual_norm = actual
            expected_norm = expected

        if op == "eq":
            return actual_norm == expected_norm
        elif op == "neq":
            return actual_norm != expected_norm
        elif op == "lte":
            return float(actual) <= float(expected)
        elif op == "gte":
            return float(actual) >= float(expected)
        elif op == "lt":
            return float(actual) < float(expected)
        elif op == "gt":
            return float(actual) > float(expected)
        elif op == "in":
            if isinstance(expected, list):
                if isinstance(actual, str):
                    exp_strings = [str(x).strip().lower() for x in expected]
                    return str(actual).strip().lower() in exp_strings
                return actual in expected
            return False
    except (ValueError, TypeError):
        return False
        
    return False

def evaluate(scheme_rules: Dict[str, Any], profile: Dict[str, Any]) -> RuleResult:
    """
    Evaluates a profile against the set of rules for a scheme.
    """
    matched: List[Dict[str, Any]] = []
    missing: List[Dict[str, Any]] = []
    
    for rule in scheme_rules.get("conditions", []):
        if check(rule, profile):
            matched.append(rule)
        else:
            missing.append(rule)
            
    if not missing:
        return RuleResult("eligible", matched, [])
        
    threshold = scheme_rules.get("near_miss_threshold", 1)
    status = "near_miss" if len(missing) <= threshold else "not_eligible"
    return RuleResult(status, matched, missing)

def check_documents(required_docs: List[str], citizen_credentials: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Checks which required documents the citizen already has verified credentials for.
    citizen_credentials should be a list of credential dicts retrieved from the DocumentCredentialRegistry.
    """
    verified = []
    missing = []
    
    # Extract valid document types the citizen has
    valid_doc_types = set()
    for cred in citizen_credentials:
        if not cred.get("revoked", False):
            valid_doc_types.add(cred.get("documentType"))
            
    for doc in required_docs:
        if doc in valid_doc_types:
            verified.append(doc)
        else:
            missing.append(doc)
            
    return {
        "verified": verified,
        "missing": missing,
        "all_verified": len(missing) == 0
    }
