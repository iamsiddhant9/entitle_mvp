import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django.shortcuts import get_object_or_404
from .models import CitizenProfile
from .serializers import CitizenProfileSerializer, CitizenCreateResponseSerializer

class CitizenCreateView(APIView):
    """
    POST /api/citizens/
    Creates a new anonymous citizen session and returns citizen_id.
    """
    def post(self, request, *args, **kwargs):
        profile = CitizenProfile.objects.create()
        response_data = {
            "citizen_id": str(profile.citizen_id)
        }
        response = Response(response_data, status=status.HTTP_201_CREATED)
        # Also set session cookie if session engine is active
        if not request.session.session_key:
            request.session.create()
        request.session['citizen_id'] = str(profile.citizen_id)
        response.set_cookie('session_id', request.session.session_key or str(profile.citizen_id), httponly=True)
        return response

class CitizenProfileDetailView(APIView):
    """
    GET /api/citizens/{id}/profile/
    PATCH /api/citizens/{id}/profile/
    Allows lookup by citizen_id (UUID string) or integer primary key ID.
    """
    def get_object(self, identifier):
        try:
            # Check if identifier is valid UUID
            val = uuid.UUID(str(identifier))
            try:
                return CitizenProfile.objects.get(citizen_id=val)
            except CitizenProfile.DoesNotExist:
                raise NotFound(detail=f"Citizen with ID '{identifier}' does not exist.")
        except ValueError:
            # Fallback to integer primary key
            try:
                pk_val = int(identifier)
                return CitizenProfile.objects.get(id=pk_val)
            except (ValueError, CitizenProfile.DoesNotExist):
                raise NotFound(detail=f"Citizen with ID '{identifier}' does not exist.")

    def get(self, request, identifier, *args, **kwargs):
        profile = self.get_object(identifier)
        serializer = CitizenProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, identifier, *args, **kwargs):
        profile = self.get_object(identifier)
        serializer = CitizenProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, identifier, *args, **kwargs):
        profile = self.get_object(identifier)
        serializer = CitizenProfileSerializer(profile, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
