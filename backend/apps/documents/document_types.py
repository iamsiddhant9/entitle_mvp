"""Canonical document-type registry for ENTITLE.

Single source of truth for:

* which ``doc_type`` identifiers the API accepts. These strings MUST stay in sync with
  ``Scheme.required_documents_json`` (seeded by
  ``apps/schemes/management/commands/seed_schemes.py``), otherwise a correctly uploaded
  document is reported as missing by ``GET /api/documents/missing/...``;
* which of those types have a structured Gemini extraction schema;
* how raw keys returned by the model are normalised to canonical field names;
* which field (if any) carries an expiry date;
* whether confirmed data from the type may be mapped onto ``CitizenProfile``.

Only the four document types that already had extraction support keep it. The remaining
types are accepted for upload and confirmation (schemes require them) but report
``unsupported_doc_type`` rather than guessing at their contents.
"""

from __future__ import annotations

import copy
import re
from dataclasses import dataclass
from typing import Any


def normalise_key(raw: str) -> str:
    """Fold a raw key to a comparable form: lowercase, no spaces/underscores/hyphens/dots.

    Non-ASCII is preserved so Hindi keys (e.g. ``"नाम"``) can be aliased explicitly.
    """
    return re.sub(r"[\s_\-.]+", "", str(raw).strip().lower())


@dataclass(frozen=True)
class FieldSpec:
    """One canonical field of a document type."""

    name: str
    description: str
    aliases: tuple[str, ...] = ()
    #: Presence of at least one primary field is what makes an extraction "successful".
    primary: bool = False
    #: Aadhaar-style identifier: only the last 4 digits are ever persisted.
    mask: bool = False


@dataclass(frozen=True)
class DocumentTypeSpec:
    """Everything the pipeline needs to know about one ``doc_type``."""

    code: str
    label: str
    fields: tuple[FieldSpec, ...] = ()
    #: Canonical field holding an expiry date, or None when the type never expires.
    expiry_field: str | None = None
    #: Whether confirmed data from this type may populate CitizenProfile.
    profile_mapping_enabled: bool = False

    @property
    def supports_extraction(self) -> bool:
        return bool(self.fields)

    @property
    def field_names(self) -> tuple[str, ...]:
        return tuple(f.name for f in self.fields)

    @property
    def primary_field_names(self) -> tuple[str, ...]:
        return tuple(f.name for f in self.fields if f.primary)

    @property
    def masked_field_names(self) -> tuple[str, ...]:
        return tuple(f.name for f in self.fields if f.mask)

    def alias_map(self) -> dict[str, str]:
        """Normalised alias -> canonical field name."""
        mapping: dict[str, str] = {}
        for spec in self.fields:
            mapping[normalise_key(spec.name)] = spec.name
            for alias in spec.aliases:
                mapping[normalise_key(alias)] = spec.name
        return mapping

    def response_schema(self) -> dict[str, Any]:
        """OpenAPI-subset schema for ``GenerateContentConfig.response_schema``.

        Every field is a nullable string: documents are read as printed, and any parsing
        or type coercion happens deterministically in Python rather than in the model.

        ``additionalProperties`` is deliberately absent — the Gemini Developer API
        rejects it client-side (``google/genai/_transformers.py``).

        A fresh copy is returned on every call because the SDK's ``t_schema`` transformer
        mutates the dict it is handed (it renames ``property_ordering`` in place).
        """
        properties = {
            spec.name: {
                "type": "string",
                "description": spec.description,
                "nullable": True,
            }
            for spec in self.fields
        }
        return copy.deepcopy(
            {
                "type": "object",
                "properties": properties,
                "required": list(self.field_names),
                "property_ordering": list(self.field_names),
            }
        )


# --- Shared field groups -------------------------------------------------------------

_AADHAAR_FIELDS: tuple[FieldSpec, ...] = (
    FieldSpec(
        name="name",
        description="Full name of the card holder exactly as printed.",
        aliases=("full name", "holder name", "applicant name", "नाम"),
        primary=True,
    ),
    FieldSpec(
        name="aadhaar_no",
        description="The 12-digit Aadhaar number exactly as printed.",
        aliases=("aadhaar number", "aadhar no", "adhaar no", "uid", "आधार संख्या", "aadhaar"),
        primary=True,
        mask=True,
    ),
    FieldSpec(
        name="dob",
        description="Date of birth exactly as printed (do not reformat).",
        aliases=("date of birth", "birth date", "जन्म तिथि"),
    ),
    FieldSpec(
        name="gender",
        description="Gender as printed (Male, Female or Other).",
        aliases=("sex", "लिंग"),
    ),
    FieldSpec(
        name="state",
        description="State from the printed address, if visible.",
        aliases=("राज्य",),
    ),
)

_RATION_FIELDS: tuple[FieldSpec, ...] = (
    FieldSpec(
        name="card_type",
        description="Ration card category as printed, e.g. BPL, APL or AAY.",
        aliases=("type", "category", "card category"),
        primary=True,
    ),
    FieldSpec(
        name="head_of_family",
        description="Name of the head of the family as printed.",
        aliases=("head", "hof", "head of household", "family head"),
        primary=True,
    ),
    FieldSpec(
        name="members_count",
        description="Number of family members listed on the card.",
        aliases=("members", "no of members", "family members", "number of members"),
    ),
    FieldSpec(
        name="state",
        description="Issuing state as printed.",
        aliases=("राज्य",),
    ),
)


# --- Registry ------------------------------------------------------------------------

_SPECS: tuple[DocumentTypeSpec, ...] = (
    DocumentTypeSpec(
        code="aadhaar_card",
        label="Aadhaar Card",
        fields=_AADHAAR_FIELDS,
        profile_mapping_enabled=True,
    ),
    # Same physical document as an Aadhaar card, but it identifies the applicant's
    # parent — mapping its date of birth onto the citizen's age would be wrong.
    DocumentTypeSpec(
        code="parent_aadhaar",
        label="Parent's Aadhaar Card",
        fields=_AADHAAR_FIELDS,
        profile_mapping_enabled=False,
    ),
    DocumentTypeSpec(
        code="land_ownership_document",
        label="Land Ownership Document",
        fields=(
            FieldSpec(
                name="owner_name",
                description="Name of the recorded land owner as printed.",
                aliases=("owner", "khatedar", "land owner", "name"),
                primary=True,
            ),
            FieldSpec(
                name="khasra_no",
                description="Khasra, survey or gat number as printed.",
                aliases=("khasra number", "survey no", "survey number", "gat no", "khasra"),
                primary=True,
            ),
            FieldSpec(
                name="area_acres",
                description="Recorded land area, with its unit as printed.",
                aliases=("area", "land area", "area in acres", "extent"),
            ),
            FieldSpec(
                name="district",
                description="District as printed.",
                aliases=("जिला",),
            ),
            FieldSpec(
                name="state",
                description="State as printed.",
                aliases=("राज्य",),
            ),
        ),
        profile_mapping_enabled=True,
    ),
    DocumentTypeSpec(
        code="income_certificate",
        label="Income Certificate",
        fields=(
            FieldSpec(
                name="name",
                description="Name of the person the certificate is issued to.",
                aliases=("full name", "applicant name", "नाम"),
            ),
            FieldSpec(
                name="annual_income",
                description="Annual income figure exactly as printed, including any currency symbol.",
                aliases=("income", "yearly income", "annual income inr", "वार्षिक आय"),
                primary=True,
            ),
            FieldSpec(
                name="issued_by",
                description="Issuing authority or office as printed.",
                aliases=("issuing authority", "issued by office", "authority"),
            ),
            FieldSpec(
                name="valid_until",
                description="Validity or expiry date exactly as printed.",
                aliases=("valid upto", "valid till", "validity", "expiry date", "date of expiry"),
            ),
            FieldSpec(
                name="state",
                description="State of the issuing authority, if visible.",
                aliases=("राज्य",),
            ),
        ),
        expiry_field="valid_until",
        profile_mapping_enabled=True,
    ),
    DocumentTypeSpec(
        code="ration_card",
        label="Ration Card",
        fields=_RATION_FIELDS,
        profile_mapping_enabled=True,
    ),
    DocumentTypeSpec(
        code="bpl_ration_card",
        label="BPL Ration Card",
        fields=_RATION_FIELDS,
        profile_mapping_enabled=True,
    ),
    # Required by seeded schemes, accepted for upload and confirmation, but without a
    # structured extraction schema. These report `unsupported_doc_type` rather than
    # inventing fields for documents nobody has specified.
    DocumentTypeSpec(code="bank_passbook", label="Bank Passbook"),
    DocumentTypeSpec(code="pan_card", label="PAN Card"),
    DocumentTypeSpec(code="student_id", label="Student ID"),
    DocumentTypeSpec(code="mark_sheet", label="Mark Sheet"),
    DocumentTypeSpec(code="trade_certificate", label="Trade Certificate"),
    DocumentTypeSpec(code="business_proposal", label="Business Proposal"),
    DocumentTypeSpec(code="school_leaving_certificate", label="School Leaving Certificate"),
    DocumentTypeSpec(code="birth_certificate", label="Birth Certificate"),
    DocumentTypeSpec(code="samagra_id", label="Samagra ID"),
    DocumentTypeSpec(code="domicile_certificate", label="Domicile Certificate"),
)

DOCUMENT_TYPES: dict[str, DocumentTypeSpec] = {spec.code: spec for spec in _SPECS}

SUPPORTED_DOC_TYPES: tuple[str, ...] = tuple(sorted(DOCUMENT_TYPES))

#: Types the pipeline can actually extract structured fields from.
EXTRACTABLE_DOC_TYPES: tuple[str, ...] = tuple(
    sorted(code for code, spec in DOCUMENT_TYPES.items() if spec.supports_extraction)
)

DOC_TYPE_CHOICES: tuple[tuple[str, str], ...] = tuple(
    (spec.code, spec.label) for spec in _SPECS
)


def get_spec(doc_type: str) -> DocumentTypeSpec | None:
    """Return the spec for ``doc_type``, or None when it is not a known type."""
    return DOCUMENT_TYPES.get(doc_type)


def is_supported(doc_type: str) -> bool:
    return doc_type in DOCUMENT_TYPES
