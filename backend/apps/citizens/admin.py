from django.contrib import admin
from .models import CitizenProfile

@admin.register(CitizenProfile)
class CitizenProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'citizen_id', 'state', 'occupation', 'income', 'created_at')
    search_fields = ('citizen_id', 'state', 'occupation')
    list_filter = ('occupation', 'state', 'gender', 'caste')
