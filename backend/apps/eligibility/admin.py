from django.contrib import admin

from .models import EligibilityResult


@admin.register(EligibilityResult)
class EligibilityResultAdmin(admin.ModelAdmin):
    list_display = ["citizen", "scheme", "status", "updated_at"]
    list_filter = ["status", "scheme"]
