from django.db import models
from apps.citizens.models import CitizenProfile
from apps.schemes.models import Scheme

class EligibilityResult(models.Model):
    STATUS_CHOICES = [
        ('eligible', 'Eligible'),
        ('near_miss', 'Near Miss'),
        ('not_eligible', 'Not Eligible'),
    ]

    citizen = models.ForeignKey(CitizenProfile, on_delete=models.CASCADE, related_name='eligibility_results')
    scheme = models.ForeignKey(Scheme, on_delete=models.CASCADE, related_name='eligibility_results')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES)
    matched_rules = models.JSONField(default=list)
    missing_rules = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.citizen.citizen_id} - {self.scheme.code} ({self.status})"
