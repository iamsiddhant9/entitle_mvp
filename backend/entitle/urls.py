from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.explain.views import KnowledgeAskView

urlpatterns = [
    path('admin/', admin.site.urls),
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
