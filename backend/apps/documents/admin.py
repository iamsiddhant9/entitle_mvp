from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'doc_type', 'citizen', 'is_blurry', 'confirmed', 'created_at')
    search_fields = ('doc_type', 'citizen__citizen_id')
    list_filter = ('doc_type', 'is_blurry', 'confirmed')
