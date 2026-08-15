from django.db import models
from apps.citizens.models import CitizenProfile

class Document(models.Model):
    citizen = models.ForeignKey(CitizenProfile, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    doc_type = models.CharField(max_length=100)
    file = models.FileField(upload_to='documents/')
    extracted_fields = models.JSONField(default=dict)
    is_blurry = models.BooleanField(default=False)
    is_expired = models.BooleanField(default=False)
    confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.doc_type} (#{self.id})"
