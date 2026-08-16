"""Turn rule-engine conditions into plain language.

The eligibility engine stores conditions as raw dicts — ``{"field": "income", "op": "lte",
"value": 200000}`` — and those dicts end up in ``EligibilityResult.matched_rules`` /
``missing_rules`` unchanged. Anything that shows a condition to a citizen, or hands one to
a language model, must go through this module first.

This is deliberately the single place where engine syntax becomes human language, so that:

* the non-AI fallback can never leak ``lte`` / ``eq`` / ``True`` to a citizen, and
* the model is given readable conditions rather than dicts, so it has no operator tokens
  to echo back in the first place.

Everything here is deterministic. No model is involved in producing these strings.
"""

from __future__ import annotations

from typing import Any

ENGLISH = "en"
HINDI = "hi"


def is_hindi(language: str | None) -> bool:
    return (language or "").strip().lower() in ("hi", "hindi")


# --- Field vocabulary ----------------------------------------------------------------
#
# Covers every field used by the 12 seeded schemes. Unknown fields fall back to a safe
# de-underscored rendering rather than raising, so a new rule can never crash an
# explanation or leak a raw identifier.

_FIELD_LABELS: dict[str, dict[str, str]] = {
    "income": {ENGLISH: "your annual family income", HINDI: "आपकी वार्षिक पारिवारिक आय"},
    "age": {ENGLISH: "your age", HINDI: "आपकी आयु"},
    "occupation": {ENGLISH: "your occupation", HINDI: "आपका व्यवसाय"},
    "gender": {ENGLISH: "your gender", HINDI: "आपका लिंग"},
    "state": {ENGLISH: "your state", HINDI: "आपका राज्य"},
    "caste": {ENGLISH: "your category", HINDI: "आपकी श्रेणी"},
    "girl_child_age": {ENGLISH: "the girl child's age", HINDI: "बच्ची की आयु"},
    "land_owned": {ENGLISH: "land ownership", HINDI: "भूमि स्वामित्व"},
    "has_bank_account": {ENGLISH: "bank account", HINDI: "बैंक खाता"},
    "disability": {ENGLISH: "disability status", HINDI: "दिव्यांगता स्थिति"},
}

#: Fields whose value is a yes/no fact, phrased as a statement rather than a comparison.
#: "you own land" reads naturally where "land ownership is yes" does not.
_BOOLEAN_PHRASES: dict[str, dict[bool, dict[str, str]]] = {
    "land_owned": {
        True: {ENGLISH: "you own land", HINDI: "आपके पास ज़मीन है"},
        False: {ENGLISH: "you do not own land", HINDI: "आपके पास ज़मीन नहीं है"},
    },
    "has_bank_account": {
        True: {ENGLISH: "you have a bank account", HINDI: "आपका बैंक खाता है"},
        False: {ENGLISH: "you do not have a bank account", HINDI: "आपका बैंक खाता नहीं है"},
    },
    "disability": {
        True: {ENGLISH: "you have a disability", HINDI: "आप दिव्यांग हैं"},
        False: {ENGLISH: "you do not have a disability", HINDI: "आप दिव्यांग नहीं हैं"},
    },
}

#: Operator -> plain language. These are the only renderings of an operator anywhere in
#: the user-facing path.
_OP_PHRASES: dict[str, dict[str, str]] = {
    "eq": {ENGLISH: "is", HINDI: "है"},
    "neq": {ENGLISH: "is not", HINDI: "नहीं है"},
    "lte": {ENGLISH: "is less than or equal to", HINDI: "से कम या बराबर है"},
    "gte": {ENGLISH: "is greater than or equal to", HINDI: "से अधिक या बराबर है"},
    "lt": {ENGLISH: "is less than", HINDI: "से कम है"},
    "gt": {ENGLISH: "is greater than", HINDI: "से अधिक है"},
    "in": {ENGLISH: "is one of", HINDI: "इनमें से एक है"},
}

#: Fields whose numeric values are rupee amounts.
_CURRENCY_FIELDS = frozenset({"income"})


def _pick(mapping: dict[str, str], language: str) -> str:
    return mapping[HINDI] if is_hindi(language) else mapping[ENGLISH]


def format_indian_currency(amount: float | int) -> str:
    """``200000`` -> ``"₹2,00,000"`` (Indian digit grouping)."""
    try:
        whole = int(round(float(amount)))
    except (TypeError, ValueError):
        return str(amount)

    sign = "-" if whole < 0 else ""
    digits = str(abs(whole))
    if len(digits) <= 3:
        return f"{sign}₹{digits}"

    head, last_three = digits[:-3], digits[-3:]
    groups: list[str] = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    if head:
        groups.insert(0, head)
    return f"{sign}₹{','.join(groups)},{last_three}"


def field_label(field: str, language: str = ENGLISH) -> str:
    entry = _FIELD_LABELS.get(field)
    if entry:
        return _pick(entry, language)
    # Safe default: never expose a raw snake_case identifier.
    return str(field or "").replace("_", " ").strip() or "this detail"


def describe_value(field: str, value: Any, language: str = ENGLISH) -> str:
    """Render a rule value the way a citizen would read it."""
    if isinstance(value, bool):
        yes_no = {ENGLISH: "yes", HINDI: "हाँ"} if value else {ENGLISH: "no", HINDI: "नहीं"}
        return _pick(yes_no, language)
    if isinstance(value, (int, float)) and field in _CURRENCY_FIELDS:
        return format_indian_currency(value)
    if isinstance(value, (list, tuple, set)):
        parts = [describe_value(field, item, language) for item in value]
        return join_clauses(parts, language)
    return str(value).replace("_", " ").strip()


def join_clauses(clauses: list[str], language: str = ENGLISH) -> str:
    """``["a", "b", "c"]`` -> ``"a, b and c"`` (or the Hindi equivalent)."""
    items = [c for c in clauses if c]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    conjunction = "और" if is_hindi(language) else "and"
    return f"{', '.join(items[:-1])} {conjunction} {items[-1]}"


def describe_rule(rule: Any, language: str = ENGLISH) -> str:
    """Render one rule-engine condition as a plain-language clause.

    ``{"field": "income", "op": "lte", "value": 200000}`` becomes
    ``"your annual family income is less than or equal to ₹2,00,000"``.

    Never returns an operator token. Malformed rules degrade to a generic phrase rather
    than raising, so one bad condition cannot break an explanation.
    """
    if not isinstance(rule, dict):
        return ""

    field = str(rule.get("field") or "")
    op = str(rule.get("op") or "")
    value = rule.get("value")

    # Boolean facts read as statements, not comparisons.
    if op in ("eq", "neq") and isinstance(value, bool):
        phrases = _BOOLEAN_PHRASES.get(field)
        if phrases:
            # `neq True` means the same as `eq False`.
            effective = value if op == "eq" else (not value)
            return _pick(phrases[effective], language)

    label = field_label(field, language)
    rendered_value = describe_value(field, value, language)
    op_entry = _OP_PHRASES.get(op)

    if op_entry is None:
        # Unknown operator: state the requirement without inventing a comparison.
        if is_hindi(language):
            return f"{label}: {rendered_value}".strip()
        return f"{label}: {rendered_value}".strip()

    phrase = _pick(op_entry, language)
    if is_hindi(language):
        # Hindi is subject-object-verb: "<label> <value> <verb phrase>".
        return f"{label} {rendered_value} {phrase}".strip()
    return f"{label} {phrase} {rendered_value}".strip()


def describe_rules(rules: Any, language: str = ENGLISH) -> list[str]:
    """Render a list of conditions, dropping anything unrenderable."""
    if not isinstance(rules, (list, tuple)):
        return []
    described = [describe_rule(rule, language) for rule in rules]
    return [clause for clause in described if clause]


def describe_rules_sentence(rules: Any, language: str = ENGLISH) -> str:
    """Render a list of conditions as one joined clause."""
    return join_clauses(describe_rules(rules, language), language)
