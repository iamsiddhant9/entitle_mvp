from django.db import models

class Scheme(models.Model):
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    ministry = models.CharField(max_length=255, blank=True, null=True)
    rules_json = models.JSONField(default=dict)
    required_documents_json = models.JSONField(default=list)
    source_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name} ({self.code})"
