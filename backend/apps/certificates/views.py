import re

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.eligibility.models import EligibilityResult
from entitle.errors import error_response

from .models import Certificate
from .services import blockchain
from .services.hashing import hash_payload

HASH_RE = re.compile(r"^0x[0-9a-fA-F]{64}$")


def _explorer_url(certificate):
    """Explorer link only for real on-chain transactions, never simulated ones."""
    if certificate.chain_status != "submitted" or not certificate.tx_hash:
        return ""
    return settings.EXPLORER_TX_BASE_URL + certificate.tx_hash


def _qr_payload(eligibility_hash):
    return settings.CERTIFICATE_VERIFY_BASE_URL + eligibility_hash


class CertificateIssueView(APIView):
    """POST /api/certificates/issue/ — hash the result and anchor it on Polygon Amoy."""

    def post(self, request):
        result_id = request.data.get("eligibility_result_id")
        if not result_id:
            return error_response("VALIDATION_ERROR", "eligibility_result_id is required.")
        result = (
            EligibilityResult.objects.select_related("scheme", "citizen").filter(id=result_id).first()
        )
        if result is None:
            return error_response("RESULT_NOT_FOUND", "No eligibility result with this id.", status.HTTP_404_NOT_FOUND)

        payload = {
            "certificate_version": 1,
            "citizen_id": str(result.citizen.citizen_id),
            "scheme_code": result.scheme.code,
            "scheme_name": result.scheme.name,
            "status": result.status,
            "matched_rules": result.matched_rules,
            "missing_rules": result.missing_rules,
            "evaluated_at": result.updated_at.isoformat(),
        }
        eligibility_hash = hash_payload(payload)
        chain = blockchain.store_hash(eligibility_hash)

        certificate = Certificate.objects.create(
            eligibility_result=result,
            payload_json=payload,
            eligibility_hash=eligibility_hash,
            tx_hash=chain["tx_hash"],
            chain_status=chain["chain_status"],
        )
        return Response(
            {
                "certificate_id": certificate.id,
                "eligibility_result_id": result.id,
                "eligibility_hash": certificate.eligibility_hash,
                "tx_hash": certificate.tx_hash,
                "chain_status": certificate.chain_status,
                "explorer_url": _explorer_url(certificate),
                "issued_at": certificate.issued_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class CertificateDetailView(APIView):
    """GET /api/certificates/{id}/ — certificate details + QR payload."""

    def get(self, request, certificate_id):
        certificate = Certificate.objects.select_related("eligibility_result").filter(id=certificate_id).first()
        if certificate is None:
            return error_response("CERTIFICATE_NOT_FOUND", "No certificate with this id.", status.HTTP_404_NOT_FOUND)
        return Response(
            {
                "id": certificate.id,
                "eligibility_result_id": certificate.eligibility_result_id,
                "eligibility_hash": certificate.eligibility_hash,
                "tx_hash": certificate.tx_hash,
                "chain_status": certificate.chain_status,
                "explorer_url": _explorer_url(certificate),
                "qr_payload": _qr_payload(certificate.eligibility_hash),
                "payload": certificate.payload_json,
                "issued_at": certificate.issued_at.isoformat(),
            }
        )


class CertificateVerifyView(APIView):
    """
    GET /api/certificates/verify/{hash}/ — integrity check for a certificate
    hash (QR code target). Checks the local registry and, when configured,
    the on-chain EligibilityRegistry.
    """

    def get(self, request, eligibility_hash):
        if not HASH_RE.match(eligibility_hash):
            return error_response("VALIDATION_ERROR", "Malformed certificate hash.")
        certificate = (
            Certificate.objects.filter(eligibility_hash__iexact=eligibility_hash)
            .order_by("-issued_at")
            .first()
        )
        verified_on_chain = blockchain.verify_hash(eligibility_hash)
        return Response(
            {
                "eligibility_hash": eligibility_hash,
                "exists": certificate is not None,
                "verified_on_chain": verified_on_chain,
                "chain_status": certificate.chain_status if certificate else "",
                "tx_hash": certificate.tx_hash if certificate else "",
                "explorer_url": _explorer_url(certificate) if certificate else "",
                "scheme_name": certificate.payload_json.get("scheme_name", "") if certificate else "",
                "status": certificate.payload_json.get("status", "") if certificate else "",
                "issued_at": certificate.issued_at.isoformat() if certificate else None,
            }
        )
