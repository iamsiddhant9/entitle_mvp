# ENTITLE — AI-Powered Government Entitlement Platform

ENTITLE is an AI-powered layer between citizens and Indian government welfare schemes. It does NOT replace government portals. The application's core architecture is built around three pillars with strict boundaries:
1. **Rule Engine Decides**: Eligibility is determined deterministically using rules.
2. **AI Explains**: Natural language explanation of eligibility/near-miss results.
3. **Blockchain Verifies**: Decentralized, tamper-evident verification of eligibility certificates.

---

## Core Philosophy

- **Deterministic Rule Engine**: Rules are auditable and cannot hallucinate a citizen in or out of benefits.
- **Explainability**: Translates complex policy conditions into simple natural language.
- **Verification**: Generates a tamper-proof blockchain receipt (hash only, zero PII on-chain) to verify citizen eligibility.

---

## Tech Stack

- **Frontend**: Next.js (TypeScript, App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Django + Django REST Framework (DRF)
- **Database**: PostgreSQL
- **AI**: Gemini API (Text + Gemini Vision for OCR)
- **Blockchain**: Polygon Amoy Testnet (Solidity contract + `web3.py` client)

---

## Folder Structure

```
entitle/
├── frontend/                 # Next.js Frontend
│   ├── app/                  # App router pages (landing, assistant, dashboard, certificate)
│   ├── components/           # Component library grouped by page/feature
│   ├── lib/                  # Helper utilities (API fetch wrappers)
│   └── context/              # React Context (e.g. CitizenProfileContext)
├── backend/                  # Django Backend
│   ├── entitle/              # Django settings & URL routing
│   └── apps/                 # Django Apps
│       ├── citizens/         # Citizen profile and session management
│       ├── schemes/          # Scheme database models and seeding
│       ├── eligibility/      # Eligibility logic & rule engine (pure Python)
│       ├── explain/          # Gemini integration for explanation
│       ├── documents/        # Document upload and OCR extraction
│       └── certificates/     # Hashing and blockchain transaction logic
├── contracts/                # Solidity Smart Contracts (EligibilityRegistry)
├── docs/                     # Project Documentation
│   ├── api-contract.md       # REST API Contract specifications
│   └── rules/                # JSON rules per scheme
└── docker-compose.yml        # Multi-container orchestration (Local PostgreSQL / services)
```

---

## Requirements

### Backend Requirements (Python / Django)
- Python 3.10+
- Django / Django REST Framework (DRF)
- PostgreSQL database integration
- `web3.py` for blockchain interaction
- `google-generativeai` SDK for Gemini API
- OpenCV/Pillow & NumPy for basic local image quality check (blurry check)

### Frontend Requirements (Node.js / Next.js)
- Node.js 18+
- React 18+
- Next.js (App Router, TypeScript)
- Tailwind CSS
- lucide-react (icons)
- qrcode (for generating QR codes on certificates)

### Blockchain (Solidity / Hardhat or Foundry)
- Solidity ^0.8.20
- Deploy tool: Hardhat or Foundry for deploying `EligibilityRegistry.sol`
- Polygon Amoy Testnet RPC connection details

---

