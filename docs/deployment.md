# ENTITLE — Deployment Preparation

**Status: NOT READY TO DEPLOY.** This document records what exists, what is missing, and what is
unsafe. Nothing in the runtime configuration was changed while writing it — every item below is a
finding, not a fix.

---

## Blockers — deployment cannot succeed until these are resolved

| # | Blocker | Evidence |
|---|---|---|
| 1 | **No `Dockerfile` for backend or frontend**, though `docker-compose.yml` builds both | `docker-compose.yml:19-20, 40-41` reference `./backend/Dockerfile` and `./frontend/Dockerfile`; neither file exists. Only `docker-compose up db -d` works. |
| 2 | **No PostgreSQL driver.** The Postgres path has never run | `psycopg2` / `psycopg` absent from `backend/requirements.txt` and from the venv. With a valid `DATABASE_URL` the app raises `ImproperlyConfigured: Error loading psycopg module` on first DB access. |
| 3 | **No production web server** | No `gunicorn` / `uvicorn` in `requirements.txt`. The only run command in the repo is `manage.py runserver` (`docker-compose.yml:23`), which must not be used in production. |
| 4 | **Uploaded documents are unreachable when `DEBUG=False`** | `backend/entitle/urls.py:18-19` serves `MEDIA_URL` only `if settings.DEBUG`. No whitenoise, no S3, no proxy config. The API still returns `/media/...` URLs (`apps/documents/serializers.py:41-44`) that will 404. |
| 5 | **No frontend exists** | `frontend/` contains 9 `.gitkeep` files and no source, no `package.json`. `README.md:157-175` and `:317-320` describe files and commands that do not exist. |
| 6 | **Uploaded media is not persisted** | `docker-compose.yml` declares a volume only for `postgres_data`. `MEDIA_ROOT` is container-local; uploads are lost on rebuild and cannot be shared across replicas. |

---

## Unsafe defaults — must be changed before any public deployment

These are **fail-open**: forgetting to set the variable produces an insecure but working system.

| Setting | Current | Risk |
|---|---|---|
| `DEBUG` | defaults to **`True`** (`settings.py:13`) | Full tracebacks and settings disclosure on any error. |
| `SECRET_KEY` | falls back to a value **committed to git** (`settings.py:11`) | Forgeable sessions and signed cookies. |
| `ALLOWED_HOSTS` | hard-coded `['*']` (`settings.py:15`), no env override | Host-header injection. `check --deploy` does not flag a wildcard, only an empty list. |
| `CORS_ALLOW_ALL_ORIGINS` + `CORS_ALLOW_CREDENTIALS` | both `True` (`settings.py:137-138`) | Any website can make credentialed cross-origin calls with a visiting citizen's session. `CORS_ALLOWED_ORIGINS` (`:139-142`) is dead code while this is on. |
| `DATABASE_URL` | silently falls back to SQLite (`settings.py:87, 94`) | A typo'd or unreachable URL yields a working-looking deploy that loses all data on restart. |
| `docker-compose.yml` | ships `DEBUG=True` + `runserver` + `restart: always` | Shaped like something that will be run on a server. |

`manage.py check --deploy` currently reports 6 warnings: `W004` (no HSTS), `W008` (no SSL redirect),
`W009` (insecure SECRET_KEY), `W012` (`SESSION_COOKIE_SECURE`), `W016` (`CSRF_COOKIE_SECURE`),
`W018` (DEBUG on).

Absent entirely: `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`,
`SECURE_HSTS_*`, `SECURE_PROXY_SSL_HEADER` (needed behind Railway/Render-style TLS proxies),
`CSRF_TRUSTED_ORIGINS`, `LOGGING`.

---

## Environment variables

`.env.example` and the code are **in sync** — every variable the backend reads is documented, and
nothing documented is unread. Never commit a real `.env` (it is gitignored).

### Backend — required

| Variable | Required | Notes |
|---|---|---|
| `SECRET_KEY` | **Yes** | Must be set. Do not rely on the committed fallback. |
| `DEBUG` | **Yes** | Set to `False`/`0` explicitly; the default is `True`. |
| `DATABASE_URL` | **Yes** | `postgres://` or `postgresql://` only. Without it the app silently uses SQLite. Blocked by the missing driver (blocker 2). |
| `GEMINI_API_KEY` | Optional | Without it, extraction reports `not_configured` and explanations use the deterministic fallback. Never commit it. |
| `GEMINI_MODEL` | Optional | Default `gemini-2.5-flash`. |
| `GEMINI_TIMEOUT_MS` | Optional | Default `30000`. |
| `POLYGON_AMOY_RPC_URL` | For certificates | Defaults to the public Amoy RPC. |
| `WALLET_PRIVATE_KEY` | For certificates | **Secret.** Without it, certificate issuance falls back to a locally computed pseudo tx hash. |
| `ELIGIBILITY_REGISTRY_ADDRESS` | For certificates | Missing from `docker-compose.yml`, so on-chain writes cannot work there. |
| `DOCUMENT_MAX_UPLOAD_BYTES` | Optional | Default 10 MiB. |
| `DOCUMENT_MAX_IMAGE_PIXELS` | Optional | Default 50 MP. |
| `DOCUMENT_BLUR_THRESHOLD` | Optional | Default 300. See `apps/documents/services/quality.py` for the calibration table. |

Not configurable today, but needed for production: `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`,
`CSRF_TRUSTED_ORIGINS`. Making these env-driven requires a code change.

### Frontend

`NEXT_PUBLIC_API_URL` is the only variable referenced (`docker-compose.yml:50`, `README.md:348`), and
both hard-code `http://localhost:8000`. There is no frontend to configure yet.

---

## Pre-deployment checklist

**Secrets and config**
- [ ] `SECRET_KEY` set to a fresh random value (not the committed default)
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS` restricted to real hostnames (**requires a code change**)
- [ ] CORS restricted to the real frontend origin, and `CORS_ALLOW_ALL_ORIGINS` turned off
- [ ] `GEMINI_API_KEY` supplied via the platform's secret store, never in git or logs
- [ ] `WALLET_PRIVATE_KEY` in a secret store; consider whether the deployment needs it at all

**Infrastructure**
- [ ] `backend/Dockerfile` written (blocker 1)
- [ ] `psycopg2-binary` added and the Postgres path actually exercised (blocker 2)
- [ ] `gunicorn`/`uvicorn` added and used as the entrypoint (blocker 3)
- [ ] Static files: `collectstatic` + whitenoise or a CDN
- [ ] Media: object storage or a persistent volume, **plus an access-control decision** (see below)
- [ ] Dependencies pinned or locked — `requirements.txt` uses `>=` floors, so builds are not reproducible

**Database**
- [ ] `DATABASE_URL` verified to actually connect (do not trust a successful boot — it may be SQLite)
- [ ] `manage.py migrate` in the release step
- [ ] `manage.py seed_schemes` run once. Note this **writes** `docs/rules/*.json`; on a read-only
      filesystem it will fail

**Verification after deploy**
- [ ] `manage.py check --deploy` clean, or every remaining warning consciously accepted
- [ ] Create a citizen → upload a document → confirm → evaluate → explain, end to end
- [ ] Confirm a `/media/` URL is not readable without authorisation

---

## Security items to resolve before handling real citizen data

1. **Uploaded documents have no access control.** `django.views.static.serve` performs no permission
   check, so anyone with (or guessing) a `/media/documents/<uuid>.<ext>` URL can read another
   citizen's Aadhaar card or income certificate. Filenames are unguessable UUIDs, but the URL is
   returned in API responses and is permanently valid. Needs signed URLs or an authenticated
   download view.
2. **IDOR on citizen profiles — highest severity open issue.**
   `GET/PATCH/PUT /api/citizens/{id}/profile/` accepts an enumerable integer primary key with no
   authentication (`apps/citizens/views.py:43-47`, `apps/citizens/urls.py:6`). Anyone can read **and
   overwrite** any citizen's income, caste, gender, disability and bank status — the exact inputs
   eligibility and the on-chain certificate are computed from. The identical hole was closed for
   document confirmation and for `/api/explain/`; this endpoint was left open and needs its own fix.
3. **No authentication anywhere.** No view sets `permission_classes`; DRF defaults to `AllowAny`.
   Ownership is proven by knowledge of the citizen UUID, which is reasonable for an MVP but is a
   bearer credential passed in request bodies and URLs.
4. **Manual `set_cookie('session_id', ...)`** (`apps/citizens/views.py:26`) sets no `secure` or
   `samesite` flag, and its fallback branch writes the citizen UUID credential into a cookie.
