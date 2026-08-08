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
        
    if op == "eq":
        return actual == expected
    elif op == "neq":
        return actual != expected
    elif op == "lte":
        return actual <= expected
    elif op == "gte":
        return actual >= expected
    elif op == "lt":
        return actual < expected
    elif op == "gt":
        return actual > expected
    elif op == "in":
        if isinstance(expected, list):
            return actual in expected
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
