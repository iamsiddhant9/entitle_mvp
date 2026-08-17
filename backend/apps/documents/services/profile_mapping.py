"""Mapping confirmed document data onto ``CitizenProfile``.

This is the only path by which document data can reach eligibility, and it runs **only**
for documents that are confirmed by a human, in date, and of a type flagged
``profile_mapping_enabled``.

Write rule
----------
A verified value is written **only where the profile field is currently empty**. A value
the citizen declared themselves is never overwritten. Where the document disagrees with a
declared value the disagreement is recorded as a *conflict* and surfaced for review — the
system does not silently pick a winner, and the model is never asked to resolve it.

Every conversion is deterministic Python and rejects input it cannot parse confidently,
rather than coercing it into something plausible.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Any, Callable

from django.utils import timezone

from ..document_types import DocumentTypeSpec, get_spec
from .expiry import parse_document_date

logger = logging.getLogger(__name__)

#: Sanity bound for a parsed annual income, in rupees. Above this the value is far more
#: likely to be a misread account number than a welfare applicant's income.
MAX_REASONABLE_INCOME = 1_000_000_000

MIN_AGE = 0
MAX_AGE = 120


@dataclass
class ProfileMappingResult:
    """Outcome of mapping one confirmed document onto a profile."""

    applied: dict[str, Any] = field(default_factory=dict)
    conflicts: list[dict[str, Any]] = field(default_factory=list)
    skipped: list[dict[str, Any]] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "applied": self.applied,
            "conflicts": self.conflicts,
            "skipped": self.skipped,
        }


# --- Deterministic converters --------------------------------------------------------


#: A figure stated per month cannot be turned into an annual income without assuming the
#: earner is paid every month of the year, so it is refused rather than guessed at. Storing
#: it as-is would under-report income twelve-fold and wrongly grant eligibility.
_PERIODIC_INCOME = re.compile(
    r"(per\s*month|/\s*month|monthly|per\s*mensem|p\.?\s*m\.?(?!\w)|"
    r"per\s*week|weekly|per\s*day|daily|per\s*annum\s*month)",
    re.IGNORECASE,
)

#: A number introduced by a currency marker is the amount; anything earlier in the string
#: (a certificate number, a year) is not.
_CURRENCY_AMOUNT = re.compile(
    r"(?:₹|\brs\.?|\binr\b)\s*([\d][\d,]*(?:\.\d+)?)", re.IGNORECASE
)

_ANY_AMOUNT = re.compile(r"\d[\d,]*(?:\.\d+)?")


def parse_income(raw: str | None) -> int | None:
    """``"Rs. 1,50,000 (One Lakh Fifty Thousand Only)"`` -> ``150000``.

    Returns None when no confident annual reading is possible — including when the figure
    is stated for a period other than a year.
    """
    if not raw or not isinstance(raw, str):
        return None
    if _PERIODIC_INCOME.search(raw):
        return None

    match = _CURRENCY_AMOUNT.search(raw) or _ANY_AMOUNT.search(raw)
    if not match:
        return None

    # group(1) for the currency form, group(0) for the bare-number fallback.
    digits = match.group(1) if match.re is _CURRENCY_AMOUNT else match.group(0)
    try:
        value = float(digits.replace(",", ""))
    except ValueError:
        return None
    if value < 0 or value > MAX_REASONABLE_INCOME:
        return None
    return int(value)


def age_from_dob(raw: str | None, today=None) -> int | None:
    """Compute a whole-year age from a printed date of birth."""
    born = parse_document_date(raw)
    if born is None:
        return None
    reference = today or timezone.localdate()
    age = reference.year - born.year - ((reference.month, reference.day) < (born.month, born.day))
    if age < MIN_AGE or age > MAX_AGE:
        return None
    return age


_GENDER_MAP = {
    "m": "male",
    "male": "male",
    "पुरुष": "male",
    "f": "female",
    "female": "female",
    "महिला": "female",
    "स्त्री": "female",
    "o": "other",
    "other": "other",
    "transgender": "other",
    "third gender": "other",
}


def normalise_gender(raw: str | None) -> str | None:
    if not raw or not isinstance(raw, str):
        return None
    return _GENDER_MAP.get(" ".join(raw.split()).strip().lower())


def normalise_state(raw: str | None) -> str | None:
    if not raw or not isinstance(raw, str):
        return None
    value = " ".join(raw.split()).strip()
    if not value or len(value) > 100:
        return None
    return value


# --- Mapping table -------------------------------------------------------------------


@dataclass(frozen=True)
class FieldMapping:
    """One deterministic document-field -> profile-field rule."""

    profile_field: str
    #: Canonical document field this is derived from (for reporting).
    source_field: str
    convert: Callable[[dict[str, str]], Any]
    #: Applied to the *declared* profile value before comparison, so a declared "M" is
    #: compared against a verified "male" on equal terms rather than reported as a
    #: contradiction the converter itself would have resolved.
    canonicalise_declared: Callable[[Any], Any] | None = None


def _derive(source: str, converter: Callable[[str | None], Any]) -> Callable[[dict], Any]:
    return lambda fields: converter(fields.get(source))


def _land_owned(fields: dict[str, str]) -> bool | None:
    """A confirmed land record naming an owner or a plot evidences land ownership."""
    if fields.get("owner_name") or fields.get("khasra_no"):
        return True
    return None


def _derive_name(raw: str | None) -> str | None:
    if not raw or not isinstance(raw, str):
        return None
    return " ".join(raw.split()).strip()


_AADHAAR_MAPPINGS = (
    FieldMapping("full_name", "name", _derive("name", _derive_name)),
    FieldMapping("age", "dob", _derive("dob", age_from_dob)),
    FieldMapping(
        "gender",
        "gender",
        _derive("gender", normalise_gender),
        canonicalise_declared=normalise_gender,
    ),
    FieldMapping("state", "state", _derive("state", normalise_state)),
)

_MAPPINGS: dict[str, tuple[FieldMapping, ...]] = {
    "aadhaar_card": _AADHAAR_MAPPINGS,
    "income_certificate": (
        FieldMapping("income", "annual_income", _derive("annual_income", parse_income)),
        FieldMapping("state", "state", _derive("state", normalise_state)),
    ),
    "land_ownership_document": (
        FieldMapping("land_owned", "owner_name", _land_owned),
        FieldMapping("state", "state", _derive("state", normalise_state)),
    ),
    "ration_card": (FieldMapping("state", "state", _derive("state", normalise_state)),),
    "bpl_ration_card": (FieldMapping("state", "state", _derive("state", normalise_state)),),
}


def get_mappings(doc_type: str) -> tuple[FieldMapping, ...]:
    return _MAPPINGS.get(doc_type, ())


def _values_agree(declared: Any, verified: Any) -> bool:
    if isinstance(declared, str) and isinstance(verified, str):
        return declared.strip().lower() == verified.strip().lower()
    return declared == verified


def _is_unset(value: Any) -> bool:
    """Whether a profile field counts as "not declared yet".

    A blank string is unset, not a declared value. Django's CharField stores ``''`` for an
    omitted-but-blank submission, and treating that as declared would permanently block the
    field from ever being filled while reporting a contradiction against nothing.
    """
    if value is None:
        return True
    return isinstance(value, str) and not value.strip()


def _derived_pairs(doc_type: str, fields: dict[str, str]):
    """Yield ``(mapping, value)`` for each rule that produced a usable value."""
    for mapping in get_mappings(doc_type):
        try:
            value = mapping.convert(fields or {})
        except Exception:  # noqa: BLE001 - a bad value must never break confirmation
            logger.warning(
                "Profile mapping converter failed doc_type=%s field=%s",
                doc_type,
                mapping.profile_field,
            )
            value = None
        if value is not None:
            yield mapping, value


def apply_confirmed_document(document) -> ProfileMappingResult:
    """Map one confirmed document onto its citizen's profile.

    Returns a result describing what was applied, what conflicted with declared data, and
    what was skipped. Safe to call more than once — re-running only ever fills fields that
    are still empty.
    """
    result = ProfileMappingResult()

    spec: DocumentTypeSpec | None = get_spec(document.doc_type)
    citizen = document.citizen

    if citizen is None:
        result.skipped.append({"reason": "no_citizen"})
        return result
    if spec is None or not spec.profile_mapping_enabled:
        result.skipped.append({"reason": "mapping_not_enabled", "doc_type": document.doc_type})
        return result
    if not document.confirmed:
        result.skipped.append({"reason": "not_confirmed"})
        return result
    if document.is_expired:
        result.skipped.append({"reason": "document_expired", "doc_type": document.doc_type})
        return result

    to_save: list[str] = []
    for mapping, verified_value in _derived_pairs(
        document.doc_type, document.extracted_fields or {}
    ):
        profile_field = mapping.profile_field
        declared_value = getattr(citizen, profile_field, None)

        # Compare like with like: run the declared side through the same canonicaliser
        # that produced the verified side, where one exists.
        comparable_declared = declared_value
        if mapping.canonicalise_declared is not None and declared_value is not None:
            comparable_declared = (
                mapping.canonicalise_declared(declared_value) or declared_value
            )

        if _is_unset(declared_value):
            setattr(citizen, profile_field, verified_value)
            to_save.append(profile_field)
            result.applied[profile_field] = verified_value
        elif _values_agree(comparable_declared, verified_value):
            result.skipped.append(
                {
                    "field": profile_field,
                    "reason": "already_matches",
                    "value": declared_value,
                }
            )
        else:
            result.conflicts.append(
                {
                    "field": profile_field,
                    "declared": declared_value,
                    "document": verified_value,
                    "doc_type": document.doc_type,
                    "document_id": document.id,
                }
            )

    if to_save:
        citizen.save(update_fields=[*to_save, "updated_at"])
        logger.info(
            "Applied verified document data citizen=%s doc_type=%s fields=%s",
            citizen.citizen_id,
            document.doc_type,
            sorted(to_save),
        )

    return result
