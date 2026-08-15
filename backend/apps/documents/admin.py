from django.contrib import admin

from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'doc_type',
        'citizen',
        'extraction_status',
        'extraction_source',
        'quality_status',
        'expiry_status',
        'confirmed',
        'created_at',
    )
    search_fields = ('doc_type', 'citizen__citizen_id')
    list_filter = (
        'doc_type',
        'extraction_status',
        'extraction_source',
        'quality_status',
        'expiry_status',
        'confirmed',
        'is_blurry',
    )
    #: Avoids one extra query per row for the `citizen` column.
    list_select_related = ('citizen',)
    #: Derived by the pipeline — editing them by hand would break provenance.
    readonly_fields = (
        'extraction_status',
        'extraction_source',
        'extraction_model',
        'extraction_error',
        'quality_status',
        'blur_score',
        'expiry_status',
        'expiry_date',
        'is_blurry',
        'is_expired',
        'confirmed_at',
        'profile_mapping_json',
        'created_at',
        'updated_at',
    )
