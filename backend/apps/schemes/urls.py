from django.urls import path
from .views import SchemeListView, SchemeDetailView

urlpatterns = [
    path('', SchemeListView.as_view(), name='scheme-list'),
    path('<str:code>/', SchemeDetailView.as_view(), name='scheme-detail'),
]
