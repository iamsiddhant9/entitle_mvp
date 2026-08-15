from rest_framework import serializers
from .models import Scheme

class SchemeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = ['id', 'code', 'name', 'description', 'ministry', 'source_url']

class SchemeDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = [
            'id',
            'code',
            'name',
            'description',
            'ministry',
            'rules_json',
            'required_documents_json',
            'source_url',
            'created_at',
            'updated_at'
        ]
