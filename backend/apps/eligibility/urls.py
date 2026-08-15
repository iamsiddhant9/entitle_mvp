from django.urls import path
from .views import EvaluateEligibilityView, EligibilityResultsListView

urlpatterns = [
    path('evaluate/', EvaluateEligibilityView.as_view(), name='eligibility-evaluate'),
    path('results/<str:citizen_id>/', EligibilityResultsListView.as_view(), name='eligibility-results'),
]
