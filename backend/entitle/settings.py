"""
Django settings for the ENTITLE backend.

Everything deployment-specific is read from environment variables so the same
codebase runs locally (SQLite fallback), in docker-compose (PostgreSQL) and on
Railway. See backend/.env.example for the full list of variables.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Load a local .env file if python-dotenv is installed (optional convenience).
try:
    from dotenv import load_dotenv

    load_dotenv(BASE_DIR / ".env")
except ImportError:
    pass


def env(name, default=None):
    """Read an env var, treating empty strings and 'your_*' placeholders as unset."""
    value = os.environ.get(name, "")
    if not value or value.startswith("your_"):
        return default
    return value


SECRET_KEY = env("SECRET_KEY", "django-insecure-entitle-dev-key")
DEBUG = env("DEBUG", "True").lower() in ("true", "1", "yes")
ALLOWED_HOSTS = [h.strip() for h in env("ALLOWED_HOSTS", "*").split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "apps.citizens",
    "apps.schemes",
    "apps.eligibility",
    "apps.explain",
    "apps.documents",
    "apps.certificates",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "entitle.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "entitle.wsgi.application"

# Database: DATABASE_URL (docker/production) with a SQLite fallback for quick
# local development without PostgreSQL.
DATABASE_URL = env("DATABASE_URL")
if DATABASE_URL:
    import dj_database_url

    DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=60)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    # Anonymous, session-cookie based citizen flow — no auth classes needed.
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "EXCEPTION_HANDLER": "entitle.errors.exception_handler",
    "UNAUTHENTICATED_USER": None,
}

CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in env("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]
CORS_ALLOW_CREDENTIALS = True

# --- ENTITLE-specific configuration -----------------------------------------

# Directory holding the per-scheme rule JSON files (docs/rules in the repo).
RULES_DIR = Path(env("RULES_DIR", str(BASE_DIR.parent / "docs" / "rules")))

# Gemini (AI explanations + document extraction). Unset => deterministic fallbacks.
GEMINI_API_KEY = env("GEMINI_API_KEY")
GEMINI_MODEL = env("GEMINI_MODEL", "gemini-2.5-flash")

# Polygon Amoy (certificate anchoring). Unset => simulated mode.
POLYGON_AMOY_RPC_URL = env("POLYGON_AMOY_RPC_URL", "https://rpc-amoy.polygon.technology")
WALLET_PRIVATE_KEY = env("WALLET_PRIVATE_KEY")
ELIGIBILITY_REGISTRY_ADDRESS = env("ELIGIBILITY_REGISTRY_ADDRESS")
POLYGON_CHAIN_ID = int(env("POLYGON_CHAIN_ID", "80002"))
EXPLORER_TX_BASE_URL = env("EXPLORER_TX_BASE_URL", "https://amoy.polygonscan.com/tx/")

# Base URL encoded into certificate QR codes (frontend verify page).
CERTIFICATE_VERIFY_BASE_URL = env("CERTIFICATE_VERIFY_BASE_URL", "http://localhost:3000/verify/")

# Upload limits for citizen documents.
MAX_DOCUMENT_UPLOAD_BYTES = int(env("MAX_DOCUMENT_UPLOAD_BYTES", str(8 * 1024 * 1024)))
