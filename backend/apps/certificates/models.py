from django.db import models


class Certificate(models.Model):
    """
    A tamper-evident eligibility certificate. `payload_json` is the exact
    data that was canonically hashed (see services/hashing.py), so anyone can
    recompute `eligibility_hash` and compare it with the on-chain record.
    No PII beyond the anonymous citizen UUID ever leaves the database.
    """

    CHAIN_STATUS_CHOICES = [
        ("simulated", "Simulated (blockchain not configured)"),
        ("submitted", "Submitted to Polygon Amoy"),
        ("failed", "Submission failed"),
    ]

    eligibility_result = models.ForeignKey(
        "eligibility.EligibilityResult", on_delete=models.CASCADE, related_name="certificates"
    )
    payload_json = models.JSONField(default=dict)
    eligibility_hash = models.CharField(max_length=66, db_index=True)
    tx_hash = models.CharField(max_length=66, blank=True, default="")
    chain_status = models.CharField(max_length=16, choices=CHAIN_STATUS_CHOICES, default="simulated")
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-issued_at"]

    def __str__(self):
        return "Certificate {} ({})".format(self.id, self.eligibility_hash[:10])
