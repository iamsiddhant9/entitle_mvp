from django.db import models
from apps.eligibility.models import EligibilityResult

class Certificate(models.Model):
    eligibility_result = models.OneToOneField(EligibilityResult, on_delete=models.CASCADE, related_name='certificate')
    eligibility_hash = models.CharField(max_length=66, db_index=True)
    tx_hash = models.CharField(max_length=66, blank=True, null=True)
    explorer_url = models.URLField(max_length=500, blank=True, null=True)
    qr_payload = models.TextField(blank=True, null=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-issued_at']

    def __str__(self):
        return f"Certificate #{self.id} for {self.eligibility_result}"
