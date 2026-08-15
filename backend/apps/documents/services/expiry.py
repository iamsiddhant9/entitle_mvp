"""Document expiry evaluation.

Only document types that declare an ``expiry_field`` are ever evaluated. A document
without an expiry date is *not* expired — the distinction between "this type never
expires", "we could not read a date" and "this date has passed" is preserved in
``expiry_status`` and collapsed to the contract's boolean ``is_expired`` only at the edge.
"""

from __future__ import annotations

from datetime import date, datetime

from django.utils import timezone

from ..document_types import DocumentTypeSpec

STATUS_NOT_APPLICABLE = "not_applicable"
STATUS_VALID = "valid"
STATUS_EXPIRED = "expired"
STATUS_UNKNOWN = "unknown"

EXPIRY_STATUS_CHOICES = (
    (STATUS_NOT_APPLICABLE, "Not applicable"),
    (STATUS_VALID, "Valid"),
    (STATUS_EXPIRED, "Expired"),
    (STATUS_UNKNOWN, "Unable to determine"),
)

#: Accepted printed date formats, most-specific first.
#:
#: Day-first is assumed for the ambiguous numeric forms (``01/02/2027`` is read as
#: 1 February 2027, not 2 January), which is the convention on Indian government
#: documents. Two-digit years are deliberately not accepted — guessing the century on a
#: validity date is worse than reporting ``unknown``.
_DATE_FORMATS = (
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%d.%m.%Y",
    "%Y/%m/%d",
    "%d %b %Y",
    "%d %B %Y",
    "%b %d, %Y",
    "%B %d, %Y",
)

_MIN_YEAR = 1900
_MAX_YEAR = 2100


def parse_document_date(value: str | None) -> date | None:
    """Parse a printed date, returning None when it cannot be read unambiguously."""
    if not value or not isinstance(value, str):
        return None

    text = " ".join(value.split()).strip()
    if not text:
        return None

    for fmt in _DATE_FORMATS:
        try:
            parsed = datetime.strptime(text, fmt).date()
        except (ValueError, TypeError):
            continue
        if _MIN_YEAR <= parsed.year <= _MAX_YEAR:
            return parsed
        return None
    return None


def evaluate_expiry(
    spec: DocumentTypeSpec | None,
    fields: dict[str, str] | None,
    today: date | None = None,
) -> tuple[str, date | None]:
    """Return ``(expiry_status, expiry_date)`` for a document's normalised fields."""
    if spec is None or not spec.expiry_field:
        return STATUS_NOT_APPLICABLE, None

    raw = (fields or {}).get(spec.expiry_field)
    if not raw:
        return STATUS_UNKNOWN, None

    parsed = parse_document_date(raw)
    if parsed is None:
        return STATUS_UNKNOWN, None

    reference = today or timezone.localdate()
    if parsed < reference:
        return STATUS_EXPIRED, parsed
    return STATUS_VALID, parsed


def is_expired(status: str) -> bool:
    """Collapse the four-state status to the API contract's boolean."""
    return status == STATUS_EXPIRED
