from django.urls import path

from .views import EvaluateView, ResultListView

urlpatterns = [
    path("evaluate/", EvaluateView.as_view()),
    path("results/<uuid:citizen_id>/", ResultListView.as_view()),
]
