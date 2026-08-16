from django.contrib import admin

from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["id", "citizen", "doc_type", "is_blurry", "is_expired", "confirmed", "created_at"]
    list_filter = ["doc_type", "is_blurry", "confirmed"]
