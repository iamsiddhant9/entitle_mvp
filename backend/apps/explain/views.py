from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.eligibility.models import EligibilityResult
from apps.schemes.models import Scheme

from .exceptions import PERMISSION_DENIED, ExplainAPIError
from .services.groq_client import answer_knowledge_query, explain_eligibility

#: Official portal used when ENTITLE has no record of the scheme being asked about.
GENERAL_SCHEMES_PORTAL = "https://www.india.gov.in/my-government/schemes"


def _session_citizen_id(request) -> str | None:
    try:
        return request.session.get('citizen_id')
    except (AttributeError, KeyError):
        return None


def _assert_owns_result(request, result) -> None:
    """Ownership check for an eligibility result.

    Proof is knowledge of the owning citizen's UUID — the credential the rest of this API
    is already keyed on — supplied in the request body, the ``X-Citizen-Id`` header, or the
    citizen session. The integer primary key is deliberately not accepted: it is
    enumerable, so it would prove nothing. This mirrors the check already applied to
    document confirmation in ``apps.documents.views``.
    """
    owner_uuid = str(result.citizen.citizen_id)
    candidates = (
        request.data.get('citizen_id') if hasattr(request, 'data') else None,
        request.headers.get('X-Citizen-Id'),
        _session_citizen_id(request),
    )
    for candidate in candidates:
        if candidate and str(candidate).strip().lower() == owner_uuid.lower():
            return

    raise ExplainAPIError(
        PERMISSION_DENIED,
        "You are not authorised to view this eligibility result. Provide the "
        "'citizen_id' of the citizen it belongs to.",
        status_code=status.HTTP_403_FORBIDDEN,
    )


class ExplainEligibilityView(APIView):
    """
    POST /api/explain/
    Explains an eligibility result in plain language.

    The verdict comes from the deterministic rule engine; this endpoint only renders it
    for a human. Gemini never decides eligibility, and the citizen's profile is not sent
    to the model.
    """

    def post(self, request, *args, **kwargs):
        result_id = request.data.get("eligibility_result_id")
        language = request.data.get("language", "en")

        if not result_id:
            raise ValidationError("Field 'eligibility_result_id' is required.")

        try:
            result = EligibilityResult.objects.select_related('citizen', 'scheme').get(
                id=result_id
            )
        except (EligibilityResult.DoesNotExist, ValueError, TypeError):
            raise NotFound(detail=f"EligibilityResult with ID '{result_id}' not found.")

        _assert_owns_result(request, result)

        explanation = explain_eligibility(
            scheme_name=result.scheme.name,
            scheme_description=result.scheme.description,
            status=result.status,
            matched_rules=result.matched_rules,
            missing_rules=result.missing_rules,
            language=language,
        )

        return Response({
            "eligibility_result_id": result.id,
            "explanation": explanation
        }, status=status.HTTP_200_OK)


class KnowledgeAskView(APIView):
    """
    POST /api/knowledge/ask/
    Answers a question about a scheme, grounded strictly in the scheme record ENTITLE
    holds. When the scheme is unknown, it says so rather than answering generically.
    """

    def post(self, request, *args, **kwargs):
        question = request.data.get("question")
        scheme_code = request.data.get("scheme_code")
        language = request.data.get("language", "en")

        if not question:
            raise ValidationError("Field 'question' is required.")

        scheme = None
        if scheme_code:
            scheme = Scheme.objects.filter(code=scheme_code).first()

        if scheme is None:
            # Previously this fell through to a generic "Government Scheme" stub, which
            # invited the model to answer about a scheme ENTITLE knows nothing about.
            answer = answer_knowledge_query(
                question=question,
                scheme_code=scheme_code or "",
                scheme_name="",
                scheme_description="",
                rules_json={},
                source_url=GENERAL_SCHEMES_PORTAL,
                language=language,
                scheme_found=False,
            )
            return Response({
                "answer": answer,
                "source_url": GENERAL_SCHEMES_PORTAL
            }, status=status.HTTP_200_OK)

        source_url = scheme.source_url or GENERAL_SCHEMES_PORTAL
        answer = answer_knowledge_query(
            question=question,
            scheme_code=scheme.code,
            scheme_name=scheme.name,
            scheme_description=scheme.description,
            rules_json=scheme.rules_json,
            source_url=source_url,
            language=language,
            scheme_found=True,
        )

        return Response({
            "answer": answer,
            "source_url": source_url
        }, status=status.HTTP_200_OK)
