from django.urls import path
from .views import DocumentUploadView, DocumentConfirmView, DocumentMissingView

urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('<int:id>/confirm/', DocumentConfirmView.as_view(), name='document-confirm'),
    path('missing/<str:citizen_id>/<str:scheme_code>/', DocumentMissingView.as_view(), name='document-missing'),
]
