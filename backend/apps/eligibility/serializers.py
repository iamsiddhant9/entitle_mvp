from rest_framework import serializers

from .models import EligibilityResult


class EligibilityResultSerializer(serializers.ModelSerializer):
    scheme_code = serializers.CharField(source="scheme.code", read_only=True)
    scheme_name = serializers.CharField(source="scheme.name", read_only=True)

    class Meta:
        model = EligibilityResult
        fields = [
            "id",
            "scheme_id",
            "scheme_code",
            "scheme_name",
            "status",
            "matched_rules",
            "missing_rules",
            "created_at",
        ]
