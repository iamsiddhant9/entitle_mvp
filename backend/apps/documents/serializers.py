from rest_framework import serializers
from .models import Document

class DocumentUploadSerializer(serializers.ModelSerializer):
    document_id = serializers.IntegerField(source='id', read_only=True)
    file_ref = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'document_id',
            'doc_type',
            'file',
            'file_ref',
            'extracted_fields',
            'is_blurry',
            'is_expired',
            'confirmed',
            'created_at'
        ]
        read_only_fields = ['document_id', 'file_ref', 'is_blurry', 'is_expired', 'created_at']

    def get_file_ref(self, obj):
        if obj.file:
            return obj.file.url
        return None

class DocumentConfirmSerializer(serializers.Serializer):
    confirmed = serializers.BooleanField(default=True)
    extracted_fields = serializers.DictField(required=False)
