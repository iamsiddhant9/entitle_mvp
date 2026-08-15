from django.contrib import admin
from .models import EligibilityResult

@admin.register(EligibilityResult)
class EligibilityResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'citizen', 'scheme', 'status', 'created_at')
    search_fields = ('citizen__citizen_id', 'scheme__code', 'scheme__name')
    list_filter = ('status', 'scheme')
