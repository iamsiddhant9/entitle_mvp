from rest_framework import serializers

from .models import Scheme


class SchemeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = ["id", "code", "name", "domain", "description", "benefit", "source_url"]


class SchemeDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = [
            "id",
            "code",
            "name",
            "domain",
            "description",
            "benefit",
            "rules_json",
            "required_documents_json",
            "source_url",
        ]
