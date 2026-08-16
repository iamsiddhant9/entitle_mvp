from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from entitle.errors import error_response

from .models import Scheme
from .serializers import SchemeDetailSerializer, SchemeListSerializer


class SchemeListView(APIView):
    """GET /api/schemes/ — all active schemes."""

    def get(self, request):
        schemes = Scheme.objects.filter(is_active=True)
        return Response(SchemeListSerializer(schemes, many=True).data)


class SchemeDetailView(APIView):
    """GET /api/schemes/{code}/ — full scheme details including rules."""

    def get(self, request, code):
        scheme = Scheme.objects.filter(code=code, is_active=True).first()
        if scheme is None:
            return error_response("SCHEME_NOT_FOUND", "No scheme with code '{}'.".format(code), status.HTTP_404_NOT_FOUND)
        return Response(SchemeDetailSerializer(scheme).data)
