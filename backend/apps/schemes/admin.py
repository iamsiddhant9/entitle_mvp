from django.contrib import admin

from .models import Scheme


@admin.register(Scheme)
class SchemeAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "domain", "is_active", "updated_at"]
    search_fields = ["code", "name"]
    list_filter = ["domain", "is_active"]
