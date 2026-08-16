/**
 * ENTITLE API Client — src/lib/api.ts
 *
 * Typed fetch wrappers for every backend endpoint defined in docs/api-contract.md.
 * Usage: import the helpers you need and call them from components / server actions.
 *
 * Base URL is taken from NEXT_PUBLIC_API_URL (defaults to http://localhost:8000).
 * All helpers throw an `ApiError` when the server returns a non-2xx status.
 */

// ---------------------------------------------------------------------------
// Base URL & Error
// ---------------------------------------------------------------------------

const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

/** Matches the global error envelope returned by every endpoint. */
export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    credentials: "include", // send session cookie
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      code = payload.error?.code ?? code;
      message = payload.error?.message ?? message;
    } catch {
      // ignore JSON parse failures
    }
    throw new ApiError(response.status, code, message);
  }

  // 204 No Content — return undefined cast to T
  if (response.status === 204) return undefined as unknown as T;

  return response.json() as Promise<T>;
}

/** Multipart/form-data upload (no Content-Type header; let the browser set the boundary). */
async function upload<T>(path: string, formData: FormData): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      code = payload.error?.code ?? code;
      message = payload.error?.message ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(response.status, code, message);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// 1. Citizens & Session Management
// ---------------------------------------------------------------------------

export interface CitizenSession {
  citizen_id: string; // UUID
}

export interface CitizenProfile {
  id: number;
  citizen_id: string; // UUID
  age: number | null;
  state: string | null;
  occupation: string | null;
  income: number | null;
  land_owned: boolean | null;
  disability: boolean | null;
  gender: string | null;
  caste: string | null;
  has_bank_account: boolean | null;
  girl_child_age: number | null;
  updated_at: string; // ISO 8601
}

export type CitizenProfilePatch = Partial<
  Omit<CitizenProfile, "id" | "citizen_id" | "updated_at">
>;

/** POST /api/citizens/ — create an anonymous citizen session. */
export async function createCitizenSession(): Promise<CitizenSession> {
  return request<CitizenSession>("/api/citizens/", { method: "POST" });
}

/** GET /api/citizens/{id}/profile/ — retrieve citizen profile. */
export async function getCitizenProfile(citizenId: string): Promise<CitizenProfile> {
  return request<CitizenProfile>(`/api/citizens/${citizenId}/profile/`);
}

/** PATCH /api/citizens/{id}/profile/ — update citizen profile (partial). */
export async function updateCitizenProfile(
  citizenId: string,
  patch: CitizenProfilePatch
): Promise<CitizenProfile> {
  return request<CitizenProfile>(`/api/citizens/${citizenId}/profile/`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// ---------------------------------------------------------------------------
// 2. Schemes
// ---------------------------------------------------------------------------

export interface SchemeListItem {
  id: number;
  code: string;
  name: string;
  description: string;
  source_url: string;
}

export interface RuleCondition {
  field: string;
  op: "eq" | "neq" | "lte" | "gte" | "lt" | "gt" | "in";
  value: string | number | boolean | string[];
}

export interface SchemeRules {
  code: string;
  near_miss_threshold: number;
  conditions: RuleCondition[];
}

export interface SchemeDetail extends SchemeListItem {
  rules_json: SchemeRules;
  required_documents_json: string[];
}

/** GET /api/schemes/ — list all supported welfare schemes. */
export async function listSchemes(): Promise<SchemeListItem[]> {
  return request<SchemeListItem[]>("/api/schemes/");
}

/** GET /api/schemes/{code}/ — retrieve full scheme details including rules. */
export async function getScheme(schemeCode: string): Promise<SchemeDetail> {
  return request<SchemeDetail>(`/api/schemes/${schemeCode}/`);
}

// ---------------------------------------------------------------------------
// 3. Eligibility
// ---------------------------------------------------------------------------

export interface EligibilityResult {
  id: number;
  scheme_id: number;
  scheme_code: string;
  status: "eligible" | "near_miss" | "not_eligible";
  matched_rules: RuleCondition[];
  missing_rules: RuleCondition[];
  created_at?: string; // ISO 8601 — present in list endpoint
}

export interface EvaluateEligibilityResponse {
  citizen_id: string;
  results: EligibilityResult[];
}

/** POST /api/eligibility/evaluate/ — run rule engine for all schemes. */
export async function evaluateEligibility(
  citizenId: string
): Promise<EvaluateEligibilityResponse> {
  return request<EvaluateEligibilityResponse>("/api/eligibility/evaluate/", {
    method: "POST",
    body: JSON.stringify({ citizen_id: citizenId }),
  });
}

/** GET /api/eligibility/results/{citizen_id}/ — list cached eligibility results. */
export async function getEligibilityResults(
  citizenId: string
): Promise<EligibilityResult[]> {
  return request<EligibilityResult[]>(`/api/eligibility/results/${citizenId}/`);
}

// ---------------------------------------------------------------------------
// 4. AI Explanation & Assistance
// ---------------------------------------------------------------------------

export interface ExplainRequest {
  eligibility_result_id: number;
  citizen_id: string;
  language?: "en" | "hi";
}

export interface ExplainResponse {
  eligibility_result_id: number;
  explanation: string;
}

/** POST /api/explain/ — get plain-language AI explanation for an eligibility result. */
export async function explainEligibility(
  payload: ExplainRequest
): Promise<ExplainResponse> {
  return request<ExplainResponse>("/api/explain/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface KnowledgeAskRequest {
  question: string;
  scheme_code?: string;
  language?: "en" | "hi";
}

export interface KnowledgeAskResponse {
  answer: string;
  source_url: string;
}

/** POST /api/knowledge/ask/ — ask a question about a scheme grounded in ENTITLE's data. */
export async function askKnowledgeBase(
  payload: KnowledgeAskRequest
): Promise<KnowledgeAskResponse> {
  return request<KnowledgeAskResponse>("/api/knowledge/ask/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// 5. Document Processing & OCR
// ---------------------------------------------------------------------------

export type DocType =
  | "aadhaar_card"
  | "parent_aadhaar"
  | "land_ownership_document"
  | "income_certificate"
  | "ration_card"
  | "bpl_ration_card"
  | "bank_passbook"
  | "pan_card"
  | "student_id"
  | "mark_sheet"
  | "trade_certificate"
  | "business_proposal"
  | "school_leaving_certificate"
  | "birth_certificate"
  | "samagra_id"
  | "domicile_certificate";

export type ExtractionStatus =
  | "success"
  | "failed"
  | "not_configured"
  | "unsupported_doc_type"
  | "skipped_low_quality";

export type ExtractionSource = "gemini_vision" | "human" | "none";

export type QualityStatus = "ok" | "blurry" | "blank";

export type ExpiryStatus =
  | "not_applicable"
  | "valid"
  | "expiring_soon"
  | "expired"
  | "unknown";

export interface DocumentUploadResponse {
  document_id: number;
  doc_type: DocType;
  file_ref: string;
  extracted_fields: Record<string, string | number | boolean | null>;
  is_blurry: boolean;
  is_expired: boolean;
  confirmed: boolean;
  extraction_status: ExtractionStatus;
  extraction_source: ExtractionSource;
  extraction_model: string;
  extraction_error: string;
  quality_status: QualityStatus;
  blur_score: number;
  expiry_status: ExpiryStatus;
  expiry_date: string | null;
  created_at: string;
}

export interface ProfileUpdateMapping {
  applied: Record<string, string | number | boolean | null>;
  conflicts: Array<{
    field: string;
    declared: string | number | boolean | null;
    document: string | number | boolean | null;
    doc_type: DocType;
    document_id: number;
  }>;
  skipped: string[];
}

export interface DocumentConfirmResponse {
  document_id: number;
  confirmed: boolean;
  extracted_fields: Record<string, string | number | boolean | null>;
  extraction_source: ExtractionSource;
  expiry_status: ExpiryStatus;
  is_expired: boolean;
  profile_update: ProfileUpdateMapping;
}

export interface DocumentMissingResponse {
  citizen_id: string;
  scheme_code: string;
  required_documents: string[];
  uploaded_documents: string[];
  missing_documents: string[];
  unconfirmed_documents: string[];
  expired_documents: string[];
}

/**
 * POST /api/documents/upload/
 * Uploads a document image, runs quality check and Gemini Vision OCR.
 */
export async function uploadDocument(
  file: File,
  docType: DocType,
  citizenId: string
): Promise<DocumentUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("doc_type", docType);
  form.append("citizen_id", citizenId);
  return upload<DocumentUploadResponse>("/api/documents/upload/", form);
}

/**
 * POST /api/documents/{id}/confirm/
 * Citizen reviews extracted fields and confirms the document.
 * Pass correctedFields to override/correct what Gemini extracted.
 */
export async function confirmDocument(
  documentId: number,
  citizenId: string,
  correctedFields?: Record<string, string | number | boolean | null>
): Promise<DocumentConfirmResponse> {
  const body: Record<string, unknown> = {
    confirmed: true,
    citizen_id: citizenId,
  };
  if (correctedFields !== undefined) {
    body.extracted_fields = correctedFields;
  }
  return request<DocumentConfirmResponse>(`/api/documents/${documentId}/confirm/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** GET /api/documents/missing/{citizen_id}/{scheme_code}/ — diff required vs uploaded docs. */
export async function getMissingDocuments(
  citizenId: string,
  schemeCode: string
): Promise<DocumentMissingResponse> {
  return request<DocumentMissingResponse>(
    `/api/documents/missing/${citizenId}/${schemeCode}/`
  );
}

/** GET /api/documents/list/{citizen_id}/ — fetch all uploaded documents for a citizen. */
export async function listDocuments(
  citizenId: string
): Promise<DocumentUploadResponse[]> {
  return request<DocumentUploadResponse[]>(`/api/documents/list/${citizenId}/`);
}

// ---------------------------------------------------------------------------
// 6. Certificates & Verification
// ---------------------------------------------------------------------------

export interface CertificateIssueResponse {
  certificate_id: number;
  eligibility_result_id: number;
  eligibility_hash: string;
  tx_hash: string;
  explorer_url: string;
  issued_at: string; // ISO 8601
}

export interface CertificateDetail extends CertificateIssueResponse {
  id: number;
  qr_payload: string; // URL to embed in QR code
}

/** POST /api/certificates/issue/ — hash result and store on Polygon Amoy. */
export async function issueCertificate(
  eligibilityResultId: number
): Promise<CertificateIssueResponse> {
  return request<CertificateIssueResponse>("/api/certificates/issue/", {
    method: "POST",
    body: JSON.stringify({ eligibility_result_id: eligibilityResultId }),
  });
}

/** GET /api/certificates/{id}/ — retrieve certificate with QR payload. */
export async function getCertificate(certificateId: number): Promise<CertificateDetail> {
  return request<CertificateDetail>(`/api/certificates/${certificateId}/`);
}

// ---------------------------------------------------------------------------
// 7. DigiLocker Integration
// ---------------------------------------------------------------------------

export interface DigiLockerAuthUrlResponse {
  auth_url: string;
}

/**
 * GET /api/documents/digilocker/auth-url/
 * Returns the DigiLocker OAuth URL to redirect the user to.
 */
export async function getDigiLockerAuthUrl(
  citizenId: string,
  docTypes: DocType[] = []
): Promise<DigiLockerAuthUrlResponse> {
  const params = new URLSearchParams({ citizen_id: citizenId });
  if (docTypes.length > 0) {
    params.set("doc_types", docTypes.join(","));
  }
  return request<DigiLockerAuthUrlResponse>(
    `/api/documents/digilocker/auth-url/?${params.toString()}`
  );
}
