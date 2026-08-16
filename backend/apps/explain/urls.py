from django.urls import path
from .views import ExplainEligibilityView, KnowledgeAskView

urlpatterns = [
    path('', ExplainEligibilityView.as_view(), name='explain-eligibility'),
    # Undocumented alias for the knowledge assistant. The canonical route is
    # /api/knowledge/ask/ (see entitle/urls.py), which owns the 'knowledge-ask' name;
    # this one is named distinctly so reverse() is unambiguous.
    path('ask/', KnowledgeAskView.as_view(), name='knowledge-ask-alias'),
]
