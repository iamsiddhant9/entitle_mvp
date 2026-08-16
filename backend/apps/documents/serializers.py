from rest_framework import serializers

from .models import Document


class DocumentUploadSerializer(serializers.ModelSerializer):
    """Response shape for document upload and document detail.

    The original contract fields (``document_id``, ``doc_type``, ``file_ref``,
    ``extracted_fields``, ``is_blurry``, ``is_expired``) are preserved; provenance and
    quality fields are additive.
    """

    document_id = serializers.IntegerField(source='id', read_only=True)
    file_ref = serializers.SerializerMethodField()
    blur_score = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'document_id',
            'doc_type',
            'file_ref',
            'extracted_fields',
            'is_blurry',
            'is_expired',
            'confirmed',
            'extraction_status',
            'extraction_source',
            'extraction_model',
            'extraction_error',
            'quality_status',
            'blur_score',
            'expiry_status',
            'expiry_date',
            'created_at',
        ]
        read_only_fields = fields

    def get_file_ref(self, obj):
        if obj.file:
            return obj.file.url
        return ""

    def get_blur_score(self, obj):
        if obj.blur_score is None:
            return None
        return round(obj.blur_score, 1)


class DocumentConfirmSerializer(serializers.Serializer):
    confirmed = serializers.BooleanField(default=True)
    extracted_fields = serializers.DictField(required=False)
    #: Proof of ownership when no citizen session cookie is present.
    citizen_id = serializers.CharField(required=False, allow_blank=True)

    def validate_confirmed(self, value):
        if value is not True:
            raise serializers.ValidationError(
                "Documents can only be confirmed, not un-confirmed. "
                "Upload a replacement document instead."
            )
        return value
