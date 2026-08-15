import uuid
from django.db import models

class CitizenProfile(models.Model):
    citizen_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    age = models.IntegerField(null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    occupation = models.CharField(max_length=50, null=True, blank=True)
    income = models.IntegerField(null=True, blank=True)
    land_owned = models.BooleanField(null=True, blank=True)
    disability = models.BooleanField(null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    caste = models.CharField(max_length=20, null=True, blank=True)
    has_bank_account = models.BooleanField(null=True, blank=True)
    girl_child_age = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"CitizenProfile({self.citizen_id})"

    def to_rule_dict(self):
        """Converts profile to dictionary for rule engine evaluation."""
        return {
            "age": self.age,
            "state": self.state,
            "occupation": self.occupation,
            "income": self.income,
            "land_owned": self.land_owned,
            "disability": self.disability,
            "gender": self.gender,
            "caste": self.caste,
            "has_bank_account": self.has_bank_account,
            "girl_child_age": self.girl_child_age,
        }
