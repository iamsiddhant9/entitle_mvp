"""
Global error envelope required by docs/api-contract.md:

    {"error": {"code": "ERROR_CODE", "message": "..."}}

All DRF exceptions are funneled through `exception_handler`; views can also
return `error_response(...)` directly for manual failures.
"""
from rest_framework import status as http_status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

STATUS_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE",
    429: "THROTTLED",
    500: "SERVER_ERROR",
}


def error_response(code, message, status=http_status.HTTP_400_BAD_REQUEST):
    return Response({"error": {"code": code, "message": message}}, status=status)


def _flatten_detail(detail):
    """Reduce DRF's nested error details to a single human-readable string."""
    if isinstance(detail, dict):
        parts = []
        for key, value in detail.items():
            flat = _flatten_detail(value)
            parts.append(flat if key == "non_field_errors" else "{}: {}".format(key, flat))
        return " ".join(parts)
    if isinstance(detail, list):
        return " ".join(_flatten_detail(item) for item in detail)
    return str(detail)


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return None  # non-API exception: let Django return its 500 handler

    default_code = getattr(getattr(exc, "detail", None), "code", None)
    code = (default_code or STATUS_CODES.get(response.status_code, "ERROR")).upper()
    message = _flatten_detail(response.data)
    response.data = {"error": {"code": code, "message": message}}
    return response
