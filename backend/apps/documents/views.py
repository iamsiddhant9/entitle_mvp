import base64
import json
import uuid

from django.conf import settings
from django.core.cache import cache
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Q
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.citizens.models import CitizenProfile
from apps.schemes.models import Scheme

from .document_types import SUPPORTED_DOC_TYPES, get_spec
from .exceptions import (
    CITIZEN_ID_REQUIRED,
    DOCUMENT_QUALITY_TOO_LOW,
    FILE_REQUIRED,
    PERMISSION_DENIED,
    UNSUPPORTED_DOC_TYPE,
    DocumentAPIError,
)
from .models import Document
from .serializers import DocumentConfirmSerializer, DocumentUploadSerializer
from .services import expiry as expiry_service
from .services import gemini_vision, profile_mapping
from .services.digilocker_client import DigiLockerClient
from .services.normalization import normalise_fields, normalise_freeform_fields
from .services.ocr import process_document


def _lookup_citizen(identifier) -> CitizenProfile | None:
    """Resolve a citizen by UUID, falling back to integer primary key.

    Returns None when the identifier does not resolve — callers decide the error.
    """
    if identifier in (None, ""):
        return None

    raw = str(identifier).strip()
    try:
        return CitizenProfile.objects.filter(citizen_id=uuid.UUID(raw)).first()
    except (ValueError, AttributeError, TypeError):
        pass

    try:
        return CitizenProfile.objects.filter(id=int(raw)).first()
    except (TypeError, ValueError):
        return None


def _session_citizen_id(request) -> str | None:
    try:
        return request.session.get('citizen_id')
    except (AttributeError, KeyError):
        return None


def _resolve_request_citizen(request, provided_id) -> CitizenProfile:
    """Resolve the citizen this request acts for, or raise.

    Accepts an explicit ``citizen_id`` or the session established by
    ``POST /api/citizens/``. An unknown identifier is a 404 — never a silent orphan.
    """
    identifier = provided_id or _session_citizen_id(request)
    if identifier in (None, ""):
        raise DocumentAPIError(
            CITIZEN_ID_REQUIRED,
            "A 'citizen_id' is required to upload a document.",
        )

    citizen = _lookup_citizen(identifier)
    if citizen is None:
        raise NotFound(detail=f"Citizen with ID '{identifier}' not found.")
    return citizen


def _assert_owns_document(request, document, provided_id) -> None:
    """Ownership check for a document.

    Proof is knowledge of the owning citizen's UUID — the credential every other endpoint
    in this API is already keyed on — supplied in the request body, the ``X-Citizen-Id``
    header, or the citizen session. The integer primary-key form accepted elsewhere is
    deliberately *not* accepted here: it is enumerable, so it would prove nothing.
    """
    if document.citizen is None:
        raise DocumentAPIError(
            PERMISSION_DENIED,
            "This document is not associated with a citizen and cannot be confirmed.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    owner_uuid = str(document.citizen.citizen_id)
    candidates = (
        provided_id,
        request.headers.get('X-Citizen-Id'),
        _session_citizen_id(request),
    )
    for candidate in candidates:
        if candidate and str(candidate).strip().lower() == owner_uuid.lower():
            return

    raise DocumentAPIError(
        PERMISSION_DENIED,
        "You are not authorised to confirm this document. "
        "Provide the 'citizen_id' of the citizen the document belongs to.",
        status_code=status.HTTP_403_FORBIDDEN,
    )


class DocumentUploadView(APIView):
    """
    POST /api/documents/upload/
    Validates and stores a document, assesses image quality, and runs structured
    Gemini Vision extraction. A failed extraction is reported as such — never as data.
    """

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            raise DocumentAPIError(
                FILE_REQUIRED, "File upload 'file' is required."
            )

        doc_type = str(request.data.get('doc_type') or '').strip()
        if not doc_type:
            raise DocumentAPIError(
                UNSUPPORTED_DOC_TYPE,
                "Field 'doc_type' is required. Supported types: "
                f"{', '.join(SUPPORTED_DOC_TYPES)}.",
            )

        spec = get_spec(doc_type)
        if spec is None:
            raise DocumentAPIError(
                UNSUPPORTED_DOC_TYPE,
                f"Unsupported document type '{doc_type}'. Supported types: "
                f"{', '.join(SUPPORTED_DOC_TYPES)}.",
            )

        citizen = _resolve_request_citizen(request, request.data.get('citizen_id'))

        result = process_document(file_obj, spec)

        document = Document.objects.create(
            citizen=citizen,
            doc_type=doc_type,
            file=ContentFile(result.upload.data, name=result.upload.filename),
            extracted_fields=result.extraction.fields,
            is_blurry=result.is_blurry,
            is_expired=result.is_expired,
            confirmed=False,
            extraction_status=result.extraction.status,
            extraction_source=result.extraction.source,
            extraction_model=result.extraction.model,
            extraction_error=result.extraction.error,
            quality_status=result.quality.status,
            blur_score=result.quality.laplacian_variance,
            expiry_status=result.expiry_status,
            expiry_date=result.expiry_date,
        )

        return Response(
            DocumentUploadSerializer(document).data,
            status=status.HTTP_201_CREATED,
        )


class DocumentConfirmView(APIView):
    """
    POST /api/documents/{id}/confirm/
    The trust boundary: a citizen reviews the extracted fields and confirms them. Only
    after this does the data become verified document data and reach the profile.
    """

    def post(self, request, id, *args, **kwargs):
        try:
            document = Document.objects.select_related('citizen').get(id=id)
        except Document.DoesNotExist:
            raise NotFound(detail=f"Document with ID '{id}' not found.")

        # raise_exception routes through the project's error envelope rather than
        # returning DRF's raw error dict.
        serializer = DocumentConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        _assert_owns_document(request, document, serializer.validated_data.get('citizen_id'))

        if document.is_blurry:
            raise DocumentAPIError(
                DOCUMENT_QUALITY_TOO_LOW,
                "This document image is too blurry or blank to be read reliably and "
                "cannot be confirmed. Please upload a clearer photo or scan.",
            )

        spec = get_spec(document.doc_type)

        with transaction.atomic():
            if 'extracted_fields' in serializer.validated_data:
                submitted = serializer.validated_data['extracted_fields']
                if spec is not None and spec.supports_extraction:
                    document.extracted_fields = normalise_fields(spec, submitted)
                else:
                    document.extracted_fields = normalise_freeform_fields(submitted)
                # The values now on record are the citizen's, not the model's.
                document.extraction_source = gemini_vision.SOURCE_HUMAN

            expiry_status, expiry_date = expiry_service.evaluate_expiry(
                spec, document.extracted_fields
            )
            document.expiry_status = expiry_status
            document.expiry_date = expiry_date
            document.is_expired = expiry_service.is_expired(expiry_status)

            document.confirmed = True
            document.confirmed_at = timezone.now()
            document.save()

            mapping = profile_mapping.apply_confirmed_document(document)
            document.profile_mapping_json = mapping.as_dict()
            document.save(update_fields=['profile_mapping_json', 'updated_at'])

        return Response(
            {
                "document_id": document.id,
                "confirmed": document.confirmed,
                "extracted_fields": document.extracted_fields,
                "extraction_source": document.extraction_source,
                "expiry_status": document.expiry_status,
                "is_expired": document.is_expired,
                "profile_update": document.profile_mapping_json,
            },
            status=status.HTTP_200_OK,
        )


class DocumentMissingView(APIView):
    """
    GET /api/documents/missing/{citizen_id}/{scheme_code}/
    Diff of the documents that satisfy a scheme's requirements against those required.

    A document satisfies a requirement only when it is confirmed by the citizen and not
    expired. Unconfirmed uploads never count.
    """

    def get(self, request, citizen_id, scheme_code, *args, **kwargs):
        citizen = _lookup_citizen(citizen_id)
        if citizen is None:
            raise NotFound(detail=f"Citizen with ID '{citizen_id}' not found.")

        try:
            scheme = Scheme.objects.get(code=scheme_code)
        except Scheme.DoesNotExist:
            raise NotFound(detail=f"Scheme with code '{scheme_code}' not found.")

        required_docs = scheme.required_documents_json or []
        documents = Document.objects.filter(citizen=citizen)

        def _distinct_types(queryset):
            return sorted(set(queryset.values_list('doc_type', flat=True)))

        # Expiry is time-relative, so the stored verdict from confirmation time is
        # combined with a live check against today. Without the live half, a certificate
        # confirmed while valid would keep satisfying the requirement forever after its
        # printed date; without the stored half, a document already marked expired by the
        # pipeline would be missed.
        currently_expired = (
            Q(is_expired=True)
            | Q(expiry_status=expiry_service.STATUS_EXPIRED)
            | Q(expiry_date__lt=timezone.localdate())
        )
        confirmed_docs = documents.filter(confirmed=True)

        satisfying = _distinct_types(confirmed_docs.exclude(currently_expired))
        unconfirmed = _distinct_types(documents.filter(confirmed=False))
        expired = _distinct_types(confirmed_docs.filter(currently_expired))

        missing_docs = [doc for doc in required_docs if doc not in satisfying]

        return Response(
            {
                "citizen_id": str(citizen.citizen_id),
                "scheme_code": scheme.code,
                "required_documents": required_docs,
                "uploaded_documents": satisfying,
                "missing_documents": missing_docs,
                "unconfirmed_documents": unconfirmed,
                "expired_documents": expired,
            },
            status=status.HTTP_200_OK,
        )


class DigiLockerAuthURLView(APIView):
    """
    GET /api/documents/digilocker/auth-url/
    Returns the DigiLocker OAuth URL to redirect the user to.
    """
    def get(self, request, *args, **kwargs):
        citizen_id = request.query_params.get('citizen_id')
        doc_types_str = request.query_params.get('doc_types', '')
        
        if not citizen_id:
            raise ValidationError("citizen_id query parameter is required.")
        
        doc_types = [d.strip() for d in doc_types_str.split(',')] if doc_types_str else []
        
        client = DigiLockerClient()
        auth_url = client.build_auth_url(citizen_id, doc_types)
        
        return Response({"auth_url": auth_url}, status=status.HTTP_200_OK)


class DigiLockerCallbackView(APIView):
    """
    GET /api/documents/digilocker/callback/
    Handles the redirect from DigiLocker, exchanges the code, stores token in cache.
    """
    def get(self, request, *args, **kwargs):
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        
        if not code or not state:
            return Response({"error": "Missing code or state from DigiLocker"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Decode state
        try:
            state_json = json.loads(base64.urlsafe_b64decode(state + "==").decode())
            citizen_id = state_json.get("citizen_id")
        except Exception:
            citizen_id = "unknown"
            
        client = DigiLockerClient()
        try:
            access_token = client.exchange_code(code)
            # Store in cache with 5 minute TTL (300 seconds)
            cache.set(f"digilocker_token_{citizen_id}", access_token, timeout=300)
        except Exception as e:
            # On error, redirect back with error param
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            return redirect(f"{frontend_url}/documents?digilocker=error&reason=exchange_failed")
            
        # Redirect back to frontend assistant flow
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        return redirect(f"{frontend_url}/documents?digilocker=success&citizen_id={citizen_id}")


class DigiLockerFetchView(APIView):
    """
    POST /api/documents/digilocker/fetch/
    Not yet available.

    The original implementation called ``check_image_blur`` / ``extract_document_fields``,
    which no longer exist: the OCR pipeline was rebuilt so that a failed extraction can
    never be mistaken for a successful one. Fetched documents also bypassed file
    validation, quality assessment and extraction provenance entirely.

    Rather than reinstate that path or silently store unverified data, this endpoint
    reports that it is not implemented. The OAuth routes above still work, so the
    connect flow can be developed against it.

    To finish this: route the fetched bytes through
    ``apps.documents.services.ocr.process_document`` like a normal upload. Note that
    DigiLocker returns PDFs, which the hardened pipeline currently rejects by design —
    PDF support is the prerequisite. See docs/scheme-rule-audit.md's sibling note in
    docs/deployment.md for the open items.
    """

    def post(self, request, *args, **kwargs):
        return Response(
            {
                "error": {
                    "code": "NOT_IMPLEMENTED",
                    "message": (
                        "DigiLocker document fetch is not available yet. The document "
                        "pipeline requires validation and extraction provenance that this "
                        "path does not provide. Please upload the document directly via "
                        "POST /api/documents/upload/."
                    ),
                }
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
