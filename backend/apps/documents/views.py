from django.conf import settings
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.citizens.views import get_citizen_or_none
from apps.schemes.models import Scheme
from entitle.errors import error_response

from .models import Document
from .services.ocr import process_document

VALID_DOC_TYPES = {choice for choice, _ in Document.DOC_TYPE_CHOICES}


def _document_payload(document):
    return {
        "document_id": document.id,
        "doc_type": document.doc_type,
        "file_ref": document.file.url,
        "extracted_fields": document.extracted_fields,
        "is_blurry": document.is_blurry,
        "is_expired": document.is_expired,
        "confirmed": document.confirmed,
    }


class DocumentUploadView(APIView):
    """POST /api/documents/upload/ — multipart: file, doc_type, citizen_id."""

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload = request.FILES.get("file")
        doc_type = request.data.get("doc_type")
        citizen_id = request.data.get("citizen_id") or request.COOKIES.get("citizen_id")

        if upload is None:
            return error_response("VALIDATION_ERROR", "file is required.")
        if doc_type not in VALID_DOC_TYPES:
            return error_response(
                "VALIDATION_ERROR",
                "doc_type must be one of: {}.".format(", ".join(sorted(VALID_DOC_TYPES))),
            )
        if not citizen_id:
            return error_response("VALIDATION_ERROR", "citizen_id is required (form field or cookie).")
        citizen = get_citizen_or_none(citizen_id)
        if citizen is None:
            return error_response("CITIZEN_NOT_FOUND", "No citizen session with this id.", status.HTTP_404_NOT_FOUND)
        if upload.size > settings.MAX_DOCUMENT_UPLOAD_BYTES:
            return error_response(
                "FILE_TOO_LARGE",
                "File exceeds the {} MB limit.".format(settings.MAX_DOCUMENT_UPLOAD_BYTES // (1024 * 1024)),
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        file_bytes = upload.read()
        upload.seek(0)
        pipeline = process_document(file_bytes, upload.content_type or "image/jpeg", doc_type)

        document = Document.objects.create(
            citizen=citizen,
            doc_type=doc_type,
            file=upload,
            extracted_fields=pipeline["extracted_fields"],
            is_blurry=pipeline["is_blurry"],
            blur_score=pipeline["blur_score"],
            is_expired=pipeline["is_expired"],
        )
        return Response(_document_payload(document), status=status.HTTP_201_CREATED)


class DocumentConfirmView(APIView):
    """POST /api/documents/{id}/confirm/ — citizen confirms/corrects extracted fields."""

    def post(self, request, document_id):
        document = Document.objects.filter(id=document_id).first()
        if document is None:
            return error_response("DOCUMENT_NOT_FOUND", "No document with this id.", status.HTTP_404_NOT_FOUND)

        confirmed = request.data.get("confirmed")
        if confirmed is None:
            return error_response("VALIDATION_ERROR", "confirmed is required.")
        fields = request.data.get("extracted_fields")
        if fields is not None:
            if not isinstance(fields, dict):
                return error_response("VALIDATION_ERROR", "extracted_fields must be an object.")
            document.extracted_fields = fields
        document.confirmed = bool(confirmed)
        document.save()
        return Response(
            {
                "document_id": document.id,
                "confirmed": document.confirmed,
                "extracted_fields": document.extracted_fields,
            }
        )


class MissingDocumentsView(APIView):
    """GET /api/documents/missing/{citizen_id}/{scheme_code}/ — required vs uploaded diff."""

    def get(self, request, citizen_id, scheme_code):
        citizen = get_citizen_or_none(citizen_id)
        if citizen is None:
            return error_response("CITIZEN_NOT_FOUND", "No citizen session with this id.", status.HTTP_404_NOT_FOUND)
        scheme = Scheme.objects.filter(code=scheme_code, is_active=True).first()
        if scheme is None:
            return error_response(
                "SCHEME_NOT_FOUND", "No scheme with code '{}'.".format(scheme_code), status.HTTP_404_NOT_FOUND
            )

        required = scheme.required_documents_json or []
        uploaded = list(
            citizen.documents.filter(confirmed=True).values_list("doc_type", flat=True).distinct()
        )
        missing = [doc for doc in required if doc not in uploaded]
        return Response(
            {
                "citizen_id": str(citizen.citizen_id),
                "scheme_code": scheme.code,
                "required_documents": required,
                "uploaded_documents": [doc for doc in required if doc in uploaded],
                "missing_documents": missing,
            }
        )
