from django.urls import path
from .views import CitizenCreateView, CitizenProfileDetailView

urlpatterns = [
    path('', CitizenCreateView.as_view(), name='citizen-create'),
    path('<str:identifier>/profile/', CitizenProfileDetailView.as_view(), name='citizen-profile-detail'),
]
