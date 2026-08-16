import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import NotFound, ValidationError
from apps.citizens.models import CitizenProfile
from apps.schemes.models import Scheme
from .models import Document
from .serializers import DocumentUploadSerializer, DocumentConfirmSerializer
from .services.ocr import check_image_blur, extract_document_fields

class DocumentUploadView(APIView):
    """
    POST /api/documents/upload/
    Uploads a document, runs blur check, and extracts fields via OCR pipeline.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        doc_type = request.data.get('doc_type', 'generic_document')
        citizen_id_raw = request.data.get('citizen_id')

        citizen = None
        if citizen_id_raw:
            try:
                val = uuid.UUID(str(citizen_id_raw))
                citizen = CitizenProfile.objects.filter(citizen_id=val).first()
            except (ValueError, CitizenProfile.DoesNotExist):
                try:
                    citizen = CitizenProfile.objects.filter(id=int(citizen_id_raw)).first()
                except Exception:
                    pass

        if not file_obj:
            raise ValidationError("File upload 'file' is required.")

        is_blurry = check_image_blur(file_obj)
        extracted = extract_document_fields(file_obj, doc_type)

        doc = Document.objects.create(
            citizen=citizen,
            doc_type=doc_type,
            file=file_obj,
            extracted_fields=extracted,
            is_blurry=is_blurry,
            is_expired=False,
            confirmed=False
        )

        return Response({
            "document_id": doc.id,
            "doc_type": doc.doc_type,
            "file_ref": doc.file.url if doc.file else "",
            "extracted_fields": doc.extracted_fields,
            "is_blurry": doc.is_blurry,
            "is_expired": doc.is_expired
        }, status=status.HTTP_201_CREATED)

class DocumentConfirmView(APIView):
    """
    POST /api/documents/{id}/confirm/
    Confirms or edits the extracted OCR fields for a document.
    """
    def post(self, request, id, *args, **kwargs):
        try:
            doc = Document.objects.get(id=id)
        except Document.DoesNotExist:
            raise NotFound(detail=f"Document with ID '{id}' not found.")

        serializer = DocumentConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        doc.confirmed = serializer.validated_data.get('confirmed', True)
        if 'extracted_fields' in serializer.validated_data:
            doc.extracted_fields = serializer.validated_data['extracted_fields']
        doc.save()

        return Response({
            "document_id": doc.id,
            "confirmed": doc.confirmed,
            "extracted_fields": doc.extracted_fields
        }, status=status.HTTP_200_OK)

class DocumentMissingView(APIView):
    """
    GET /api/documents/missing/{citizen_id}/{scheme_code}/
    Returns diff of confirmed documents uploaded versus documents required for the scheme.
    """
    def get(self, request, citizen_id, scheme_code, *args, **kwargs):
        try:
            val = uuid.UUID(str(citizen_id))
            citizen = CitizenProfile.objects.get(citizen_id=val)
        except (ValueError, CitizenProfile.DoesNotExist):
            try:
                citizen = CitizenProfile.objects.get(id=int(citizen_id))
            except (ValueError, CitizenProfile.DoesNotExist):
                raise NotFound(detail=f"Citizen with ID '{citizen_id}' not found.")

        try:
            scheme = Scheme.objects.get(code=scheme_code)
        except Scheme.DoesNotExist:
            raise NotFound(detail=f"Scheme with code '{scheme_code}' not found.")

        required_docs = scheme.required_documents_json or []
        uploaded_docs = list(
            Document.objects.filter(citizen=citizen, confirmed=True)
            .values_list('doc_type', flat=True)
            .distinct()
        )
        
        # If no confirmed docs, include all uploaded docs for flexible demo experience
        if not uploaded_docs:
            uploaded_docs = list(
                Document.objects.filter(citizen=citizen)
                .values_list('doc_type', flat=True)
                .distinct()
            )

        missing_docs = [doc for doc in required_docs if doc not in uploaded_docs]

        return Response({
            "citizen_id": str(citizen.citizen_id),
            "scheme_code": scheme.code,
            "required_documents": required_docs,
            "uploaded_documents": uploaded_docs,
            "missing_documents": missing_docs
        }, status=status.HTTP_200_OK)
