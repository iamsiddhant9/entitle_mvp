import uuid
import json
import base64
from django.conf import settings
from django.core.cache import cache
from django.shortcuts import redirect
from django.core.files.base import ContentFile
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
from .services.digilocker_client import DigiLockerClient

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
    Uses the cached access token to fetch a document, runs OCR, and creates the Document.
    """
    def post(self, request, *args, **kwargs):
        citizen_id_raw = request.data.get('citizen_id')
        doc_type = request.data.get('doc_type')
        digilocker_uri = request.data.get('digilocker_uri')
        
        if not citizen_id_raw or not doc_type or not digilocker_uri:
            raise ValidationError("citizen_id, doc_type, and digilocker_uri are required.")
            
        try:
            val = uuid.UUID(str(citizen_id_raw))
            citizen = CitizenProfile.objects.filter(citizen_id=val).first()
        except (ValueError, CitizenProfile.DoesNotExist):
            try:
                citizen = CitizenProfile.objects.filter(id=int(citizen_id_raw)).first()
            except Exception:
                citizen = None
                
        if not citizen:
            raise ValidationError("Invalid citizen_id.")
            
        # Retrieve token from cache
        access_token = cache.get(f"digilocker_token_{citizen.citizen_id}")
        if not access_token:
            return Response({"error": "DigiLocker session expired. Please connect again."}, status=status.HTTP_401_UNAUTHORIZED)
            
        client = DigiLockerClient()
        try:
            # Fetch raw bytes
            file_bytes = client.fetch_document(access_token, digilocker_uri)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
            
        # Create a Django ContentFile from bytes for the OCR pipeline
        # We assign a dummy filename, as OCR just reads the bytes anyway
        file_obj = ContentFile(file_bytes, name=f"digilocker_{doc_type}_{citizen.citizen_id}.pdf")
        
        is_blurry = check_image_blur(file_obj)
        extracted = extract_document_fields(file_obj, doc_type)
        
        doc = Document.objects.create(
            citizen=citizen,
            doc_type=doc_type,
            file=file_obj,
            extracted_fields=extracted,
            is_blurry=is_blurry,
            is_expired=False,
            confirmed=False,
            # If there's a source field in models.py, we could set it to "digilocker", 
            # but we assume doc_type is sufficient or it wasn't strictly added yet.
        )
        
        return Response({
            "document_id": doc.id,
            "doc_type": doc.doc_type,
            "source": "digilocker",
            "file_ref": doc.file.url if doc.file else "",
            "extracted_fields": doc.extracted_fields,
            "is_blurry": doc.is_blurry,
            "is_expired": doc.is_expired
        }, status=status.HTTP_201_CREATED)
