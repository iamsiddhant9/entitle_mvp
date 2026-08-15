from django.urls import path
from .views import (
    DocumentUploadView, DocumentConfirmView, DocumentMissingView,
    DigiLockerAuthURLView, DigiLockerCallbackView, DigiLockerFetchView
)

urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('<int:id>/confirm/', DocumentConfirmView.as_view(), name='document-confirm'),
    path('missing/<str:citizen_id>/<str:scheme_code>/', DocumentMissingView.as_view(), name='document-missing'),
    
    # DigiLocker Endpoints
    path('digilocker/auth-url/', DigiLockerAuthURLView.as_view(), name='digilocker-auth-url'),
    path('digilocker/callback/', DigiLockerCallbackView.as_view(), name='digilocker-callback'),
    path('digilocker/fetch/', DigiLockerFetchView.as_view(), name='digilocker-fetch'),
]
