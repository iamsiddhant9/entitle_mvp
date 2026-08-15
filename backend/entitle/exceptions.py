"""
Global DRF exception handler adhering to ENTITLE API contract.
Returns error responses in standard format:
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description."
  }
}
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        error_code = "API_ERROR"
        status_code = response.status_code

        if status_code == 400:
            error_code = "VALIDATION_ERROR"
        elif status_code == 401:
            error_code = "UNAUTHORIZED"
        elif status_code == 403:
            error_code = "FORBIDDEN"
        elif status_code == 404:
            error_code = "NOT_FOUND"
        elif status_code == 405:
            error_code = "METHOD_NOT_ALLOWED"
        elif status_code == 429:
            error_code = "THROTTLED"

        # Build message
        data = response.data
        if isinstance(data, dict):
            if "detail" in data:
                message = str(data["detail"])
            elif "error" in data and isinstance(data["error"], dict) and "message" in data["error"]:
                return response
            else:
                # Format validation errors nicely
                messages = []
                for k, v in data.items():
                    if isinstance(v, list):
                        messages.append(f"{k}: {', '.join([str(x) for x in v])}")
                    else:
                        messages.append(f"{k}: {str(v)}")
                message = "; ".join(messages) if messages else "Invalid request data."
        elif isinstance(data, list):
            message = "; ".join([str(x) for x in data])
        else:
            message = str(data)

        response.data = {
            "error": {
                "code": error_code,
                "message": message
            }
        }
        return response

    # If unhandled server exception (500)
    logger.exception(f"Unhandled Server Error: {str(exc)}")
    return Response(
        {
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc) or "An unexpected server error occurred."
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
