from django.urls import path
from .views import ExplainEligibilityView, KnowledgeAskView

urlpatterns = [
    path('', ExplainEligibilityView.as_view(), name='explain-eligibility'),
    path('ask/', KnowledgeAskView.as_view(), name='knowledge-ask'),
]
