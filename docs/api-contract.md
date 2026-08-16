# ENTITLE — API Contract

This document serves as the single source of truth for the request and response shapes of the REST API endpoints in the ENTITLE platform.

## Global Error Envelope

All endpoints must return error responses in the following format when a failure occurs (4xx/5xx status codes):

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description."
  }
}
```

---

## 1. Citizens & Session Management

### `POST /api/citizens/`
- **Description**: Creates a new anonymous citizen session. Also sets a `citizen_id` cookie; clients may equally keep the returned `citizen_id` themselves (the frontend stores it in localStorage).
- **Request Body**: None
- **Response** (Status `201 Created`):
  ```json
  {
    "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a"
  }
  ```

### `GET /api/citizens/{id}/profile/`
- **Description**: Retrieves the profile data for the given citizen ID. `{id}` is the `citizen_id` UUID.
- **Response** (Status `200 OK`): all profile fields (see table below), each `null` until answered:
  ```json
  {
    "id": 1,
    "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a",
    "age": null,
    "gender": null,
    "state": null,
    "residence_area": null,
    "occupation": null,
    "income": null,
    "marital_status": null,
    "land_owned": null,
    "house_owned": null,
    "bank_account": null,
    "income_tax_payer": null,
    "disability": null,
    "has_daughter_under_10": null,
    "aadhaar_linked": null,
    "updated_at": "2026-08-08T11:00:00Z"
  }
  ```

#### Profile fields (the rule engine vocabulary)

| Field | Type | Values |
|---|---|---|
| `age` | integer | years |
| `gender` | string | `female` \| `male` \| `other` |
| `state` | string | full state name, e.g. `"Madhya Pradesh"` |
| `residence_area` | string | `rural` \| `urban` |
| `occupation` | string | `farmer` \| `student` \| `artisan` \| `self_employed` \| `small_business` \| `salaried` \| `unorganized_worker` \| `daily_wage` \| `unemployed` \| `other` |
| `income` | integer | annual family income in ₹ |
| `marital_status` | string | `single` \| `married` \| `widowed` \| `divorced` |
| `land_owned` | boolean | owns cultivable land |
| `house_owned` | boolean | owns a pucca house |
| `bank_account` | boolean | has a bank account |
| `income_tax_payer` | boolean | pays income tax |
| `disability` | boolean | person with disability |
| `has_daughter_under_10` | boolean | has a daughter below 10 |
| `aadhaar_linked` | boolean | Aadhaar linked to mobile |

### `PATCH /api/citizens/{id}/profile/`
- **Description**: Submits or updates profile parameters partially. Any subset of the profile fields may be sent.
- **Request Body**:
  ```json
  {
    "age": 35,
    "state": "Maharashtra",
    "occupation": "farmer",
    "income": 150000,
    "land_owned": true,
    "disability": false
  }
  ```
- **Response** (Status `200 OK`): the full updated profile, same shape as `GET .../profile/`.

---

## 2. Schemes

### `GET /api/schemes/`
- **Description**: Lists all supported welfare schemes with their basic details.
- **Response** (Status `200 OK`):
  ```json
  [
    {
      "id": 1,
      "code": "pm_kisan",
      "name": "PM Kisan Samman Nidhi",
      "domain": "Agriculture",
      "description": "Financial benefit of Rs. 6000/- per year in three equal installments to all landholding farmer families.",
      "benefit": "₹6,000 per year in three equal installments of ₹2,000",
      "source_url": "https://pmkisan.gov.in/"
    }
  ]
  ```

### `GET /api/schemes/{code}/`
- **Description**: Retrieves full details of a specific scheme, including its rule conditions and required documents.
- **Response** (Status `200 OK`):
  ```json
  {
    "id": 1,
    "code": "pm_kisan",
    "name": "PM Kisan Samman Nidhi",
    "domain": "Agriculture",
    "description": "Financial benefit of Rs. 6000/- per year in three equal installments to all landholding farmer families.",
    "benefit": "₹6,000 per year in three equal installments of ₹2,000",
    "rules_json": {
      "code": "pm_kisan",
      "near_miss_threshold": 1,
      "conditions": [
        {"field": "occupation", "op": "eq", "value": "farmer", "label": "Must be a farmer"},
        {"field": "land_owned", "op": "eq", "value": true, "label": "Must own cultivable land"},
        {"field": "income", "op": "lte", "value": 200000, "label": "Annual family income must be at most ₹2,00,000"}
      ]
    },
    "required_documents_json": [
      "aadhaar_card",
      "land_ownership_document",
      "bank_passbook"
    ],
    "source_url": "https://pmkisan.gov.in/"
  }
  ```

  Each rule condition carries an optional human-readable `label` used by the dashboard and the fallback explanations. Operators: `eq`, `neq`, `lte`, `gte`, `lt`, `gt`, `in`.

---

## 3. Eligibility

### `POST /api/eligibility/evaluate/`
- **Description**: Evaluates the citizen's profile against all schemes in the database.
- **Request Body**:
  ```json
  {
    "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a"
  }
  ```
- **Response** (Status `200 OK`):
  ```json
  {
    "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a",
    "results": [
      {
        "id": 42,
        "scheme_id": 1,
        "scheme_code": "pm_kisan",
        "scheme_name": "PM Kisan Samman Nidhi",
        "status": "eligible",
        "matched_rules": [
          {"field": "occupation", "op": "eq", "value": "farmer", "label": "Must be a farmer"},
          {"field": "land_owned", "op": "eq", "value": true, "label": "Must own cultivable land"},
          {"field": "income", "op": "lte", "value": 200000, "label": "Annual family income must be at most ₹2,00,000"}
        ],
        "missing_rules": []
      }
    ]
  }
  ```

  `status` is one of `eligible` | `near_miss` | `not_eligible`. Evaluation is idempotent: one result row per citizen+scheme pair, updated in place on re-evaluation.

### `GET /api/eligibility/results/{citizen_id}/`
- **Description**: Lists the current eligibility results for a citizen.
- **Response** (Status `200 OK`):
  ```json
  [
    {
      "id": 42,
      "scheme_id": 1,
      "scheme_code": "pm_kisan",
      "scheme_name": "PM Kisan Samman Nidhi",
      "status": "eligible",
      "matched_rules": [
        {"field": "occupation", "op": "eq", "value": "farmer", "label": "Must be a farmer"},
        {"field": "land_owned", "op": "eq", "value": true, "label": "Must own cultivable land"},
        {"field": "income", "op": "lte", "value": 200000, "label": "Annual family income must be at most ₹2,00,000"}
      ],
      "missing_rules": [],
      "created_at": "2026-08-08T11:02:00Z"
    }
  ]
  ```

---

## 4. AI Explanation & Assistance

### `POST /api/explain/`
- **Description**: Generates a natural language explainability response from Gemini for a specific eligibility result. Explanations are cached on the result and regenerated when the decision or language changes. When Gemini is not configured the API returns a deterministic template explanation built from the rule labels.
- **Request Body** (`language` is optional, `"en"` (default) or `"hi"`):
  ```json
  {
    "eligibility_result_id": 42,
    "language": "en"
  }
  ```
- **Response** (Status `200 OK`):
  ```json
  {
    "eligibility_result_id": 42,
    "explanation": "You are eligible for PM Kisan because your occupation is farmer, you own land, and your annual income is below Rs. 2,00,000."
  }
  ```

### `POST /api/knowledge/ask/`
- **Description**: Grounded query-answering chat assistant.
- **Request Body**:
  ```json
  {
    "question": "What is the benefit under PM Kisan?",
    "scheme_code": "pm_kisan"
  }
  ```
- **Response** (Status `200 OK`):
  ```json
  {
    "answer": "Under PM Kisan, eligible farmer families receive a financial benefit of Rs. 6000/- per year in three equal installments of Rs. 2000/- each, distributed every four months.",
    "source_url": "https://pmkisan.gov.in/"
  }
  ```

---

## 5. Document Processing & OCR

### `POST /api/documents/upload/`
- **Description**: Uploads a document file and triggers the OCR blur-detection and field extraction pipelines. Max size 8 MB.
- **Request Body** (Multipart Form-Data):
  - `file`: (binary document image)
  - `doc_type`: `aadhaar_card` | `land_ownership_document` | `income_certificate` | `bank_passbook` | `ration_card` | `birth_certificate`
  - `citizen_id`: the citizen session UUID (falls back to the `citizen_id` cookie if omitted)
- **Response** (Status `201 Created`):
  ```json
  {
    "document_id": 12,
    "doc_type": "aadhaar_card",
    "file_ref": "/media/documents/2026/08/aadhaar_12.jpg",
    "extracted_fields": {
      "name": "Siddhant Sonarkar",
      "aadhaar_no": "XXXX-XXXX-1234"
    },
    "is_blurry": false,
    "is_expired": false,
    "confirmed": false
  }
  ```

### `POST /api/documents/{id}/confirm/`
- **Description**: Confirms or updates the fields extracted from the document OCR.
- **Request Body**:
  ```json
  {
    "confirmed": true,
    "extracted_fields": {
      "name": "Siddhant Sonarkar",
      "aadhaar_no": "XXXX-XXXX-1234"
    }
  }
  ```
- **Response** (Status `200 OK`):
  ```json
  {
    "document_id": 12,
    "confirmed": true,
    "extracted_fields": {
      "name": "Siddhant Sonarkar",
      "aadhaar_no": "XXXX-XXXX-1234"
    }
  }
  ```

### `GET /api/documents/missing/{citizen_id}/{scheme_code}/`
- **Description**: Diff of confirmed documents uploaded versus documents required for the scheme. Only documents with `confirmed: true` count as uploaded.
- **Response** (Status `200 OK`):
  ```json
  {
    "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a",
    "scheme_code": "pm_kisan",
    "required_documents": ["land_ownership_document", "aadhaar_card"],
    "uploaded_documents": ["aadhaar_card"],
    "missing_documents": ["land_ownership_document"]
  }
  ```

---

## 6. Certificates & Verification

### `POST /api/certificates/issue/`
- **Description**: Issues a certificate by hashing the eligibility result and submitting a transaction to the Polygon Amoy blockchain.
- **Request Body**:
  ```json
  {
    "eligibility_result_id": 42
  }
  ```
- **Response** (Status `201 Created`):
  ```json
  {
    "certificate_id": 5,
    "eligibility_result_id": 42,
    "eligibility_hash": "0x4b7c62b5d4e1075c3f30be6fbd5d7aa19e34e5657ef9a5840d5b6e22fa678f28",
    "tx_hash": "0xabc123e4f567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "chain_status": "submitted",
    "explorer_url": "https://amoy.polygonscan.com/tx/0xabc123e4f567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "issued_at": "2026-08-08T11:05:00Z"
  }
  ```

  `chain_status` is `submitted` when the transaction was sent to Polygon Amoy, `simulated` when the blockchain credentials are not configured (the certificate and hash still work, they are just not anchored on-chain), or `failed` when submission errored. The hash is a canonical SHA-256 over the certificate payload: JSON with lexicographically sorted keys, compact separators, UTF-8.

### `GET /api/certificates/{id}/`
- **Description**: Retrieves detailed certificate verify details, including transaction status, the hashed payload and the verification QR payload. `qr_payload` is `CERTIFICATE_VERIFY_BASE_URL` + hash (points at the frontend `/verify/{hash}` page).
- **Response** (Status `200 OK`):
  ```json
  {
    "id": 5,
    "eligibility_result_id": 42,
    "eligibility_hash": "0x4b7c62b5d4e1075c3f30be6fbd5d7aa19e34e5657ef9a5840d5b6e22fa678f28",
    "tx_hash": "0xabc123e4f567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "chain_status": "submitted",
    "explorer_url": "https://amoy.polygonscan.com/tx/0xabc123e4f567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "qr_payload": "http://localhost:3000/verify/0x4b7c62b5d4e1075c3f30be6fbd5d7aa19e34e5657ef9a5840d5b6e22fa678f28",
    "payload": {
      "certificate_version": 1,
      "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a",
      "scheme_code": "pm_kisan",
      "scheme_name": "PM Kisan Samman Nidhi",
      "status": "eligible",
      "matched_rules": [],
      "missing_rules": [],
      "evaluated_at": "2026-08-08T11:02:00Z"
    },
    "issued_at": "2026-08-08T11:05:00Z"
  }
  ```

### `GET /api/certificates/verify/{hash}/`
- **Description**: Integrity check for a certificate hash — the target of the certificate QR code. Looks up the local registry and, when blockchain credentials are configured, the on-chain `EligibilityRegistry.verify()`.
- **Response** (Status `200 OK`):
  ```json
  {
    "eligibility_hash": "0x4b7c62b5d4e1075c3f30be6fbd5d7aa19e34e5657ef9a5840d5b6e22fa678f28",
    "exists": true,
    "verified_on_chain": true,
    "chain_status": "submitted",
    "tx_hash": "0xabc123e4f567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "explorer_url": "https://amoy.polygonscan.com/tx/0xabc123e4f567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "scheme_name": "PM Kisan Samman Nidhi",
    "status": "eligible",
    "issued_at": "2026-08-08T11:05:00Z"
  }
  ```

  `verified_on_chain` is `null` when the blockchain is not configured — verification then relies on the local registry (`exists`).
