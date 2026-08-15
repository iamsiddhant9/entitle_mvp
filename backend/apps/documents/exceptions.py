"""Typed API errors for the documents pipeline.

These emit the project's standard error envelope from
``backend/entitle/exceptions.py``::

    {"error": {"code": "FILE_TOO_LARGE", "message": "..."}}

The global handler passes a payload that already carries ``error.message`` straight
through, so raising these gives precise error codes without changing the shared handler.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.exceptions import APIException


class DocumentAPIError(APIException):
    """An API error carrying an explicit, stable error code."""

    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, code: str, message: str, status_code: int | None = None) -> None:
        if status_code is not None:
            self.status_code = status_code
        self.code = code
        super().__init__(detail={"error": {"code": code, "message": message}})


# Upload / file validation
FILE_REQUIRED = "FILE_REQUIRED"
FILE_TOO_LARGE = "FILE_TOO_LARGE"
UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE"
IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE"
CORRUPT_IMAGE = "CORRUPT_IMAGE"

# Request validation
UNSUPPORTED_DOC_TYPE = "UNSUPPORTED_DOC_TYPE"
CITIZEN_ID_REQUIRED = "CITIZEN_ID_REQUIRED"

# Confirmation
DOCUMENT_QUALITY_TOO_LOW = "DOCUMENT_QUALITY_TOO_LOW"
CONFIRMATION_REQUIRED = "CONFIRMATION_REQUIRED"
PERMISSION_DENIED = "PERMISSION_DENIED"
