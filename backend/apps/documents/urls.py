from django.urls import path

from .views import DocumentConfirmView, DocumentUploadView, MissingDocumentsView

urlpatterns = [
    path("upload/", DocumentUploadView.as_view()),
    path("<int:document_id>/confirm/", DocumentConfirmView.as_view()),
    path("missing/<uuid:citizen_id>/<slug:scheme_code>/", MissingDocumentsView.as_view()),
]
