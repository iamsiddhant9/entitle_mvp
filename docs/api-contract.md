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

**Trust model.** The deterministic rule engine decides eligibility. These endpoints only put an
existing result into human language — Gemini never decides, and is instructed not to contradict the
verdict it is given. When Gemini is unavailable or unconfigured, a deterministic fallback renders
the same result; responses are always well-formed either way.

**Grounding.** Prompts carry only the scheme name, its stored description, the verdict, and the
scheme's conditions rendered into plain language. The model is instructed to invent nothing and
never to name another scheme (ENTITLE evaluates twelve, but only one is ever in context).

**Privacy.** The citizen's profile is **not** sent to the model. Rule conditions are verbalised
before they enter a prompt, so raw engine syntax (`lte`, `eq`, field identifiers) never reaches the
model or the citizen.

### `POST /api/explain/`
- **Description**: Explains an eligibility result in plain language.
- **Ownership**: the caller must prove they own the result by supplying the owning citizen's UUID —
  in `citizen_id`, the `X-Citizen-Id` header, or the citizen session. The enumerable integer primary
  key is **not** accepted as proof.
- **Request Body**:
  ```json
  {
    "eligibility_result_id": 42,
    "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a",
    "language": "en"
  }
  ```
  `language` accepts `"en"` (default) or `"hi"`.
- **Response** (Status `200 OK`):
  ```json
  {
    "eligibility_result_id": 42,
    "explanation": "Good news — you are eligible for PM Kisan Samman Nidhi. You already meet these conditions: your occupation is farmer, you own land and your annual family income is less than or equal to ₹2,00,000. You can go ahead and apply for this scheme."
  }
  ```
- **Errors**: `VALIDATION_ERROR` (`400`) when `eligibility_result_id` is missing;
  `PERMISSION_DENIED` (`403`) when ownership is not proven; `NOT_FOUND` (`404`) for an unknown id.

### `POST /api/knowledge/ask/`
- **Description**: Answers a question about a scheme, grounded strictly in the scheme record ENTITLE
  holds. Also reachable at `/api/explain/ask/` (undocumented alias, retained for compatibility).
- **Unknown or absent `scheme_code`**: returns `200` with an answer stating that ENTITLE has no
  information about that scheme, and a link to the official portal. It does **not** answer from the
  model's own knowledge.
- **Request Body**:
  ```json
  {
    "question": "Who can apply for PM Kisan?",
    "scheme_code": "pm_kisan",
    "language": "en"
  }
  ```
- **Response** (Status `200 OK`):
  ```json
  {
    "answer": "PM Kisan Samman Nidhi: Financial benefit of Rs. 6000/- per year in three equal installments to all landholding farmer families. For full official details, see https://pmkisan.gov.in/",
    "source_url": "https://pmkisan.gov.in/"
  }
  ```
  > The example answer is drawn entirely from the seeded scheme description. Earlier versions of this
  > contract showed an answer containing an instalment schedule ("Rs. 2000 each, every four months")
  > that appears in no data supplied to the model — exactly the kind of invention these endpoints must
  > not produce.
- **Errors**: `VALIDATION_ERROR` (`400`) when `question` is missing.

---

## 5. Document Processing & OCR

**Trust model.** Gemini Vision *extracts* fields; the citizen *confirms* them; the
deterministic rule engine *decides* eligibility. Only confirmed, in-date documents are
treated as verified document data, and only verified data can reach `CitizenProfile`.

**Extraction is never faked.** When extraction cannot run or fails for any reason, the
response carries `extracted_fields: {}` together with an `extraction_status` that says
why. The API never substitutes example values for a real document reading.

| `extraction_status` | Meaning |
|---|---|
| `success` | Fields were read from the document and validated against its schema |
| `failed` | Extraction was attempted and failed (see `extraction_error`) |
| `not_configured` | No Gemini API key is configured |
| `unsupported_doc_type` | This document type has no extraction schema |
| `skipped_low_quality` | The image was too blurry or blank to read |

`extraction_source` is one of `gemini_vision`, `human` (the citizen supplied or corrected
the values at confirmation) or `none`.

**Supported `doc_type` values** (these match `Scheme.required_documents_json`):
`aadhaar_card`, `parent_aadhaar`, `land_ownership_document`, `income_certificate`,
`ration_card`, `bpl_ration_card`, `bank_passbook`, `pan_card`, `student_id`, `mark_sheet`,
`trade_certificate`, `business_proposal`, `school_leaving_certificate`,
`birth_certificate`, `samagra_id`, `domicile_certificate`.

Structured extraction schemas currently exist for `aadhaar_card`, `parent_aadhaar`,
`land_ownership_document`, `income_certificate`, `ration_card` and `bpl_ration_card`. The
rest are accepted and can be confirmed, but report `unsupported_doc_type`.

**Privacy.** Aadhaar-style numbers are masked to `XXXX-XXXX-1234` before storage, from both
the extraction and confirmation paths. Masking applies to the identifier field itself and
to any Aadhaar-shaped number appearing in *any* other field, in any separator form
(`1234 5678 9012`, `1234-5678-9012`, `123456789012`) — including embedded in free text.
The full number is never persisted or logged.

**File limits.** JPEG, PNG and WEBP only, determined by inspecting the file content rather
than the declared `Content-Type`. Maximum 10 MB and 50 megapixels (configurable via
`DOCUMENT_MAX_UPLOAD_BYTES` / `DOCUMENT_MAX_IMAGE_PIXELS`). **PDFs are not supported** —
rasterising one requires an external binary this project does not ship.

### `POST /api/documents/upload/`
- **Description**: Validates and stores a document, assesses image quality, and runs structured Gemini Vision extraction.
- **Request Body** (Multipart Form-Data):
  - `file`: (binary document image) — **required**
  - `doc_type`: one of the supported values above — **required**
  - `citizen_id`: owning citizen's UUID — **required** unless a citizen session cookie is present
- **Response** (Status `201 Created`):
  ```json
  {
    "document_id": 12,
    "doc_type": "aadhaar_card",
    "file_ref": "/media/documents/9f2c1a7b8e4d4f6cb0d21e3a5c7b9d10.jpg",
    "extracted_fields": {
      "name": "Rekha Devi Sharma",
      "aadhaar_no": "XXXX-XXXX-2109"
    },
    "is_blurry": false,
    "is_expired": false,
    "confirmed": false,
    "extraction_status": "success",
    "extraction_source": "gemini_vision",
    "extraction_model": "gemini-2.5-flash",
    "extraction_error": "",
    "quality_status": "ok",
    "blur_score": 58809.3,
    "expiry_status": "not_applicable",
    "expiry_date": null,
    "created_at": "2026-08-15T11:04:00Z"
  }
  ```
- **Errors**: `FILE_REQUIRED`, `FILE_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`, `IMAGE_TOO_LARGE`,
  `CORRUPT_IMAGE`, `UNSUPPORTED_DOC_TYPE`, `CITIZEN_ID_REQUIRED` (all `400`);
  `NOT_FOUND` (`404`) for an unknown `citizen_id`.
- **Note**: a blurry document still returns `201` with `is_blurry: true`; extraction is skipped rather than run on an unreadable image.

### `POST /api/documents/{id}/confirm/`
- **Description**: The trust boundary. The citizen reviews the extracted fields, corrects them if needed, and confirms. Only then does the data become verified document data and populate `CitizenProfile`.
- **Ownership**: the caller must prove they own the document by supplying the owning citizen's UUID — in `citizen_id`, the `X-Citizen-Id` header, or the citizen session. The enumerable integer primary key is **not** accepted as proof.
- **Request Body**:
  ```json
  {
    "confirmed": true,
    "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a",
    "extracted_fields": {
      "name": "Rekha Devi Sharma",
      "aadhaar_no": "XXXX-XXXX-2109"
    }
  }
  ```
- **Response** (Status `200 OK`):
  ```json
  {
    "document_id": 12,
    "confirmed": true,
    "extracted_fields": {
      "name": "Rekha Devi Sharma",
      "aadhaar_no": "XXXX-XXXX-2109"
    },
    "extraction_source": "human",
    "expiry_status": "not_applicable",
    "is_expired": false,
    "profile_update": {
      "applied": {"age": 38, "gender": "female"},
      "conflicts": [],
      "skipped": []
    }
  }
  ```
- **`profile_update`**: verified values are written **only into profile fields that are currently empty**. A value the citizen declared themselves is never overwritten; a disagreement is reported in `conflicts` as `{field, declared, document, doc_type, document_id}` for the application to surface for review.
- **Errors**: `DOCUMENT_QUALITY_TOO_LOW` (`400`) when the document is too blurry to be read
  reliably — upload a clearer image; `VALIDATION_ERROR` (`400`) if `confirmed` is not `true`
  (documents cannot be un-confirmed); `PERMISSION_DENIED` (`403`) when ownership is not
  proven; `NOT_FOUND` (`404`) for an unknown document id.

### `GET /api/documents/missing/{citizen_id}/{scheme_code}/`
- **Description**: Diff of the documents that satisfy the scheme's requirements against those required.
- **A document satisfies a requirement only when it is confirmed by the citizen and not expired.** Unconfirmed uploads never count.
- Expiry is evaluated against the **current date** at read time, not just the status recorded at confirmation, so a certificate confirmed while valid stops counting once its printed validity date passes.
- **Response** (Status `200 OK`):
  ```json
  {
    "citizen_id": "d3b07384-d113-4956-b51b-415c3298642a",
    "scheme_code": "pm_kisan",
    "required_documents": ["land_ownership_document", "aadhaar_card"],
    "uploaded_documents": ["aadhaar_card"],
    "missing_documents": ["land_ownership_document"],
    "unconfirmed_documents": [],
    "expired_documents": []
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
