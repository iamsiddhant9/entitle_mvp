from django.urls import path
from .views import CertificateIssueView, CertificateDetailView

urlpatterns = [
    path('issue/', CertificateIssueView.as_view(), name='certificate-issue'),
    path('<str:id>/', CertificateDetailView.as_view(), name='certificate-detail'),
]
