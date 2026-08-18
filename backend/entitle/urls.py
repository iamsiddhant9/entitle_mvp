import hmac
import io
import os
import sys

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from apps.explain.views import KnowledgeAskView
from apps.documents.document_types import get_spec
from apps.documents.services import gemini_vision


def _genai_version() -> str:
    """Installed SDK version, or why it could not be read.

    Reported because ``requirements.txt`` has historically floated this dependency, so a
    deployed build can be running a different SDK than the one a fix was verified against.
    """
    try:
        from importlib.metadata import version

        return version("google-genai")
    except Exception:  # noqa: BLE001 - a health check must not fail on introspection
        return "unknown"


def health_check(request):
    """Configuration report. Deliberately says nothing about the key beyond whether it is set.

    An earlier version of this view returned the first 10 characters of the live Gemini
    API key on this public, unauthenticated endpoint. That is removed: the key must never
    leave the server, not even partially.
    """
    return JsonResponse({
        "status": "ok",
        "gemini_configured": gemini_vision.is_configured(),
        "gemini_model": gemini_vision.get_model_name(),
        "gemini_timeout_ms": getattr(settings, "GEMINI_TIMEOUT_MS", None),
        "genai_sdk_version": _genai_version(),
        "python_version": sys.version.split()[0],
        "debug": settings.DEBUG,
    })


def _probe_image() -> bytes:
    """A tiny synthetic JPEG. Content is irrelevant — only the request shape is under test."""
    from PIL import Image, ImageDraw

    image = Image.new("RGB", (320, 120), (255, 255, 255))
    ImageDraw.Draw(image).rectangle((20, 40, 300, 80), outline=(0, 0, 0), width=3)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    return buffer.getvalue()


def gemini_self_test(request):
    """Prove, in one request, whether this deployment can actually reach Gemini.

    Disabled unless ``HEALTHCHECK_TOKEN`` is set, and then only for a request carrying it
    in ``X-Healthcheck-Token`` — a live model call is not something an anonymous caller
    should be able to trigger.

    Two probes, because they fail for different reasons and the distinction is the whole
    point: a *text* call exercises the credential, and an *image + response_schema* call
    exercises the request shape the OCR pipeline actually sends. A rejected key fails both;
    an SDK/schema mismatch fails only the second.

    Returns sanitised status codes only (see ``gemini_vision._api_error_detail``) — never
    the key, never the model's output.
    """
    expected = (os.environ.get("HEALTHCHECK_TOKEN", "") or "").strip()
    if not expected:
        return JsonResponse({"detail": "Not found."}, status=404)

    supplied = (request.headers.get("X-Healthcheck-Token", "") or "").strip()
    if not hmac.compare_digest(supplied, expected):
        return JsonResponse({"detail": "Not found."}, status=404)

    if not gemini_vision.is_configured():
        return JsonResponse({
            "ok": False,
            "gemini_configured": False,
            "error": gemini_vision.STATUS_NOT_CONFIGURED,
        })

    from apps.explain.services import gemini_client

    # Probe 1 — credential only.
    text_error = ""
    try:
        gemini_client._generate(
            api_key=gemini_client.get_api_key(),
            model=gemini_client.get_model_name(),
            timeout_ms=gemini_client._timeout_ms(),
            prompt="Reply with the single word: ok",
        )
    except Exception as exc:  # noqa: BLE001 - reduced to a safe code, same as the pipeline
        text_error = gemini_client._classify_exception(exc)

    # Probe 2 — the real OCR request shape (image + JSON response_schema).
    result = gemini_vision.extract_fields(
        image_bytes=_probe_image(),
        mime_type="image/jpeg",
        spec=get_spec("income_certificate"),
    )
    # A blank probe image legitimately yields no fields; that still means Gemini accepted
    # and answered the request, which is what this endpoint is asking.
    vision_reached = not result.error.startswith(("api_", "sdk_"))

    return JsonResponse({
        "ok": not text_error and vision_reached,
        "gemini_configured": True,
        "model": gemini_vision.get_model_name(),
        "genai_sdk_version": _genai_version(),
        "text_probe": {"ok": not text_error, "error": text_error},
        "vision_probe": {
            "ok": vision_reached,
            "error": result.error,
            "extraction_status": result.status,
        },
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/health/gemini/', gemini_self_test, name='health-check-gemini'),
    path('api/citizens/', include('apps.citizens.urls')),
    path('api/schemes/', include('apps.schemes.urls')),
    path('api/eligibility/', include('apps.eligibility.urls')),
    path('api/explain/', include('apps.explain.urls')),
    path('api/knowledge/ask/', KnowledgeAskView.as_view(), name='knowledge-ask-direct'),
    path('api/documents/', include('apps.documents.urls')),
    path('api/certificates/', include('apps.certificates.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
