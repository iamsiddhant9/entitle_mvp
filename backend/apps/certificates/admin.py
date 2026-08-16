from django.contrib import admin

from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ["id", "eligibility_result", "eligibility_hash", "chain_status", "issued_at"]
    list_filter = ["chain_status"]
    search_fields = ["eligibility_hash", "tx_hash"]
