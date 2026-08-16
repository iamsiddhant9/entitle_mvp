import uuid

from django.db import models


class CitizenProfile(models.Model):
    """
    Anonymous citizen session profile. Every attribute is nullable: the
    assistant fills them in progressively and the rule engine treats missing
    values as unmet conditions.

    The field names here are the vocabulary used by the rule files in
    docs/rules/*.json — adding a new profile attribute means adding a field
    here (and a question in the frontend assistant).
    """

    GENDER_CHOICES = [("female", "Female"), ("male", "Male"), ("other", "Other")]
    RESIDENCE_CHOICES = [("rural", "Rural"), ("urban", "Urban")]
    MARITAL_CHOICES = [
        ("single", "Single"),
        ("married", "Married"),
        ("widowed", "Widowed"),
        ("divorced", "Divorced"),
    ]
    OCCUPATION_CHOICES = [
        ("farmer", "Farmer"),
        ("student", "Student"),
        ("artisan", "Artisan / craftsperson"),
        ("self_employed", "Self-employed"),
        ("small_business", "Small business owner"),
        ("salaried", "Salaried employee"),
        ("unorganized_worker", "Unorganised sector worker"),
        ("daily_wage", "Daily wage worker"),
        ("unemployed", "Unemployed"),
        ("other", "Other"),
    ]

    citizen_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)

    age = models.PositiveSmallIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    state = models.CharField(max_length=64, null=True, blank=True)
    residence_area = models.CharField(max_length=10, choices=RESIDENCE_CHOICES, null=True, blank=True)
    occupation = models.CharField(max_length=32, choices=OCCUPATION_CHOICES, null=True, blank=True)
    income = models.PositiveBigIntegerField(null=True, blank=True, help_text="Annual family income in ₹")
    marital_status = models.CharField(max_length=10, choices=MARITAL_CHOICES, null=True, blank=True)

    land_owned = models.BooleanField(null=True, blank=True)
    house_owned = models.BooleanField(null=True, blank=True, help_text="Owns a pucca house")
    bank_account = models.BooleanField(null=True, blank=True)
    income_tax_payer = models.BooleanField(null=True, blank=True)
    disability = models.BooleanField(null=True, blank=True)
    has_daughter_under_10 = models.BooleanField(null=True, blank=True)
    aadhaar_linked = models.BooleanField(null=True, blank=True, help_text="Aadhaar linked to mobile number")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Fields fed into the rule engine, in questionnaire order.
    RULE_FIELDS = [
        "age",
        "gender",
        "state",
        "residence_area",
        "occupation",
        "income",
        "marital_status",
        "land_owned",
        "house_owned",
        "bank_account",
        "income_tax_payer",
        "disability",
        "has_daughter_under_10",
        "aadhaar_linked",
    ]

    def as_rule_input(self):
        """Plain dict consumed by the deterministic rule engine."""
        return {field: getattr(self, field) for field in self.RULE_FIELDS}

    def __str__(self):
        return "Citizen {}".format(self.citizen_id)
