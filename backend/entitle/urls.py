from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from apps.explain.views import KnowledgeAskView
from apps.documents.services.gemini_vision import is_configured, get_api_key

def health_check(request):
    key = get_api_key()
    return JsonResponse({
        "status": "ok",
        "gemini_configured": is_configured(),
        "gemini_key_prefix": key[:10] + "..." if key else "NOT SET",
        "gemini_model": getattr(settings, "GEMINI_MODEL", "not set"),
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
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
