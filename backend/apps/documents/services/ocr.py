"""Document processing pipeline.

Single entry point used by the upload view. Orchestrates, in order:

    file validation -> quality assessment -> preprocessing -> Gemini extraction -> expiry

Each stage lives in its own module; this one only wires them together and decides what to
skip. Nothing here invents data: if a stage cannot produce a result, that fact is carried
through in the extraction status.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date

from ..document_types import DocumentTypeSpec
from . import expiry as expiry_service
from . import groq_vision, preprocessing
from .file_validation import ValidatedUpload, validate_upload
from .quality import QualityResult, assess_image_quality

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DocumentProcessingResult:
    """Everything the view needs to persist a processed document."""

    upload: ValidatedUpload
    quality: QualityResult
    extraction: groq_vision.ExtractionResult
    expiry_status: str
    expiry_date: date | None

    @property
    def is_blurry(self) -> bool:
        return self.quality.is_blurry

    @property
    def is_expired(self) -> bool:
        return expiry_service.is_expired(self.expiry_status)


def process_document(uploaded_file, spec: DocumentTypeSpec) -> DocumentProcessingResult:
    """Validate, assess and extract a single uploaded document.

    Raises :class:`~apps.documents.exceptions.DocumentAPIError` only for rejected uploads
    (bad file type, too large, corrupt). Extraction problems are reported through the
    returned result's status, never as fabricated fields.
    """
    upload = validate_upload(uploaded_file)
    quality = assess_image_quality(upload.data)

    if quality.is_blurry:
        # Running OCR on an unreadable image would produce plausible-looking noise.
        logger.info(
            "Skipping extraction for %s: quality=%s variance=%s",
            spec.code,
            quality.status,
            quality.laplacian_variance,
        )
        extraction = groq_vision.ExtractionResult(
            status=groq_vision.STATUS_SKIPPED_LOW_QUALITY,
            source=groq_vision.SOURCE_NONE,
            error="image_too_blurry",
        )
    else:
        image_bytes, mime_type = preprocessing.prepare_for_extraction(upload.data)
        extraction = groq_vision.extract_fields(
            image_bytes=image_bytes,
            mime_type=mime_type,
            spec=spec,
        )

    expiry_status, expiry_date = expiry_service.evaluate_expiry(spec, extraction.fields)

    return DocumentProcessingResult(
        upload=upload,
        quality=quality,
        extraction=extraction,
        expiry_status=expiry_status,
        expiry_date=expiry_date,
    )
