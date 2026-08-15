import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, ValidationError
from apps.citizens.models import CitizenProfile
from apps.schemes.models import Scheme
from .models import EligibilityResult
from .serializers import EligibilityResultSerializer, EvaluateEligibilityRequestSerializer
from .services.rule_engine import evaluate

class EvaluateEligibilityView(APIView):
    """
    POST /api/eligibility/evaluate/
    Evaluates citizen's profile against all schemes in the database using pure Python rule engine.
    """
    def post(self, request, *args, **kwargs):
        req_serializer = EvaluateEligibilityRequestSerializer(data=request.data)
        if not req_serializer.is_valid():
            return Response(req_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        citizen_id_raw = req_serializer.validated_data['citizen_id']
        try:
            val = uuid.UUID(str(citizen_id_raw))
            citizen = CitizenProfile.objects.get(citizen_id=val)
        except (ValueError, CitizenProfile.DoesNotExist):
            try:
                citizen = CitizenProfile.objects.get(id=int(citizen_id_raw))
            except (ValueError, CitizenProfile.DoesNotExist):
                raise NotFound(detail=f"Citizen with ID '{citizen_id_raw}' not found.")

        profile_dict = citizen.to_rule_dict()
        schemes = Scheme.objects.all()
        
        results_list = []
        for scheme in schemes:
            rule_result = evaluate(scheme.rules_json, profile_dict)
            
            # Save or update eligibility result
            eligibility_record, _ = EligibilityResult.objects.update_or_create(
                citizen=citizen,
                scheme=scheme,
                defaults={
                    "status": rule_result.status,
                    "matched_rules": rule_result.matched,
                    "missing_rules": rule_result.missing,
                }
            )
            results_list.append(eligibility_record)

        serialized_results = EligibilityResultSerializer(results_list, many=True).data

        return Response({
            "citizen_id": str(citizen.citizen_id),
            "results": serialized_results
        }, status=status.HTTP_200_OK)

class EligibilityResultsListView(APIView):
    """
    GET /api/eligibility/results/{citizen_id}/
    Lists current eligibility results for a citizen.
    """
    def get(self, request, citizen_id, *args, **kwargs):
        try:
            val = uuid.UUID(str(citizen_id))
            citizen = CitizenProfile.objects.get(citizen_id=val)
        except (ValueError, CitizenProfile.DoesNotExist):
            try:
                citizen = CitizenProfile.objects.get(id=int(citizen_id))
            except (ValueError, CitizenProfile.DoesNotExist):
                raise NotFound(detail=f"Citizen with ID '{citizen_id}' not found.")

        results = EligibilityResult.objects.filter(citizen=citizen).select_related('scheme')
        serializer = EligibilityResultSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
