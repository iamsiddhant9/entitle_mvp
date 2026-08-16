from django.db import models


class Scheme(models.Model):
    """
    A government welfare scheme. `rules_json` holds the deterministic
    eligibility definition ({code, near_miss_threshold, conditions}) consumed
    by apps.eligibility.services.rule_engine — schemes are data, not code.
    Seeded from docs/rules/*.json via `manage.py seed_schemes`.
    """

    code = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=200)
    domain = models.CharField(max_length=64, blank=True, default="")
    description = models.TextField(blank=True, default="")
    benefit = models.CharField(max_length=255, blank=True, default="")
    rules_json = models.JSONField(default=dict)
    required_documents_json = models.JSONField(default=list, blank=True)
    source_url = models.URLField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name
