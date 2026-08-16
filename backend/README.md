# ENTITLE Backend

Django 5 + DRF API. See [docs/api-contract.md](../docs/api-contract.md) for the endpoint contract.

## Quick start (local, SQLite — no Postgres/API keys needed)

```bash
cd backend
python -m venv venv
venv/Scripts/activate        # Windows (source venv/bin/activate on Unix)
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_schemes   # loads the 12 schemes from ../docs/rules
python manage.py runserver
```

API at http://localhost:8000. Without `DATABASE_URL` set, a local `db.sqlite3` is used.
On Python 3.9 pip resolves Django 4.2 LTS; on 3.10+ it resolves Django 5 — the code supports both.

## Docker

`docker compose up` from the repo root runs Postgres + backend (migrate + seed automatically) + frontend.

## Configuration

Copy `.env.example` to `.env`. Everything optional degrades gracefully:

| Unset variable | Behaviour |
|---|---|
| `GEMINI_API_KEY` | Deterministic template explanations (EN/HI) instead of Gemini; no document field extraction |
| `WALLET_PRIVATE_KEY` / `ELIGIBILITY_REGISTRY_ADDRESS` | Certificates issued in `simulated` chain mode |
| `DATABASE_URL` | SQLite fallback |

## Tests

```bash
python manage.py test apps
```

Covers the rule engine (operators, near-miss thresholds, determinism) and the full API flow (citizens → evaluate → explain → certificates → verify).

## Architecture notes

- **Rule engine** (`apps/eligibility/services/rule_engine.py`): pure Python, no Django imports, fail-closed on unknown operators/missing fields. AI never decides eligibility.
- **Gemini** (`apps/explain/services/gemini_client.py`): single integration point; every call has a deterministic fallback.
- **Hashing** (`apps/certificates/services/hashing.py`): canonical JSON (sorted keys, compact separators, UTF-8) → SHA-256. The certificate `payload` is returned by the API so anyone can recompute the hash.
- **Blockchain** (`apps/certificates/services/blockchain.py`): web3.py → Polygon Amoy `EligibilityRegistry`; only the 32-byte hash goes on-chain, zero PII.
