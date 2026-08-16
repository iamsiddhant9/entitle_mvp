from django.urls import path

from .views import CitizenCreateView, CitizenProfileView

urlpatterns = [
    path("", CitizenCreateView.as_view()),
    path("<uuid:citizen_id>/profile/", CitizenProfileView.as_view()),
]
