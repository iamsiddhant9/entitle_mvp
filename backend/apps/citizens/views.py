from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from entitle.errors import error_response

from .models import CitizenProfile
from .serializers import CitizenProfileSerializer


def get_citizen_or_none(citizen_id):
    return CitizenProfile.objects.filter(citizen_id=citizen_id).first()


class CitizenCreateView(APIView):
    """POST /api/citizens/ — start an anonymous citizen session."""

    def post(self, request):
        citizen = CitizenProfile.objects.create()
        response = Response({"citizen_id": str(citizen.citizen_id)}, status=status.HTTP_201_CREATED)
        # Convenience cookie; the frontend also keeps citizen_id client-side.
        response.set_cookie(
            "citizen_id",
            str(citizen.citizen_id),
            max_age=60 * 60 * 24 * 30,
            samesite="Lax",
        )
        return response


class CitizenProfileView(APIView):
    """GET/PATCH /api/citizens/{citizen_id}/profile/"""

    def get(self, request, citizen_id):
        citizen = get_citizen_or_none(citizen_id)
        if citizen is None:
            return error_response("CITIZEN_NOT_FOUND", "No citizen session with this id.", status.HTTP_404_NOT_FOUND)
        return Response(CitizenProfileSerializer(citizen).data)

    def patch(self, request, citizen_id):
        citizen = get_citizen_or_none(citizen_id)
        if citizen is None:
            return error_response("CITIZEN_NOT_FOUND", "No citizen session with this id.", status.HTTP_404_NOT_FOUND)
        serializer = CitizenProfileSerializer(citizen, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
