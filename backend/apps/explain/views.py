from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.eligibility.models import EligibilityResult
from apps.schemes.models import Scheme
from entitle.errors import error_response

from .services import gemini_client


class ExplainView(APIView):
    """POST /api/explain/ — natural-language explanation of an eligibility result."""

    def post(self, request):
        result_id = request.data.get("eligibility_result_id")
        if not result_id:
            return error_response("VALIDATION_ERROR", "eligibility_result_id is required.")
        language = request.data.get("language", "en")
        if language not in ("en", "hi"):
            return error_response("VALIDATION_ERROR", "language must be 'en' or 'hi'.")

        result = EligibilityResult.objects.select_related("scheme").filter(id=result_id).first()
        if result is None:
            return error_response("RESULT_NOT_FOUND", "No eligibility result with this id.", status.HTTP_404_NOT_FOUND)

        if not result.explanation or result.explanation_language != language:
            result.explanation = gemini_client.explain_result(result, result.scheme, language)
            result.explanation_language = language
            result.save(update_fields=["explanation", "explanation_language", "updated_at"])

        return Response({"eligibility_result_id": result.id, "explanation": result.explanation})


class KnowledgeAskView(APIView):
    """POST /api/knowledge/ask/ — grounded Q&A about a scheme."""

    def post(self, request):
        question = (request.data.get("question") or "").strip()
        if not question:
            return error_response("VALIDATION_ERROR", "question is required.")
        if len(question) > 500:
            return error_response("VALIDATION_ERROR", "question must be at most 500 characters.")

        scheme = None
        scheme_code = request.data.get("scheme_code")
        if scheme_code:
            scheme = Scheme.objects.filter(code=scheme_code, is_active=True).first()
            if scheme is None:
                return error_response(
                    "SCHEME_NOT_FOUND", "No scheme with code '{}'.".format(scheme_code), status.HTTP_404_NOT_FOUND
                )

        answer, source_url = gemini_client.answer_question(question, scheme)
        return Response({"answer": answer, "source_url": source_url})
