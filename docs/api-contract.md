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
- **Description**: Creates a new anonymous citizen session. Returns a cookie containing the `session_id`.
- **Request Body**: None
- **Response** (Status `201 Created`):
  ```json
  {
    "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a"
  }
  ```

### `GET /api/citizens/{id}/profile/`
- **Description**: Retrieves the profile data for the given citizen ID.
- **Response** (Status `200 OK`):
  ```json
  {
    "id": 1,
    "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a",
    "age": null,
    "state": null,
    "occupation": null,
    "income": null,
    "land_owned": null,
    "disability": null,
    "updated_at": "2026-08-08T11:00:00Z"
  }
  ```

### `PATCH /api/citizens/{id}/profile/`
- **Description**: Submits or updates profile parameters partially.
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
- **Response** (Status `200 OK`):
  ```json
  {
    "id": 1,
    "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a",
    "age": 35,
    "state": "Maharashtra",
    "occupation": "farmer",
    "income": 150000,
    "land_owned": true,
    "disability": false,
    "updated_at": "2026-08-08T11:01:00Z"
  }
  ```

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
      "description": "Financial benefit of Rs. 6000/- per year in three equal installments to all landholding farmer families.",
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
    "description": "Financial benefit of Rs. 6000/- per year in three equal installments to all landholding farmer families.",
    "rules_json": {
      "code": "pm_kisan",
      "near_miss_threshold": 1,
      "conditions": [
        {"field": "occupation", "op": "eq", "value": "farmer"},
        {"field": "land_owned", "op": "eq", "value": true},
        {"field": "income", "op": "lte", "value": 200000}
      ]
    },
    "required_documents_json": [
      "land_ownership_document",
      "aadhaar_card"
    ],
    "source_url": "https://pmkisan.gov.in/"
  }
  ```

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
        "status": "eligible",
        "matched_rules": [
          {"field": "occupation", "op": "eq", "value": "farmer"},
          {"field": "land_owned", "op": "eq", "value": true},
          {"field": "income", "op": "lte", "value": 200000}
        ],
        "missing_rules": []
      }
    ]
  }
  ```

### `GET /api/eligibility/results/{citizen_id}/`
- **Description**: Lists the current eligibility results for a citizen.
- **Response** (Status `200 OK`):
  ```json
  [
    {
      "id": 42,
      "scheme_id": 1,
      "scheme_code": "pm_kisan",
      "status": "eligible",
      "matched_rules": [
        {"field": "occupation", "op": "eq", "value": "farmer"},
        {"field": "land_owned", "op": "eq", "value": true},
        {"field": "income", "op": "lte", "value": 200000}
      ],
      "missing_rules": [],
      "created_at": "2026-08-08T11:02:00Z"
    }
  ]
  ```

---

## 4. AI Explanation & Assistance

### `POST /api/explain/`
- **Description**: Generates a natural language explainability response from Gemini for a specific eligibility result.
- **Request Body**:
  ```json
  {
    "eligibility_result_id": 42
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
- **Description**: Uploads a document file and triggers the OCR blur-detection and field extraction pipelines.
- **Request Body** (Multipart Form-Data):
  - `file`: (binary document image)
  - `doc_type`: "land_ownership_document" | "aadhaar_card"
- **Response** (Status `201 Created`):
  ```json
  {
    "document_id": 12,
    "doc_type": "aadhaar_card",
    "file_ref": "/media/documents/aadhaar_12.jpg",
    "extracted_fields": {
      "name": "Siddhant Sonarkar",
      "aadhaar_no": "XXXX-XXXX-1234"
    },
    "is_blurry": false,
    "is_expired": false
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
- **Description**: Diff of confirmed documents uploaded versus documents required for the scheme.
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
    "explorer_url": "https://amoy.polygonscan.com/tx/0xabc123e4f567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "issued_at": "2026-08-08T11:05:00Z"
  }
  ```

### `GET /api/certificates/{id}/`
- **Description**: Retrieves detailed certificate verify details, including transaction status and verification QR payload.
- **Response** (Status `200 OK`):
  ```json
  {
    "id": 5,
    "eligibility_result_id": 42,
    "eligibility_hash": "0x4b7c62b5d4e1075c3f30be6fbd5d7aa19e34e5657ef9a5840d5b6e22fa678f28",
    "tx_hash": "0xabc123e4f567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "explorer_url": "https://amoy.polygonscan.com/tx/0xabc123e4f567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "qr_payload": "https://entitle.gov.in/verify/0x4b7c62b5d4e1075c3f30be6fbd5d7aa19e34e5657ef9a5840d5b6e22fa678f28",
    "issued_at": "2026-08-08T11:05:00Z"
  }
  ```
