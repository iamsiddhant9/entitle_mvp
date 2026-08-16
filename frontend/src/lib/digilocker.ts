/**
 * digilocker.ts
 * Typed wrappers for the DigiLocker OAuth flow.
 *
 * All calls go through the Django backend — the frontend never talks to
 * DigiLocker directly. Set NEXT_PUBLIC_API_URL in .env.local to point at
 * the backend (defaults to http://localhost:8000).
 *
 * Note: POST /api/documents/digilocker/fetch/ is not yet implemented on the
 * backend (returns 501). The OAuth redirect flow (auth-url → callback) is
 * fully functional when DIGILOCKER_* env vars are set in backend/.env.
 */

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

/* ── Shared response types ── */

export interface DigiLockerAuthUrlResponse {
  /** Full DigiLocker OAuth 2.0 redirect URL. Redirect the user here. */
  auth_url: string;
}

/* ── Supported document types ── */

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
 * Asks the backend to build the DigiLocker OAuth redirect URL.
 * citizen_id is forwarded as OAuth `state` so the callback can correlate it.
 *
 * When DIGILOCKER_CLIENT_ID is not configured on the backend, this will
 * throw — callers should catch and fall back to manual upload.
 */
export async function getDigiLockerAuthUrl(
  citizenId: string,
  docTypes: DigiLockerDocType[] = ["aadhaar_card", "pan_card"]
): Promise<DigiLockerAuthUrlResponse> {
  const params = new URLSearchParams({ citizen_id: citizenId });
  if (docTypes.length > 0) {
    params.set("doc_types", docTypes.join(","));
  }

  const res = await fetch(
    `${API_BASE}/api/documents/digilocker/auth-url/?${params.toString()}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    let message = `DigiLocker auth URL request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res.json() as Promise<DigiLockerAuthUrlResponse>;
}
