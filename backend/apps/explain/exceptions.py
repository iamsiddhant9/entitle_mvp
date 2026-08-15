"""Typed API errors for the explain app.

Emits the project's standard error envelope from ``backend/entitle/exceptions.py``::

    {"error": {"code": "PERMISSION_DENIED", "message": "..."}}

The global handler passes a payload that already carries ``error.message`` straight
through, so raising these gives precise error codes without changing the shared handler.

This mirrors ``apps/documents/exceptions.py``. It is kept app-local rather than shared so
that the documents pipeline (currently under review in its own PR) is not touched.
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.exceptions import APIException


class ExplainAPIError(APIException):
    """An API error carrying an explicit, stable error code."""

    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, code: str, message: str, status_code: int | None = None) -> None:
        if status_code is not None:
            self.status_code = status_code
        self.code = code
        super().__init__(detail={"error": {"code": code, "message": message}})


PERMISSION_DENIED = "PERMISSION_DENIED"
CITIZEN_ID_REQUIRED = "CITIZEN_ID_REQUIRED"
