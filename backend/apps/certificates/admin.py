from django.contrib import admin
from .models import Certificate

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('id', 'eligibility_result', 'eligibility_hash', 'tx_hash', 'issued_at')
    search_fields = ('eligibility_hash', 'tx_hash', 'eligibility_result__citizen__citizen_id')
