import os
import uuid

from django.db import models

from apps.citizens.models import CitizenProfile

from .services.expiry import EXPIRY_STATUS_CHOICES, STATUS_NOT_APPLICABLE
from .services.file_validation import ALLOWED_EXTENSIONS
from .services.groq_vision import (
    EXTRACTION_SOURCE_CHOICES,
    EXTRACTION_STATUS_CHOICES,
    SOURCE_NONE,
    STATUS_PENDING,
    STATUS_SUCCESS,
)
from .services.quality import QUALITY_STATUS_CHOICES, STATUS_UNKNOWN as QUALITY_UNKNOWN


def document_upload_path(instance, filename):
    """Generate the stored path for an uploaded document.

    The client-supplied filename is never reused: the name is a fresh UUID and the
    extension is drawn from an allowlist. This removes path-traversal risk and prevents an
    attacker-chosen extension (``.html``, ``.svg``) from being served back from MEDIA_URL.
    """
    extension = os.path.splitext(filename)[1].lower().lstrip(".")
    if extension not in ALLOWED_EXTENSIONS:
        extension = "bin"
    return f"documents/{uuid.uuid4().hex}.{extension}"


class Document(models.Model):
    """An uploaded citizen document and the provenance of everything read from it.

    ``extracted_fields`` is only ever populated by a successful extraction or by a human
    at confirmation time; a failed extraction leaves it empty and records why in
    ``extraction_status`` / ``extraction_error``.
    """

    citizen = models.ForeignKey(
        CitizenProfile,
        on_delete=models.CASCADE,
        related_name='documents',
        null=True,
        blank=True,
    )
    doc_type = models.CharField(max_length=100)
    file = models.FileField(upload_to=document_upload_path)
    extracted_fields = models.JSONField(default=dict)
    is_blurry = models.BooleanField(default=False)
    is_expired = models.BooleanField(default=False)
    confirmed = models.BooleanField(default=False)

    # --- Extraction provenance ---
    extraction_status = models.CharField(
        max_length=32, choices=EXTRACTION_STATUS_CHOICES, default=STATUS_PENDING
    )
    extraction_source = models.CharField(
        max_length=32, choices=EXTRACTION_SOURCE_CHOICES, default=SOURCE_NONE
    )
    extraction_model = models.CharField(max_length=64, blank=True, default='')
    #: Short, sanitised failure code. Never contains third-party message text.
    extraction_error = models.CharField(max_length=64, blank=True, default='')

    # --- Quality ---
    quality_status = models.CharField(
        max_length=32, choices=QUALITY_STATUS_CHOICES, default=QUALITY_UNKNOWN
    )
    #: Variance of the Laplacian, retained so a blur verdict is auditable.
    blur_score = models.FloatField(null=True, blank=True)

    # --- Expiry ---
    expiry_status = models.CharField(
        max_length=32, choices=EXPIRY_STATUS_CHOICES, default=STATUS_NOT_APPLICABLE
    )
    expiry_date = models.DateField(null=True, blank=True)

    # --- Confirmation / mapping audit ---
    confirmed_at = models.DateTimeField(null=True, blank=True)
    profile_mapping_json = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.doc_type} (#{self.id})"

    @property
    def extraction_succeeded(self) -> bool:
        return self.extraction_status == STATUS_SUCCESS
