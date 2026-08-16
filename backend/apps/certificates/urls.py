from django.urls import path

from .views import CertificateDetailView, CertificateIssueView, CertificateVerifyView

urlpatterns = [
    path("issue/", CertificateIssueView.as_view()),
    path("verify/<str:eligibility_hash>/", CertificateVerifyView.as_view()),
    path("<int:certificate_id>/", CertificateDetailView.as_view()),
]
