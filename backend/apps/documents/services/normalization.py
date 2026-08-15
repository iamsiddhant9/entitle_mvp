"""Normalisation of extracted document fields.

Everything that reaches ``Document.extracted_fields`` passes through here, whether it came
from Gemini or from a citizen editing the values at confirmation time. That single
boundary is what guarantees:

* stable canonical key names (``"Name"``, ``"Full Name"``, ``"नाम"`` all become ``name``),
* keys outside the document type's schema are dropped rather than stored,
* values are bounded strings, so no unbounded blob can be written to the JSON column,
* Aadhaar-style identifiers are masked before they are ever persisted or logged.
"""

from __future__ import annotations

import re
from typing import Any

from ..document_types import DocumentTypeSpec, normalise_key

#: Upper bound for a single field value. Real document fields are far shorter; this
#: exists so a misbehaving model cannot write an unbounded string to the database.
MAX_VALUE_LENGTH = 200

#: Upper bound for free-form field dicts on document types without a schema.
MAX_FREEFORM_KEYS = 25
MAX_FREEFORM_KEY_LENGTH = 64

#: Values that mean "the model found nothing here" and should be dropped, not stored.
_EMPTY_TOKENS = frozenset(
    {
        "",
        "-",
        "--",
        "n/a",
        "na",
        "nil",
        "none",
        "null",
        "not available",
        "not applicable",
        "not visible",
        "not found",
        "unknown",
        "undefined",
    }
)


#: A 12-digit Aadhaar number in any of its printed forms, with optional group separators.
#: The lookarounds stop it matching inside a longer run of digits (a 16-digit card number
#: is not an Aadhaar number).
_AADHAAR_NUMBER = re.compile(r"(?<!\d)(\d{4})[\s.\-]?(\d{4})[\s.\-]?(\d{4})(?!\d)")


def mask_identifier(value: str) -> str | None:
    """Mask an Aadhaar-style identifier down to its last four digits.

    ``"1234 5678 9012"`` -> ``"XXXX-XXXX-9012"``. The unmasked value is never returned,
    stored or logged.

    Returns None when no last-four can be recovered (fewer than four digits, e.g. the
    model put ``"Illegible"`` in the field). Returning a well-formed placeholder instead
    would manufacture a plausible value from nothing, and — because it is non-empty —
    would let a failed reading satisfy :func:`has_primary_field` and be reported as a
    successful extraction.
    """
    digits = re.sub(r"\D", "", value or "")
    if len(digits) < 4:
        return None
    return f"XXXX-XXXX-{digits[-4:]}"


def mask_aadhaar_like(value: str) -> str:
    """Mask any Aadhaar-shaped number appearing anywhere in a free text value.

    Defence in depth for fields that are not themselves identifier fields: a model may
    return ``"Rekha Devi Sharma 4321 8765 2109"`` under ``name``, or a citizen may type an
    Aadhaar number into ``state``. Without this, the full number would be persisted — and
    ``state`` in particular is mapped onto CitizenProfile, so it would escape the
    documents app entirely.
    """
    return _AADHAAR_NUMBER.sub(lambda match: f"XXXX-XXXX-{match.group(3)}", value)


def _clean_value(value: Any) -> str | None:
    """Coerce a raw value to a bounded, trimmed string, or None when it carries no data."""
    if value is None or isinstance(value, (dict, list, tuple, set)):
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        text = str(value)
    elif isinstance(value, str):
        text = value
    else:
        return None

    text = " ".join(text.split()).strip()
    if text.lower() in _EMPTY_TOKENS:
        return None
    return text[:MAX_VALUE_LENGTH]


def normalise_fields(spec: DocumentTypeSpec, raw: Any) -> dict[str, str]:
    """Map raw extracted data onto the spec's canonical fields.

    Unknown keys are dropped, empty values are dropped, masked fields are masked, and the
    result is ordered by the spec's field order so stored output is deterministic.
    Returns ``{}`` for anything that is not a dict.
    """
    if not isinstance(raw, dict):
        return {}

    aliases = spec.alias_map()
    masked = set(spec.masked_field_names)
    collected: dict[str, str] = {}

    for raw_key, raw_value in raw.items():
        canonical = aliases.get(normalise_key(raw_key))
        if canonical is None or canonical in collected:
            continue
        cleaned = _clean_value(raw_value)
        if cleaned is None:
            continue

        if canonical in masked:
            # An identifier field with no recoverable last-four carries no information;
            # drop it rather than store a manufactured placeholder.
            identifier = mask_identifier(cleaned)
            if identifier is None:
                continue
            collected[canonical] = identifier
        else:
            collected[canonical] = mask_aadhaar_like(cleaned)

    # Emit in schema order for stable, comparable output.
    return {name: collected[name] for name in spec.field_names if name in collected}


def normalise_freeform_fields(raw: Any) -> dict[str, str]:
    """Bounded normalisation for document types that have no extraction schema.

    Used only for citizen-supplied values at confirmation time. Keys are kept as given
    (there is no canonical set to map onto) but the dict is bounded in every dimension.
    """
    if not isinstance(raw, dict):
        return {}

    collected: dict[str, str] = {}
    for raw_key, raw_value in raw.items():
        if len(collected) >= MAX_FREEFORM_KEYS:
            break
        key = " ".join(str(raw_key).split()).strip()[:MAX_FREEFORM_KEY_LENGTH]
        if not key:
            continue
        cleaned = _clean_value(raw_value)
        if cleaned is None:
            continue

        # Defence in depth: mask an Aadhaar number regardless of which key it arrived
        # under, in any separator form, including embedded in a longer string.
        if _is_aadhaar_key(key):
            identifier = mask_identifier(cleaned)
            if identifier is None:
                continue
            cleaned = identifier
        else:
            cleaned = mask_aadhaar_like(cleaned)

        collected[key] = cleaned
    return collected


def _is_aadhaar_key(key: str) -> bool:
    folded = normalise_key(key)
    return "aadhaar" in folded or "aadhar" in folded or "adhaar" in folded


def has_primary_field(spec: DocumentTypeSpec, fields: dict[str, str]) -> bool:
    """Whether the normalised fields carry at least one identifying value.

    An extraction that returns only nulls is not a successful extraction.
    """
    primaries = spec.primary_field_names
    if not primaries:
        return bool(fields)
    return any(fields.get(name) for name in primaries)
