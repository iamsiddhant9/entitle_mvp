/**
 * digilocker.ts
 * Typed fetch wrappers for the three DigiLocker backend endpoints.
 *
 * ⚠️  The backend must be running and DIGILOCKER_* env vars set before
 *     these calls succeed. In development, the backend will return sandbox
 *     responses from Setu / API Setu.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/* ── Shared response types ── */

export interface DigiLockerAuthUrlResponse {
  /** Full DigiLocker OAuth 2.0 redirect URL. Redirect the user to this. */
  auth_url: string;
}

export interface DocumentUploadResponse {
  document_id: number;
  doc_type: string;
  /** "digilocker" when fetched via OAuth; "manual" for camera/file uploads */
  source: "digilocker" | "manual";
  extracted_fields: Record<string, string>;
  is_blurry: boolean;
  is_expired: boolean;
}

/* ── Supported document types (MVP: Aadhaar + PAN only) ── */

export const DIGILOCKER_DOC_TYPES = [
  { id: "aadhaar_card", label: "Aadhaar Card",  uri: "in.gov.uidai.aadhaar-reg" },
  { id: "pan_card",     label: "PAN Card",       uri: "in.gov.cbdt.pan" },
] as const;

export type DigiLockerDocType =
  (typeof DIGILOCKER_DOC_TYPES)[number]["id"];

/* ── API calls ── */

/**
 * GET /api/documents/digilocker/auth-url/
 *
 * Builds the DigiLocker OAuth redirect URL.
 * citizen_id is forwarded as OAuth `state` so the callback can correlate it.
 */
export async function getDigiLockerAuthUrl(
  citizenId: string,
  docTypes: DigiLockerDocType[] = ["aadhaar_card", "pan_card"]
): Promise<DigiLockerAuthUrlResponse> {
  const params = new URLSearchParams({
    citizen_id: citizenId,
    doc_types: docTypes.join(","),
  });

  const res = await fetch(
    `${API_BASE}/api/documents/digilocker/auth-url/?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error(
      `DigiLocker auth-url failed (${res.status}): ${await res.text()}`
    );
  }

  return res.json() as Promise<DigiLockerAuthUrlResponse>;
}

/**
 * POST /api/documents/digilocker/fetch/
 *
 * Instructs backend to:
 *  1. Retrieve the short-lived access_token from Django cache.
 *  2. Call DigiLocker to fetch the raw document bytes.
 *  3. Pipe bytes through the existing OCR pipeline.
 *  4. Return the same shape as POST /api/documents/upload/.
 *
 * ⚠️  Must be called after the OAuth callback has completed
 *     (i.e., ?digilocker=success is present in the URL).
 */
export async function fetchDigiLockerDocument(
  citizenId: string,
  docType: DigiLockerDocType
): Promise<DocumentUploadResponse> {
  const res = await fetch(`${API_BASE}/api/documents/digilocker/fetch/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ citizen_id: citizenId, doc_type: docType }),
  });

  if (!res.ok) {
    throw new Error(
      `DigiLocker fetch failed (${res.status}): ${await res.text()}`
    );
  }

  return res.json() as Promise<DocumentUploadResponse>;
}
