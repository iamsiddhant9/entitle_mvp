import json
import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.schemes.models import Scheme

SCHEMES_DATA = [
    {
        "code": "pm_kisan",
        "name": "PM Kisan Samman Nidhi",
        "description": "Financial benefit of Rs. 6000/- per year in three equal installments to all landholding farmer families.",
        "ministry": "Agriculture & Farmers Welfare",
        "rules_json": {
            "code": "pm_kisan",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "occupation", "op": "eq", "value": "farmer"},
                {"field": "land_owned", "op": "eq", "value": True},
                {"field": "income", "op": "lte", "value": 200000}
            ]
        },
        "required_documents_json": [
            "land_ownership_document",
            "aadhaar_card"
        ],
        "source_url": "https://pmkisan.gov.in/"
    },
    {
        "code": "pmay_g",
        "name": "PMAY-G (Gramin)",
        "description": "Financial assistance for construction of pucca house with basic amenities to all houseless households and households living in kutcha and dilapidated houses.",
        "ministry": "Housing & Rural Development",
        "rules_json": {
            "code": "pmay_g",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "income", "op": "lte", "value": 300000},
                {"field": "land_owned", "op": "eq", "value": False}
            ]
        },
        "required_documents_json": [
            "income_certificate",
            "aadhaar_card",
            "bpl_ration_card"
        ],
        "source_url": "https://pmayg.nic.in/"
    },
    {
        "code": "pmjay",
        "name": "Ayushman Bharat (PMJAY)",
        "description": "Health cover of Rs. 5 lakhs per family per year for secondary and tertiary care hospitalization to poor and vulnerable families.",
        "ministry": "Health and Family Welfare",
        "rules_json": {
            "code": "pmjay",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "income", "op": "lte", "value": 500000}
            ]
        },
        "required_documents_json": [
            "ration_card",
            "aadhaar_card"
        ],
        "source_url": "https://pmjay.gov.in/"
    },
    {
        "code": "pm_scholarship",
        "name": "PM National Scholarship",
        "description": "Financial support for post-matric higher education for eligible students belonging to lower income backgrounds.",
        "ministry": "Education",
        "rules_json": {
            "code": "pm_scholarship",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "occupation", "op": "eq", "value": "student"},
                {"field": "income", "op": "lte", "value": 450000}
            ]
        },
        "required_documents_json": [
            "student_id",
            "mark_sheet",
            "income_certificate",
            "aadhaar_card"
        ],
        "source_url": "https://scholarships.gov.in/"
    },
    {
        "code": "pm_vishwakarma",
        "name": "PM Vishwakarma Yojana",
        "description": "End-to-end support for traditional artisans and craftspeople including collateral-free credit, skill training, and toolkit incentives.",
        "ministry": "Micro, Small and Medium Enterprises",
        "rules_json": {
            "code": "pm_vishwakarma",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "occupation", "op": "eq", "value": "artisan"},
                {"field": "income", "op": "lte", "value": 300000}
            ]
        },
        "required_documents_json": [
            "trade_certificate",
            "aadhaar_card",
            "bank_passbook"
        ],
        "source_url": "https://pmvishwakarma.gov.in/"
    },
    {
        "code": "pm_mudra",
        "name": "PM Mudra Yojana",
        "description": "Loans up to Rs. 10 Lakhs to non-corporate, non-farm small/micro enterprises for income-generating activities.",
        "ministry": "Finance",
        "rules_json": {
            "code": "pm_mudra",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "occupation", "op": "in", "value": ["self_employed", "worker", "artisan"]},
                {"field": "income", "op": "lte", "value": 1000000}
            ]
        },
        "required_documents_json": [
            "business_proposal",
            "aadhaar_card",
            "pan_card"
        ],
        "source_url": "https://www.mudra.org.in/"
    },
    {
        "code": "atal_pension",
        "name": "Atal Pension Yojana",
        "description": "Guaranteed monthly pension ranging from Rs. 1,000 to Rs. 5,000 per month from the age of 60 years for unorganised sector workers.",
        "ministry": "Finance",
        "rules_json": {
            "code": "atal_pension",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "age", "op": "gte", "value": 18},
                {"field": "age", "op": "lte", "value": 40},
                {"field": "has_bank_account", "op": "eq", "value": True}
            ]
        },
        "required_documents_json": [
            "bank_passbook",
            "aadhaar_card"
        ],
        "source_url": "https://www.npscra.nsdl.co.in/scheme-details.php"
    },
    {
        "code": "pm_jeevan_jyoti",
        "name": "PM Jeevan Jyoti Bima",
        "description": "Life insurance cover of Rs. 2 Lakh in case of death due to any reason to all savings bank account holders.",
        "ministry": "Finance",
        "rules_json": {
            "code": "pm_jeevan_jyoti",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "age", "op": "gte", "value": 18},
                {"field": "age", "op": "lte", "value": 50},
                {"field": "has_bank_account", "op": "eq", "value": True}
            ]
        },
        "required_documents_json": [
            "bank_passbook",
            "aadhaar_card"
        ],
        "source_url": "https://financialservices.gov.in/beta/en/pmjjby"
    },
    {
        "code": "pmkvy",
        "name": "PM Kaushal Vikas Yojana",
        "description": "Skill certification scheme enabling Indian youth to take up industry-relevant skill training for better livelihood.",
        "ministry": "Skill Development & Entrepreneurship",
        "rules_json": {
            "code": "pmkvy",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "age", "op": "gte", "value": 15},
                {"field": "age", "op": "lte", "value": 45},
                {"field": "occupation", "op": "in", "value": ["unemployed", "worker", "student"]}
            ]
        },
        "required_documents_json": [
            "aadhaar_card",
            "school_leaving_certificate"
        ],
        "source_url": "https://www.pmkvyofficial.org/"
    },
    {
        "code": "eshram",
        "name": "eShram",
        "description": "National database and social security benefits identification for unorganised workers across India.",
        "ministry": "Labour and Employment",
        "rules_json": {
            "code": "eshram",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "age", "op": "gte", "value": 16},
                {"field": "age", "op": "lte", "value": 59},
                {"field": "occupation", "op": "in", "value": ["worker", "artisan", "farmer", "self_employed", "unemployed"]}
            ]
        },
        "required_documents_json": [
            "aadhaar_card",
            "bank_passbook"
        ],
        "source_url": "https://eshram.gov.in/"
    },
    {
        "code": "sukanya_samriddhi",
        "name": "Sukanya Samriddhi Yojana",
        "description": "Small deposit savings scheme for girl child with high interest rate and tax benefits for higher education and marriage expenses.",
        "ministry": "Finance",
        "rules_json": {
            "code": "sukanya_samriddhi",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "girl_child_age", "op": "lte", "value": 10},
                {"field": "girl_child_age", "op": "gte", "value": 0},
                {"field": "has_bank_account", "op": "eq", "value": True}
            ]
        },
        "required_documents_json": [
            "birth_certificate",
            "parent_aadhaar",
            "bank_passbook"
        ],
        "source_url": "https://www.indiapost.gov.in/Financial/Pages/Content/Sukanya-Samriddhi-Account.aspx"
    },
    {
        "code": "ladli_behna_mp",
        "name": "Ladli Behna Yojana (MP)",
        "description": "Direct monthly financial assistance of Rs. 1250/- to eligible women in Madhya Pradesh to foster financial independence.",
        "ministry": "Women & Child Development (MP State)",
        "rules_json": {
            "code": "ladli_behna_mp",
            "near_miss_threshold": 1,
            "conditions": [
                {"field": "gender", "op": "eq", "value": "female"},
                {"field": "state", "op": "eq", "value": "Madhya Pradesh"},
                {"field": "age", "op": "gte", "value": 21},
                {"field": "age", "op": "lte", "value": 60},
                {"field": "income", "op": "lte", "value": 250000}
            ]
        },
        "required_documents_json": [
            "samagra_id",
            "domicile_certificate",
            "aadhaar_card",
            "bank_passbook"
        ],
        "source_url": "https://cmladlibahna.mp.gov.in/"
    }
]

class Command(BaseCommand):
    help = "Seeds the database with all 12 Indian government welfare schemes and exports rules to docs/rules/"

    def handle(self, *args, **options):
        rules_dir = Path(settings.BASE_DIR).parent / "docs" / "rules"
        rules_dir.mkdir(parents=True, exist_ok=True)

        created_count = 0
        updated_count = 0

        for data in SCHEMES_DATA:
            scheme, created = Scheme.objects.update_or_create(
                code=data["code"],
                defaults={
                    "name": data["name"],
                    "description": data["description"],
                    "ministry": data["ministry"],
                    "rules_json": data["rules_json"],
                    "required_documents_json": data["required_documents_json"],
                    "source_url": data["source_url"]
                }
            )

            # Export rule json to docs/rules/<code-slug>.json
            file_name = f"{data['code'].replace('_', '-')}.json"
            rule_path = rules_dir / file_name
            with open(rule_path, "w", encoding="utf-8") as f:
                json.dump(data["rules_json"], f, indent=2)

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded schemes! ({created_count} created, {updated_count} updated). Rule files synced to docs/rules/."
            )
        )
