from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, ValidationError
from apps.eligibility.models import EligibilityResult
from apps.schemes.models import Scheme
from .services.gemini_client import explain_eligibility, answer_knowledge_query

class ExplainEligibilityView(APIView):
    """
    POST /api/explain/
    Generates a natural language explainability response from Gemini for a specific eligibility result.
    """
    def post(self, request, *args, **kwargs):
        result_id = request.data.get("eligibility_result_id")
        language = request.data.get("language", "en")

        if not result_id:
            raise ValidationError("Field 'eligibility_result_id' is required.")

        try:
            result = EligibilityResult.objects.select_related('citizen', 'scheme').get(id=result_id)
        except EligibilityResult.DoesNotExist:
            raise NotFound(detail=f"EligibilityResult with ID '{result_id}' not found.")

        explanation = explain_eligibility(
            scheme_name=result.scheme.name,
            scheme_description=result.scheme.description,
            status=result.status,
            matched_rules=result.matched_rules,
            missing_rules=result.missing_rules,
            citizen_profile=result.citizen.to_rule_dict(),
            language=language
        )

        return Response({
            "eligibility_result_id": result.id,
            "explanation": explanation
        }, status=status.HTTP_200_OK)

class KnowledgeAskView(APIView):
    """
    POST /api/knowledge/ask/
    Grounded query-answering chat assistant for government schemes.
    """
    def post(self, request, *args, **kwargs):
        question = request.data.get("question")
        scheme_code = request.data.get("scheme_code")
        language = request.data.get("language", "en")

        if not question:
            raise ValidationError("Field 'question' is required.")

        scheme_name = "Government Scheme"
        scheme_description = "Indian government welfare programs."
        rules_json = {}
        source_url = "https://www.india.gov.in/my-government/schemes"

        if scheme_code:
            try:
                scheme = Scheme.objects.get(code=scheme_code)
                scheme_name = scheme.name
                scheme_description = scheme.description
                rules_json = scheme.rules_json
                source_url = scheme.source_url or source_url
            except Scheme.DoesNotExist:
                pass

        answer = answer_knowledge_query(
            question=question,
            scheme_code=scheme_code or "general",
            scheme_name=scheme_name,
            scheme_description=scheme_description,
            rules_json=rules_json,
            source_url=source_url,
            language=language
        )

        return Response({
            "answer": answer,
            "source_url": source_url
        }, status=status.HTTP_200_OK)
