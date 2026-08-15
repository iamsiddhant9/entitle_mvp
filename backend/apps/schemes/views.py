from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from .models import Scheme
from .serializers import SchemeListSerializer, SchemeDetailSerializer

class SchemeListView(APIView):
    """
    GET /api/schemes/ - Lists all supported welfare schemes with their basic details.
    POST /api/schemes/ - Creates or saves scheme data.
    """
    def get(self, request, *args, **kwargs):
        schemes = Scheme.objects.all().order_by('id')
        serializer = SchemeListSerializer(schemes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        serializer = SchemeDetailSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SchemeDetailView(APIView):
    """
    GET /api/schemes/{code}/ - Retrieves full details of a specific scheme by code (or id).
    PUT /api/schemes/{code}/ - Updates scheme data.
    """
    def get_object(self, code):
        try:
            return Scheme.objects.get(code=code)
        except Scheme.DoesNotExist:
            try:
                pk_val = int(code)
                return Scheme.objects.get(id=pk_val)
            except (ValueError, Scheme.DoesNotExist):
                raise NotFound(detail=f"Scheme with code/id '{code}' not found.")

    def get(self, request, code, *args, **kwargs):
        scheme = self.get_object(code)
        serializer = SchemeDetailSerializer(scheme)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, code, *args, **kwargs):
        scheme = self.get_object(code)
        serializer = SchemeDetailSerializer(scheme, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
