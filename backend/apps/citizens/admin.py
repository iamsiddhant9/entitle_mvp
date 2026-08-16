from django.contrib import admin

from .models import CitizenProfile


@admin.register(CitizenProfile)
class CitizenProfileAdmin(admin.ModelAdmin):
    list_display = ["citizen_id", "age", "state", "occupation", "income", "updated_at"]
    search_fields = ["citizen_id"]
