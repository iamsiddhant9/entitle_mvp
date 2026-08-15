from rest_framework import serializers
from .models import Certificate

class CertificateSerializer(serializers.ModelSerializer):
    certificate_id = serializers.IntegerField(source='id', read_only=True)
    eligibility_result_id = serializers.IntegerField(source='eligibility_result.id', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id',
            'certificate_id',
            'eligibility_result_id',
            'eligibility_hash',
            'tx_hash',
            'explorer_url',
            'qr_payload',
            'issued_at'
        ]
        read_only_fields = ['id', 'certificate_id', 'eligibility_hash', 'tx_hash', 'explorer_url', 'qr_payload', 'issued_at']
