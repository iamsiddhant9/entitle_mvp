from rest_framework import serializers
from .models import CitizenProfile

class CitizenProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CitizenProfile
        fields = [
            'id',
            'citizen_id',
            'age',
            'state',
            'occupation',
            'income',
            'land_owned',
            'disability',
            'gender',
            'caste',
            'has_bank_account',
            'girl_child_age',
            'updated_at',
            'created_at'
        ]
        read_only_fields = ['id', 'citizen_id', 'created_at', 'updated_at']

class CitizenCreateResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CitizenProfile
        fields = ['citizen_id']
