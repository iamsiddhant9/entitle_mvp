from django.db import models


class EligibilityResult(models.Model):
    """
    Outcome of evaluating one citizen against one scheme. Re-evaluation
    updates the row in place (one result per citizen+scheme pair); the cached
    AI explanation is cleared whenever the underlying decision changes.
    """

    STATUS_CHOICES = [
        ("eligible", "Eligible"),
        ("near_miss", "Near miss"),
        ("not_eligible", "Not eligible"),
    ]

    citizen = models.ForeignKey("citizens.CitizenProfile", on_delete=models.CASCADE, related_name="results")
    scheme = models.ForeignKey("schemes.Scheme", on_delete=models.CASCADE, related_name="results")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES)
    matched_rules = models.JSONField(default=list, blank=True)
    missing_rules = models.JSONField(default=list, blank=True)
    explanation = models.TextField(blank=True, default="")
    explanation_language = models.CharField(max_length=8, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("citizen", "scheme")]
        ordering = ["scheme_id"]

    def __str__(self):
        return "{} → {}: {}".format(self.citizen_id, self.scheme_id, self.status)
