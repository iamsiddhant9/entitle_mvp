<div align="center">

# 🇮🇳 ENTITLE
### AI-Powered Government Entitlement Platform

*Bridging the gap between 1.4 billion citizens and India's welfare ecosystem*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![Polygon](https://img.shields.io/badge/Blockchain-Polygon%20Amoy-purple.svg)](https://polygon.technology)
[![Gemini](https://img.shields.io/badge/AI-Gemini%20API-orange.svg)](https://ai.google.dev)

</div>

---

## 🌟 What is ENTITLE?

Over **₹2 lakh crore** in Indian government welfare benefits go unclaimed every year — not because citizens don't qualify, but because they don't **know** they qualify, can't navigate complex eligibility rules, and have no way to **prove** their entitlement.

**ENTITLE** is an AI-powered layer between citizens and Indian government welfare schemes. It tells citizens exactly which schemes they are eligible for, explains *why* in plain language, and generates a **blockchain-verified tamper-proof eligibility certificate** — all in under 60 seconds.

> ENTITLE does **NOT** replace government portals. It is an intelligent access layer on top of them.

---

## 🏗️ Core Architecture — Three Pillars

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ENTITLE SYSTEM                             │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  RULE ENGINE │    │  AI EXPLAINS │    │  BLOCKCHAIN VERIFIES │  │
│  │              │    │              │    │                      │  │
│  │ Deterministic│───▶│ Gemini tells │───▶│ Polygon Amoy stores  │  │
│  │ Python rules │    │ you WHY in   │    │ a tamper-proof hash  │  │
│  │ evaluate all │    │ plain Hindi/ │    │ of your eligibility  │  │
│  │ 12 schemes   │    │ English      │    │ result. Zero PII.    │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│    Siddhant              Riya / Neeti           Siddhant            │
└─────────────────────────────────────────────────────────────────────┘
```

| Pillar | What it does | Why it matters |
|--------|-------------|----------------|
| **Rule Engine Decides** | Pure Python deterministic evaluation — no AI guessing eligibility | Auditable, reproducible, legally defensible |
| **AI Explains** | Gemini translates complex policy into plain language | Accessible to low-literacy/rural users |
| **Blockchain Verifies** | SHA-256 hash of the result, stored on-chain (zero PII) | Prevents corruption, enables offline verification |

---

## 🎯 Target Schemes (12 Total)

| # | Scheme | Ministry | Key Eligibility |
|---|--------|----------|-----------------|
| 1 | **PM Kisan Samman Nidhi** | Agriculture | Farmer, land owned, income ≤ 2L |
| 2 | **PMAY-G (Gramin)** | Housing | Rural, no pucca house, income ≤ 3L |
| 3 | **Ayushman Bharat (PMJAY)** | Health | Income ≤ 5L, not govt. employee |
| 4 | **PM National Scholarship** | Education | Student, income ≤ 4.5L, >50% marks |
| 5 | **PM Vishwakarma Yojana** | MSME | Artisan/craftsman, traditional work |
| 6 | **PM Mudra Yojana** | Finance | Small business, income ≤ 10L |
| 7 | **Atal Pension Yojana** | Finance | Age 18-40, unorganised sector |
| 8 | **PM Jeevan Jyoti Bima** | Finance | Age 18-50, bank account |
| 9 | **PM Kaushal Vikas Yojana** | Skill Dev | Age 15-45, unemployed/school dropout |
| 10 | **eShram** | Labour | Unorganised worker, age 16-59 |
| 11 | **Sukanya Samriddhi Yojana** | Finance | Girl child < 10 years |
| 12 | **Ladli Behna Yojana (MP)** | State (MP) | Woman, MP resident, age 21-60, income ≤ 2.5L |

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 14 (App Router, TypeScript) | SSR, file-based routing, strong ecosystem |
| **UI** | Tailwind CSS + shadcn/ui | Rapid premium UI with composable components |
| **Backend** | Django 5 + DRF | Battle-tested Python API framework |
| **Database** | PostgreSQL 15 | Relational, ACID-compliant, JSON field support |
| **AI** | Google Gemini API (Text + Vision) | Explainability + OCR document extraction |
| **Blockchain** | Polygon Amoy (Solidity + web3.py) | Low-fee testnet, production-equivalent smart contracts |
| **Infra** | Docker Compose (local) / Vercel + Railway (prod) | Zero-friction local dev, scalable cloud deployment |

---

## 📁 Repository Structure

```
entitle_mvp/
│
├── 📂 backend/                   ← Django REST API
│   ├── entitle/                  ← Project settings, URLs, WSGI/ASGI
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   └── apps/
│       ├── 🔐 citizens/          ← Citizen profile models & session management
│       │   ├── models.py         (CitizenProfile model)
│       │   ├── serializers.py
│       │   ├── views.py          (POST /api/citizens/, PATCH /api/citizens/{id}/profile/)
│       │   └── urls.py
│       │
│       ├── 📋 schemes/           ← Scheme definitions and seeder
│       │   ├── models.py         (Scheme model with rules_json field)
│       │   ├── management/
│       │   │   └── commands/
│       │   │       └── seed_schemes.py   ← Run this to load all 12 schemes
│       │   ├── views.py          (GET /api/schemes/, GET /api/schemes/{code}/)
│       │   └── urls.py
│       │
│       ├── ⚖️  eligibility/      ← [SIDDHANT] Rule engine and evaluation API
│       │   ├── models.py         (EligibilityResult model)
│       │   ├── views.py          (POST /api/eligibility/evaluate/)
│       │   ├── urls.py
│       │   ├── services/
│       │   │   └── rule_engine.py  ← Core deterministic logic (SIDDHANT)
│       │   └── tests/
│       │       └── test_rule_engine.py
│       │
│       ├── 💬 explain/           ← [RIYA/NEETI] Gemini explainability integration
│       │   ├── views.py          (POST /api/explain/, POST /api/knowledge/ask/)
│       │   ├── services/
│       │   │   └── gemini_client.py
│       │   └── urls.py
│       │
│       ├── 📄 documents/         ← [RIYA/NEETI] OCR + document upload pipeline
│       │   ├── models.py         (Document model)
│       │   ├── views.py          (POST /api/documents/upload/, GET /api/documents/missing/)
│       │   ├── services/
│       │   │   └── ocr.py        ← Blur detection + Gemini Vision extraction
│       │   └── urls.py
│       │
│       └── 🏆 certificates/      ← [SIDDHANT] Blockchain hashing & issuance
│           ├── models.py         (Certificate model)
│           ├── views.py          (POST /api/certificates/issue/, GET /api/certificates/{id}/)
│           ├── services/
│           │   ├── hashing.py    ← SHA-256 canonical hash generation (SIDDHANT)
│           │   └── blockchain.py ← web3.py → Polygon Amoy transaction sender (SIDDHANT)
│           └── urls.py
│
├── 📂 contracts/                 ← [SIDDHANT] Solidity Smart Contracts
│   ├── EligibilityRegistry.sol   ← storeHash() and verify() contract
│   ├── hardhat.config.js
│   └── scripts/
│       └── deploy.js             ← Hardhat deployment script
│
├── 📂 frontend/                  ← [SANVI] Next.js App
│   ├── app/
│   │   ├── page.tsx              ← Landing page
│   │   ├── assistant/page.tsx    ← Eligibility questionnaire flow
│   │   ├── dashboard/page.tsx    ← Results dashboard (eligible/near-miss/not-eligible)
│   │   └── certificate/page.tsx  ← Certificate viewer + QR code
│   │
│   ├── components/
│   │   ├── landing/              ← Hero, stats, how-it-works sections
│   │   ├── assistant/            ← Animated step-by-step question cards
│   │   ├── dashboard/            ← Scheme result cards with status badges
│   │   ├── certificate/          ← Printable certificate with QR
│   │   └── shared/               ← Navbar, Footer, LoadingSpinner, etc.
│   │
│   ├── lib/
│   │   └── api.ts                ← Typed fetch wrappers for all backend endpoints
│   │
│   └── context/
│       └── CitizenProfileContext.tsx ← Global citizen profile state
│
├── 📂 docs/                      ← Documentation
│   ├── api-contract.md           ← Full REST API spec (request/response shapes)
│   └── rules/                    ← [SIDDHANT] JSON rule files per scheme
│       ├── pm-kisan.json
│       ├── pmay.json
│       ├── ayushman-bharat.json
│       └── ... (12 total)
│
├── docker-compose.yml            ← Local dev: PostgreSQL + Backend + Frontend
├── .gitignore
└── README.md
```

---

## 👥 Contributor Responsibilities

> ⚠️ **Do NOT touch other people's modules** to avoid merge conflicts. Each person owns their directories.

### 🔵 Siddhant — Rule Engine + Blockchain

**Owns**: `backend/apps/eligibility/`, `backend/apps/certificates/`, `contracts/`, `docs/rules/`

**Deliverables:**
1. All 12 JSON rule files in `docs/rules/`
2. `rule_engine.py` — pure Python evaluator returning `eligible` / `near_miss` / `not_eligible`
3. Full Pytest suite covering all 12 schemes with boundary and near-miss cases
4. `EligibilityRegistry.sol` — Solidity contract with `onlyOwner` restriction
5. Hardhat setup + deploy script to Polygon Amoy
6. `hashing.py` — deterministic SHA-256 of eligibility result
7. `blockchain.py` — web3.py client to call `storeHash()` and return tx hash

**Interfaces exposed to teammates:**
```python
from apps.eligibility.services.rule_engine import evaluate, RuleResult
from apps.certificates.services.hashing import compute_hash
from apps.certificates.services.blockchain import store_hash_on_chain
```

---

### 🟢 Riya & Neeti — Backend API + AI + OCR

**Owns**: `backend/apps/citizens/`, `backend/apps/schemes/`, `backend/apps/explain/`, `backend/apps/documents/`, `backend/entitle/`

**Deliverables:**
1. Django project scaffold (`settings.py`, `urls.py`, CORS, DB config)
2. `CitizenProfile` model + CRUD API
3. `Scheme` model + `seed_schemes` management command (loads Siddhant's JSON rule files)
4. Wire `evaluate()` into the eligibility API view, save `EligibilityResult`
5. Gemini text explainability — plain-language explanation in Hindi/English
6. Document upload + blur detection + Gemini Vision OCR + confirmation endpoint

**Interfaces to consume from Siddhant:**
```python
from apps.eligibility.services.rule_engine import evaluate
from apps.certificates.services.hashing import compute_hash
from apps.certificates.services.blockchain import store_hash_on_chain
```

---

### 🟡 Sanvi — Frontend (Next.js)

**Owns**: `frontend/`

**Deliverables:**
1. **Landing page** — Hero with animated stats, "How it works" 3-step flow, CTA
2. **Assistant flow** — Animated step-by-step questionnaire (state, age, occupation, income, land, gender, disability)
3. **Dashboard** — Scheme cards with `eligible` (green) / `near_miss` (amber) / `not_eligible` (grey) badges + AI explanation snippets
4. **Certificate page** — Printable certificate with blockchain tx hash, Amoy explorer link, QR code
5. **`lib/api.ts`** — Typed fetch wrappers for all endpoints in `docs/api-contract.md`

**Design system:**
- Colors: Deep emerald `#0D5C4A` + gold `#D4A843` + off-white `#F5F0E8`
- Dark mode default + light toggle
- Font: `Outfit` (headings) + `Inter` (body)
- Glassmorphism cards, smooth transitions, micro-animations

---

## 🌐 Citizen Profile — Standard Data Contract

All modules share this profile schema. The frontend collects it, the backend stores it, and Siddhant's rule engine evaluates it.

```json
{
  "age": 35,
  "state": "Maharashtra",
  "occupation": "farmer",
  "income": 150000,
  "land_owned": true,
  "disability": false,
  "gender": "female",
  "caste": "obc",
  "has_bank_account": true,
  "girl_child_age": null
}
```

**Valid occupation values**: `"farmer"` | `"student"` | `"artisan"` | `"worker"` | `"salaried"` | `"unemployed"` | `"self_employed"`

**Valid caste values**: `"general"` | `"obc"` | `"sc"` | `"st"`

---

## 🚀 Local Development Setup

### Prerequisites
- Python 3.10+, Node.js 18+, Docker + Docker Compose, Git

### 1. Clone
```bash
git clone https://github.com/iamsiddhant9/entitle_mvp.git
cd entitle_mvp
```

### 2. Start the Database
```bash
docker-compose up db -d
```

### 3. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in your secrets
python manage.py migrate
python manage.py seed_schemes
python manage.py runserver
```

### 4. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

### 5. Smart Contracts (Siddhant only)
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network amoy
```

---

## 🔑 Environment Variables

### Backend (`.env`)
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
DATABASE_URL=postgres://postgres:password@localhost:5432/entitle
GEMINI_API_KEY=your-gemini-api-key
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
WALLET_PRIVATE_KEY=your-funded-wallet-private-key
ELIGIBILITY_REGISTRY_ADDRESS=0x...deployed-contract-address
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧪 Testing

```bash
# Rule engine unit tests (run by Siddhant, called by all)
cd backend && pytest apps/eligibility/tests/ -v

# Smart contract tests
cd contracts && npx hardhat test
```

---

## 📡 API Reference

Full API specification → [`docs/api-contract.md`](./docs/api-contract.md)

| Method | Endpoint | Owner | Description |
|--------|----------|-------|-------------|
| `POST` | `/api/citizens/` | Riya/Neeti | Create anonymous citizen session |
| `PATCH` | `/api/citizens/{id}/profile/` | Riya/Neeti | Update citizen profile |
| `GET` | `/api/schemes/` | Riya/Neeti | List all 12 schemes |
| `POST` | `/api/eligibility/evaluate/` | Siddhant+Riya | Run rule engine |
| `POST` | `/api/explain/` | Riya/Neeti | Get AI explanation |
| `POST` | `/api/documents/upload/` | Riya/Neeti | Upload + OCR document |
| `GET` | `/api/documents/missing/{citizen}/{scheme}/` | Riya/Neeti | Get missing docs |
| `POST` | `/api/certificates/issue/` | Siddhant | Issue blockchain certificate |
| `GET` | `/api/certificates/{id}/` | Siddhant | Retrieve certificate + QR |

---

## 🏆 Why ENTITLE Will Win

| Criteria | Our Approach |
|----------|-------------|
| **Technical Depth** | Rule Engine + Gemini AI + Blockchain — 3 independent systems |
| **Real-world Impact** | ₹2 lakh crore in unclaimed benefits — massive addressable problem |
| **Innovation** | Blockchain-verified eligibility certificate is novel in India |
| **Completeness** | End-to-end: profile → evaluate → explain → upload docs → issue certificate → verify on-chain |
| **Scalability** | JSON-driven rules mean adding new schemes = zero code changes |
| **Auditability** | No AI decides eligibility — pure deterministic rules, fully auditable |

---

## 📄 License

MIT License. See [LICENSE](./LICENSE) for details.

---

<div align="center">
Built with ❤️ for India's 1.4 billion citizens
</div>
