from django.db import models


class Document(models.Model):
    """An uploaded citizen document plus the outcome of the OCR pipeline."""

    DOC_TYPE_CHOICES = [
        ("aadhaar_card", "Aadhaar card"),
        ("land_ownership_document", "Land ownership document"),
        ("income_certificate", "Income certificate"),
        ("bank_passbook", "Bank passbook"),
        ("ration_card", "Ration card"),
        ("birth_certificate", "Birth certificate"),
    ]

    citizen = models.ForeignKey("citizens.CitizenProfile", on_delete=models.CASCADE, related_name="documents")
    doc_type = models.CharField(max_length=40, choices=DOC_TYPE_CHOICES)
    file = models.FileField(upload_to="documents/%Y/%m/")
    extracted_fields = models.JSONField(default=dict, blank=True)
    is_blurry = models.BooleanField(default=False)
    blur_score = models.FloatField(null=True, blank=True)
    is_expired = models.BooleanField(default=False)
    confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return "{} ({})".format(self.doc_type, self.citizen_id)
