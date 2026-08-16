from django.urls import path

from .views import ExplainView, KnowledgeAskView

urlpatterns = [
    path("explain/", ExplainView.as_view()),
    path("knowledge/ask/", KnowledgeAskView.as_view()),
]
