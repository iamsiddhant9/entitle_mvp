"""
Load / refresh all scheme definitions from the JSON rule files in
settings.RULES_DIR (docs/rules in the repository).

    python manage.py seed_schemes

Idempotent: existing schemes are updated in place, matched by `code`.
"""
import json

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.schemes.models import Scheme

REQUIRED_KEYS = {"code", "name", "conditions"}


class Command(BaseCommand):
    help = "Seed the Scheme table from the JSON rule files in RULES_DIR."

    def handle(self, *args, **options):
        rules_dir = settings.RULES_DIR
        if not rules_dir.is_dir():
            raise CommandError("Rules directory not found: {}".format(rules_dir))

        files = sorted(rules_dir.glob("*.json"))
        if not files:
            raise CommandError("No .json rule files in {}".format(rules_dir))

        created, updated, skipped = 0, 0, 0
        for path in files:
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except (ValueError, OSError) as exc:
                self.stderr.write(self.style.WARNING("Skipping {}: {}".format(path.name, exc)))
                skipped += 1
                continue

            missing = REQUIRED_KEYS - set(data)
            if missing:
                self.stderr.write(
                    self.style.WARNING("Skipping {}: missing keys {}".format(path.name, sorted(missing)))
                )
                skipped += 1
                continue

            rules_json = {
                "code": data["code"],
                "near_miss_threshold": data.get("near_miss_threshold", 1),
                "conditions": data["conditions"],
            }
            _, was_created = Scheme.objects.update_or_create(
                code=data["code"],
                defaults={
                    "name": data["name"],
                    "domain": data.get("domain", ""),
                    "description": data.get("description", ""),
                    "benefit": data.get("benefit", ""),
                    "rules_json": rules_json,
                    "required_documents_json": data.get("required_documents", []),
                    "source_url": data.get("source_url", ""),
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Schemes seeded: {} created, {} updated, {} skipped.".format(created, updated, skipped)
            )
        )
