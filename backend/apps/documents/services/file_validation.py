"""Upload validation for document files.

Nothing is written to disk until a file has passed through here. Validation is based on
the *content* of the file, never on the client-supplied filename or ``Content-Type``.

Limits (all overridable in settings, documented in ``.env.example``):

* ``DOCUMENT_MAX_UPLOAD_BYTES``  — default 10 MiB. Comfortably fits a high-resolution
  phone photo of a certificate while bounding memory use per request.
* ``DOCUMENT_MAX_IMAGE_PIXELS``  — default 50 MP. Above a ~50 megapixel scan the image is
  refused rather than decoded, which is the decompression-bomb guard.
* ``DOCUMENT_ALLOWED_IMAGE_FORMATS`` — default JPEG/PNG/WEBP.

PDFs are explicitly rejected: rasterising one would need an external binary (Poppler or
similar) that this project does not ship, and claiming PDF support without it would be
dishonest.
"""

from __future__ import annotations

import io
from dataclasses import dataclass

from django.conf import settings
from PIL import Image, UnidentifiedImageError

from ..exceptions import (
    CORRUPT_IMAGE,
    FILE_REQUIRED,
    FILE_TOO_LARGE,
    IMAGE_TOO_LARGE,
    UNSUPPORTED_FILE_TYPE,
    DocumentAPIError,
)

DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024
DEFAULT_MAX_IMAGE_PIXELS = 50_000_000
DEFAULT_ALLOWED_FORMATS = ("JPEG", "PNG", "WEBP")

#: Detected PIL format -> (stored extension, canonical mime type).
_FORMAT_INFO = {
    "JPEG": ("jpg", "image/jpeg"),
    "PNG": ("png", "image/png"),
    "WEBP": ("webp", "image/webp"),
}

#: Extensions the model is allowed to persist. Used by ``document_upload_path`` so a
#: client-supplied extension can never reach the filesystem.
ALLOWED_EXTENSIONS = frozenset(ext for ext, _ in _FORMAT_INFO.values())


@dataclass(frozen=True)
class ValidatedUpload:
    """A file that has been proven to be a decodable image of an allowed type."""

    data: bytes
    image_format: str
    extension: str
    content_type: str
    width: int
    height: int

    @property
    def filename(self) -> str:
        """A safe, generated storage name — the client's filename is never reused."""
        return f"document.{self.extension}"


def _max_upload_bytes() -> int:
    return int(getattr(settings, "DOCUMENT_MAX_UPLOAD_BYTES", DEFAULT_MAX_UPLOAD_BYTES))


def _max_image_pixels() -> int:
    return int(getattr(settings, "DOCUMENT_MAX_IMAGE_PIXELS", DEFAULT_MAX_IMAGE_PIXELS))


def _allowed_formats() -> tuple[str, ...]:
    return tuple(getattr(settings, "DOCUMENT_ALLOWED_IMAGE_FORMATS", DEFAULT_ALLOWED_FORMATS))


def validate_upload(uploaded_file) -> ValidatedUpload:
    """Validate an uploaded document, raising :class:`DocumentAPIError` on rejection."""
    if uploaded_file is None:
        raise DocumentAPIError(FILE_REQUIRED, "A document file is required under the 'file' field.")

    max_bytes = _max_upload_bytes()

    # Trust the reported size only as a cheap early exit; the authoritative check is on
    # the bytes actually read.
    reported = getattr(uploaded_file, "size", None)
    if reported is not None and reported > max_bytes:
        raise _too_large(max_bytes)

    try:
        uploaded_file.seek(0)
    except (AttributeError, OSError):
        pass

    # Read one byte past the limit so an oversized upload is detected without holding the
    # whole thing in memory.
    data = uploaded_file.read(max_bytes + 1)
    try:
        uploaded_file.seek(0)
    except (AttributeError, OSError):
        pass

    if not data:
        raise DocumentAPIError(FILE_REQUIRED, "The uploaded document file is empty.")
    if len(data) > max_bytes:
        raise _too_large(max_bytes)

    if data[:5] == b"%PDF-":
        raise DocumentAPIError(
            UNSUPPORTED_FILE_TYPE,
            "PDF documents are not supported. Please upload a photo or scan of the "
            "document as a JPEG, PNG or WEBP image.",
        )

    allowed = _allowed_formats()

    try:
        probe = Image.open(io.BytesIO(data))
        image_format = (probe.format or "").upper()
        width, height = probe.size
    except Image.DecompressionBombError:
        raise DocumentAPIError(
            IMAGE_TOO_LARGE,
            "The uploaded image is too large to process safely. "
            f"Maximum supported size is {_max_image_pixels():,} pixels.",
        ) from None
    except (UnidentifiedImageError, OSError, ValueError):
        raise DocumentAPIError(
            UNSUPPORTED_FILE_TYPE,
            "The uploaded file is not a readable image. Supported formats: "
            f"{', '.join(allowed)}.",
        ) from None

    if image_format not in allowed:
        raise DocumentAPIError(
            UNSUPPORTED_FILE_TYPE,
            f"Unsupported image format '{image_format or 'unknown'}'. "
            f"Supported formats: {', '.join(allowed)}.",
        )

    # Checked from the header, before any pixel data is decoded.
    max_pixels = _max_image_pixels()
    if width * height > max_pixels:
        raise DocumentAPIError(
            IMAGE_TOO_LARGE,
            f"The uploaded image is {width}x{height} pixels, which exceeds the "
            f"{max_pixels:,} pixel limit.",
        )

    # verify() consumes the file object, so it runs on a fresh handle and last.
    #
    # verify() alone is not sufficient: for JPEG it is the inherited no-op and checks only
    # the header, so a truncated JPEG — a partially written camera file, an interrupted
    # sync — would pass here and then raise deep in preprocessing, surfacing as a 500.
    # A full decode is the only way to prove the pixel data is actually readable, and by
    # this point the pixel count is already bounded.
    try:
        Image.open(io.BytesIO(data)).verify()
        Image.open(io.BytesIO(data)).load()
    except Image.DecompressionBombError:
        raise DocumentAPIError(
            IMAGE_TOO_LARGE, "The uploaded image is too large to process safely."
        ) from None
    except Exception:
        raise DocumentAPIError(
            CORRUPT_IMAGE,
            "The uploaded image could not be read. It may be incomplete or corrupted.",
        ) from None

    extension, content_type = _FORMAT_INFO[image_format]
    return ValidatedUpload(
        data=data,
        image_format=image_format,
        extension=extension,
        content_type=content_type,
        width=width,
        height=height,
    )


def _too_large(max_bytes: int) -> DocumentAPIError:
    return DocumentAPIError(
        FILE_TOO_LARGE,
        f"The uploaded file exceeds the {max_bytes // (1024 * 1024)} MB limit.",
    )
