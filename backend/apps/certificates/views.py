from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, ValidationError
from apps.eligibility.models import EligibilityResult
from .models import Certificate
from .serializers import CertificateSerializer
from .services.hashing import compute_hash
from .services.blockchain import store_hash_on_chain

class CertificateIssueView(APIView):
    """
    POST /api/certificates/issue/
    Hashes the eligibility result, issues transaction to Polygon Amoy blockchain, and stores certificate.
    """
    def post(self, request, *args, **kwargs):
        result_id = request.data.get("eligibility_result_id")
        if not result_id:
            raise ValidationError("Field 'eligibility_result_id' is required.")

        try:
            result = EligibilityResult.objects.select_related('citizen', 'scheme').get(id=result_id)
        except EligibilityResult.DoesNotExist:
            raise NotFound(detail=f"EligibilityResult with ID '{result_id}' not found.")

        # If certificate already exists, return existing
        if hasattr(result, 'certificate'):
            serializer = CertificateSerializer(result.certificate)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Compute canonical SHA-256 hash (Zero PII, only verifiable attributes)
        hash_payload = {
            "citizen_id": str(result.citizen.citizen_id),
            "scheme_code": result.scheme.code,
            "status": result.status,
            "matched_rules": result.matched_rules,
            "missing_rules": result.missing_rules,
            "evaluation_time": result.created_at.isoformat()
        }
        eligibility_hash = compute_hash(hash_payload)

        # Store hash on-chain (Polygon Amoy)
        chain_res = store_hash_on_chain(eligibility_hash)
        tx_hash = chain_res["tx_hash"]
        explorer_url = chain_res["explorer_url"]
        qr_payload = f"https://entitle.gov.in/verify/{eligibility_hash}"

        cert = Certificate.objects.create(
            eligibility_result=result,
            eligibility_hash=eligibility_hash,
            tx_hash=tx_hash,
            explorer_url=explorer_url,
            qr_payload=qr_payload
        )

        serializer = CertificateSerializer(cert)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class CertificateDetailView(APIView):
    """
    GET /api/certificates/{id}/
    Retrieves detailed certificate verify details, including transaction status and verification QR payload.
    Supports lookup by certificate ID or eligibility_hash.
    """
    def get(self, request, id, *args, **kwargs):
        cert = None
        try:
            cert = Certificate.objects.get(id=int(id))
        except (ValueError, Certificate.DoesNotExist):
            try:
                cert = Certificate.objects.get(eligibility_hash=str(id))
            except Certificate.DoesNotExist:
                raise NotFound(detail=f"Certificate with identifier '{id}' not found.")

        serializer = CertificateSerializer(cert)
        return Response(serializer.data, status=status.HTTP_200_OK)
