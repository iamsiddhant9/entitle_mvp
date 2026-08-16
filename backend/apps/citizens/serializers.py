from rest_framework import serializers

from .models import CitizenProfile


class CitizenProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CitizenProfile
        fields = [
            "id",
            "citizen_id",
            "age",
            "gender",
            "state",
            "residence_area",
            "occupation",
            "income",
            "marital_status",
            "land_owned",
            "house_owned",
            "bank_account",
            "income_tax_payer",
            "disability",
            "has_daughter_under_10",
            "aadhaar_linked",
            "updated_at",
        ]
        read_only_fields = ["id", "citizen_id", "updated_at"]
