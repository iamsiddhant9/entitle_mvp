import os
from pathlib import Path
from urllib.parse import urlparse
import dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file if present
dotenv.load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-entitle-mvp-secret-key-2026')

DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'corsheaders',
    'rest_framework',
    
    # ENTITLE local apps
    'apps.citizens',
    'apps.schemes',
    'apps.eligibility',
    'apps.explain',
    'apps.documents',
    'apps.certificates',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'entitle.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'entitle.wsgi.application'
ASGI_APPLICATION = 'entitle.asgi.application'

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL and DATABASE_URL.startswith(('postgres://', 'postgresql://')):
    try:
        url = urlparse(DATABASE_URL)
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': url.path[1:],
                'USER': url.username,
                'PASSWORD': url.password,
                'HOST': url.hostname,
                'PORT': url.port or 5432,
            }
        }
    except Exception:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'EXCEPTION_HANDLER': 'entitle.exceptions.custom_exception_handler',
}

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# API Keys and Services Configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
POLYGON_AMOY_RPC_URL = os.environ.get('POLYGON_AMOY_RPC_URL', 'https://rpc-amoy.polygon.technology')
WALLET_PRIVATE_KEY = os.environ.get('WALLET_PRIVATE_KEY', '')
ELIGIBILITY_REGISTRY_ADDRESS = os.environ.get('ELIGIBILITY_REGISTRY_ADDRESS', '')

# Gemini model configuration (shared by document extraction).
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash')
GEMINI_TIMEOUT_MS = int(os.environ.get('GEMINI_TIMEOUT_MS', '30000'))

# Document upload / OCR pipeline limits.
#   MAX_UPLOAD_BYTES  - 10 MiB: fits a high-resolution phone photo of a certificate
#                       while bounding per-request memory use.
#   MAX_IMAGE_PIXELS  - 50 MP: decompression-bomb guard, checked from the image header
#                       before any pixel data is decoded.
#   BLUR_THRESHOLD    - variance of the Laplacian below which a document is treated as
#                       unreadable. Calibrated in apps/documents/services/quality.py;
#                       sharp documents measure 50,000+, heavy blur under 600.
DOCUMENT_MAX_UPLOAD_BYTES = int(os.environ.get('DOCUMENT_MAX_UPLOAD_BYTES', 10 * 1024 * 1024))
DOCUMENT_MAX_IMAGE_PIXELS = int(os.environ.get('DOCUMENT_MAX_IMAGE_PIXELS', 50_000_000))
DOCUMENT_BLUR_THRESHOLD = float(os.environ.get('DOCUMENT_BLUR_THRESHOLD', '300'))
DOCUMENT_ALLOWED_IMAGE_FORMATS = ('JPEG', 'PNG', 'WEBP')

# DigiLocker Configuration
DIGILOCKER_CLIENT_ID = os.environ.get('DIGILOCKER_CLIENT_ID', '')
DIGILOCKER_CLIENT_SECRET = os.environ.get('DIGILOCKER_CLIENT_SECRET', '')
DIGILOCKER_REDIRECT_URI = os.environ.get('DIGILOCKER_REDIRECT_URI', 'http://localhost:8000/api/documents/digilocker/callback/')
DIGILOCKER_BASE_URL = os.environ.get('DIGILOCKER_BASE_URL', 'https://api.digitallocker.gov.in/public/oauth2/1')

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# NOTE: LocMemCache is per-process. The DigiLocker OAuth token is cached here between the
# callback and the fetch call, so with more than one worker process those two requests can
# land on different workers and the token will appear to be missing. Fine for local dev;
# use a shared cache (Redis/Memcached) before running multiple workers.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}
