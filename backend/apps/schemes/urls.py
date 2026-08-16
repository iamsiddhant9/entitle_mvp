from django.urls import path

from .views import SchemeDetailView, SchemeListView

urlpatterns = [
    path("", SchemeListView.as_view()),
    path("<slug:code>/", SchemeDetailView.as_view()),
]
