from django.contrib import admin
from .models import Scheme

@admin.register(Scheme)
class SchemeAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'ministry', 'created_at')
    search_fields = ('code', 'name', 'ministry')
    list_filter = ('ministry',)
