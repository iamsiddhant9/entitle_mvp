from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.citizens.views import get_citizen_or_none
from apps.schemes.models import Scheme
from entitle.errors import error_response

from .models import EligibilityResult
from .serializers import EligibilityResultSerializer
from .services import rule_engine


def evaluate_citizen(citizen):
    """
    Run the deterministic rule engine for every active scheme and persist one
    EligibilityResult per scheme. Returns the saved results in scheme order.
    """
    profile = citizen.as_rule_input()
    results = []
    for scheme in Scheme.objects.filter(is_active=True):
        outcome = rule_engine.evaluate(scheme.rules_json, profile)
        result, created = EligibilityResult.objects.get_or_create(
            citizen=citizen,
            scheme=scheme,
            defaults={
                "status": outcome.status,
                "matched_rules": outcome.matched,
                "missing_rules": outcome.missing,
            },
        )
        if not created:
            decision_changed = (
                result.status != outcome.status
                or result.matched_rules != outcome.matched
                or result.missing_rules != outcome.missing
            )
            result.status = outcome.status
            result.matched_rules = outcome.matched
            result.missing_rules = outcome.missing
            if decision_changed:
                result.explanation = ""
                result.explanation_language = ""
            result.save()
        results.append(result)
    return results


class EvaluateView(APIView):
    """POST /api/eligibility/evaluate/ — evaluate a citizen against all schemes."""

    def post(self, request):
        citizen_id = request.data.get("citizen_id")
        if not citizen_id:
            return error_response("VALIDATION_ERROR", "citizen_id is required.")
        citizen = get_citizen_or_none(citizen_id)
        if citizen is None:
            return error_response("CITIZEN_NOT_FOUND", "No citizen session with this id.", status.HTTP_404_NOT_FOUND)

        results = evaluate_citizen(citizen)
        payload = [
            {
                "id": r.id,
                "scheme_id": r.scheme_id,
                "scheme_code": r.scheme.code,
                "scheme_name": r.scheme.name,
                "status": r.status,
                "matched_rules": r.matched_rules,
                "missing_rules": r.missing_rules,
            }
            for r in results
        ]
        return Response({"citizen_id": str(citizen.citizen_id), "results": payload})


class ResultListView(APIView):
    """GET /api/eligibility/results/{citizen_id}/ — stored results for a citizen."""

    def get(self, request, citizen_id):
        citizen = get_citizen_or_none(citizen_id)
        if citizen is None:
            return error_response("CITIZEN_NOT_FOUND", "No citizen session with this id.", status.HTTP_404_NOT_FOUND)
        results = citizen.results.select_related("scheme").all()
        return Response(EligibilityResultSerializer(results, many=True).data)
