// Typed fetch wrappers for every ENTITLE backend endpoint.
// Source of truth: docs/api-contract.md

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Shared vocabulary
// ---------------------------------------------------------------------------

export type Gender = "female" | "male" | "other";
export type ResidenceArea = "rural" | "urban";
export type Occupation =
  | "farmer"
  | "student"
  | "artisan"
  | "self_employed"
  | "small_business"
  | "salaried"
  | "unorganized_worker"
  | "daily_wage"
  | "unemployed"
  | "other";
export type MaritalStatus = "single" | "married" | "widowed" | "divorced";
export type EligibilityStatus = "eligible" | "near_miss" | "not_eligible";
export type RuleOp = "eq" | "neq" | "lte" | "gte" | "lt" | "gt" | "in";
export type ChainStatus = "submitted" | "simulated" | "failed";
export type DocType =
  | "aadhaar_card"
  | "land_ownership_document"
  | "income_certificate"
  | "bank_passbook"
  | "ration_card"
  | "birth_certificate";
export type ExplainLanguage = "en" | "hi";

export interface RuleCondition {
  field: string;
  op: RuleOp;
  value: string | number | boolean | Array<string | number>;
  label?: string;
}

// ---------------------------------------------------------------------------
// Citizens
// ---------------------------------------------------------------------------

export interface CitizenProfile {
  id: number;
  citizen_id: string;
  age: number | null;
  gender: Gender | null;
  state: string | null;
  residence_area: ResidenceArea | null;
  occupation: Occupation | null;
  income: number | null;
  marital_status: MaritalStatus | null;
  land_owned: boolean | null;
  house_owned: boolean | null;
  bank_account: boolean | null;
  income_tax_payer: boolean | null;
  disability: boolean | null;
  has_daughter_under_10: boolean | null;
  aadhaar_linked: boolean | null;
  updated_at: string;
}

/** Any subset of the editable profile fields may be PATCHed. */
export type CitizenProfileInput = Partial<
  Omit<CitizenProfile, "id" | "citizen_id" | "updated_at">
>;

export interface CreateCitizenResponse {
  citizen_id: string;
}

// ---------------------------------------------------------------------------
// Schemes
// ---------------------------------------------------------------------------

export interface Scheme {
  id: number;
  code: string;
  name: string;
  domain: string;
  description: string;
  benefit: string;
  source_url: string;
}

export interface SchemeRules {
  code: string;
  near_miss_threshold: number;
  conditions: RuleCondition[];
}

export interface SchemeDetail extends Scheme {
  rules_json: SchemeRules;
  required_documents_json: string[];
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

export interface EligibilityResult {
  id: number;
  scheme_id: number;
  scheme_code: string;
  scheme_name: string;
  status: EligibilityStatus;
  matched_rules: RuleCondition[];
  missing_rules: RuleCondition[];
  created_at?: string;
}

export interface EvaluateResponse {
  citizen_id: string;
  results: EligibilityResult[];
}

// ---------------------------------------------------------------------------
// AI explanation & assistance
// ---------------------------------------------------------------------------

export interface ExplainResponse {
  eligibility_result_id: number;
  explanation: string;
}

export interface KnowledgeAnswer {
  answer: string;
  source_url: string | null;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export type ExtractedFields = Record<string, unknown>;

export interface UploadedDocument {
  document_id: number;
  doc_type: DocType;
  file_ref: string;
  extracted_fields: ExtractedFields;
  is_blurry: boolean;
  is_expired: boolean;
  confirmed: boolean;
}

export interface ConfirmDocumentResponse {
  document_id: number;
  confirmed: boolean;
  extracted_fields: ExtractedFields;
}

export interface MissingDocumentsResponse {
  citizen_id: string;
  scheme_code: string;
  required_documents: string[];
  uploaded_documents: string[];
  missing_documents: string[];
}

// ---------------------------------------------------------------------------
// Certificates & verification
// ---------------------------------------------------------------------------

export interface IssuedCertificate {
  certificate_id: number;
  eligibility_result_id: number;
  eligibility_hash: string;
  tx_hash: string | null;
  chain_status: ChainStatus;
  explorer_url: string | null;
  issued_at: string;
}

export interface CertificatePayload {
  certificate_version: number;
  citizen_id: string;
  scheme_code: string;
  scheme_name: string;
  status: EligibilityStatus;
  matched_rules: RuleCondition[];
  missing_rules: RuleCondition[];
  evaluated_at: string;
}

export interface Certificate {
  id: number;
  eligibility_result_id: number;
  eligibility_hash: string;
  tx_hash: string | null;
  chain_status: ChainStatus;
  explorer_url: string | null;
  qr_payload: string;
  payload: CertificatePayload;
  issued_at: string;
}

export interface VerifyResult {
  eligibility_hash: string;
  exists: boolean;
  /** null when the blockchain is not configured — verification then relies on the registry. */
  verified_on_chain: boolean | null;
  chain_status: ChainStatus | null;
  tx_hash: string | null;
  explorer_url: string | null;
  scheme_name: string | null;
  status: EligibilityStatus | null;
  issued_at: string | null;
}

// ---------------------------------------------------------------------------
// Error handling — every error response uses {"error": {"code", "message"}}
// ---------------------------------------------------------------------------

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
  };
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/** Readable message for any thrown value — prefers the backend envelope's message. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(
      "Could not reach the ENTITLE server. Please check that the backend is running.",
      "NETWORK_ERROR",
      0
    );
  }
  if (!res.ok) {
    let message = `Request failed with status ${res.status}.`;
    let code = `HTTP_${res.status}`;
    try {
      const body = (await res.json()) as ApiErrorEnvelope;
      if (body?.error?.message) {
        message = body.error.message;
        if (body.error.code) code = body.error.code;
      }
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new ApiError(message, code, res.status);
  }
  return (await res.json()) as T;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// ---------------------------------------------------------------------------
// 1. Citizens & session management
// ---------------------------------------------------------------------------

export function createCitizen(): Promise<CreateCitizenResponse> {
  return request<CreateCitizenResponse>("/api/citizens/", { method: "POST" });
}

export function getProfile(citizenId: string): Promise<CitizenProfile> {
  return request<CitizenProfile>(`/api/citizens/${citizenId}/profile/`);
}

export function updateProfile(
  citizenId: string,
  partial: CitizenProfileInput
): Promise<CitizenProfile> {
  return request<CitizenProfile>(
    `/api/citizens/${citizenId}/profile/`,
    jsonInit("PATCH", partial)
  );
}

// ---------------------------------------------------------------------------
// 2. Schemes
// ---------------------------------------------------------------------------

export function listSchemes(): Promise<Scheme[]> {
  return request<Scheme[]>("/api/schemes/");
}

export function getScheme(code: string): Promise<SchemeDetail> {
  return request<SchemeDetail>(`/api/schemes/${code}/`);
}

// ---------------------------------------------------------------------------
// 3. Eligibility
// ---------------------------------------------------------------------------

export function evaluate(citizenId: string): Promise<EvaluateResponse> {
  return request<EvaluateResponse>(
    "/api/eligibility/evaluate/",
    jsonInit("POST", { citizen_id: citizenId })
  );
}

export function getResults(citizenId: string): Promise<EligibilityResult[]> {
  return request<EligibilityResult[]>(`/api/eligibility/results/${citizenId}/`);
}

// ---------------------------------------------------------------------------
// 4. AI explanation & assistance
// ---------------------------------------------------------------------------

export function explain(
  resultId: number,
  language: ExplainLanguage = "en"
): Promise<ExplainResponse> {
  return request<ExplainResponse>(
    "/api/explain/",
    jsonInit("POST", { eligibility_result_id: resultId, language })
  );
}

export function askKnowledge(
  question: string,
  schemeCode?: string
): Promise<KnowledgeAnswer> {
  return request<KnowledgeAnswer>(
    "/api/knowledge/ask/",
    jsonInit("POST", schemeCode ? { question, scheme_code: schemeCode } : { question })
  );
}

// ---------------------------------------------------------------------------
// 5. Documents
// ---------------------------------------------------------------------------

export function uploadDocument(
  citizenId: string,
  docType: DocType,
  file: File
): Promise<UploadedDocument> {
  const form = new FormData();
  form.append("file", file);
  form.append("doc_type", docType);
  form.append("citizen_id", citizenId);
  return request<UploadedDocument>("/api/documents/upload/", {
    method: "POST",
    body: form,
  });
}

export function confirmDocument(
  documentId: number,
  confirmed: boolean,
  fields?: ExtractedFields
): Promise<ConfirmDocumentResponse> {
  const body: { confirmed: boolean; extracted_fields?: ExtractedFields } = {
    confirmed,
  };
  if (fields) body.extracted_fields = fields;
  return request<ConfirmDocumentResponse>(
    `/api/documents/${documentId}/confirm/`,
    jsonInit("POST", body)
  );
}

export function missingDocuments(
  citizenId: string,
  schemeCode: string
): Promise<MissingDocumentsResponse> {
  return request<MissingDocumentsResponse>(
    `/api/documents/missing/${citizenId}/${schemeCode}/`
  );
}

// ---------------------------------------------------------------------------
// 6. Certificates & verification
// ---------------------------------------------------------------------------

export function issueCertificate(resultId: number): Promise<IssuedCertificate> {
  return request<IssuedCertificate>(
    "/api/certificates/issue/",
    jsonInit("POST", { eligibility_result_id: resultId })
  );
}

export function getCertificate(id: number): Promise<Certificate> {
  return request<Certificate>(`/api/certificates/${id}/`);
}

export function verifyCertificate(hash: string): Promise<VerifyResult> {
  return request<VerifyResult>(
    `/api/certificates/verify/${encodeURIComponent(hash)}/`
  );
}
