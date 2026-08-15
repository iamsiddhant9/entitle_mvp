"use client";

import { useState } from "react";
import {
  getDigiLockerAuthUrl,
  DIGILOCKER_DOC_TYPES,
  type DigiLockerDocType,
} from "@/lib/digilocker";

interface DigiLockerButtonProps {
  citizenId: string;
  /** Defaults to ["aadhaar_card", "pan_card"] if not provided */
  docTypes?: DigiLockerDocType[];
  /** Extra wrapper class */
  className?: string;
}

export default function DigiLockerButton({
  citizenId,
  docTypes = ["aadhaar_card", "pan_card"],
  className,
}: DigiLockerButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedDocLabels = DIGILOCKER_DOC_TYPES.filter((d) =>
    docTypes.includes(d.id)
  ).map((d) => d.label);

  async function handleConnect() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const { auth_url } = await getDigiLockerAuthUrl(citizenId, docTypes);
      window.location.href = auth_url;
      // page navigates away — no need to reset status
    } catch (err) {
      console.error(err);
      setErrorMsg(
        "Could not reach DigiLocker. Please upload your document manually."
      );
      setStatus("error");
    }
  }

  return (
    <div className={className}>
      {/* ── OR divider ── */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#E2E8F0]" />
        <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest">
          or
        </span>
        <div className="flex-1 h-px bg-[#E2E8F0]" />
      </div>

      {/* ── DigiLocker panel ── */}
      <div className="border border-[#E2E8F0] rounded-sm">
        {/* Header strip */}
        <div className="flex items-start gap-4 p-5 border-b border-[#E2E8F0]">
          {/* DigiLocker "D" logomark */}
          <div
            className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0 select-none"
            style={{ background: "#0B3CC8" }}
          >
            <span
              className="text-white font-bold text-lg leading-none"
              style={{ fontFamily: "var(--font-open-sans)" }}
            >
              D
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-bold text-[#0F172A] text-sm">
                Fetch from DigiLocker
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
                style={{ background: "#EEF3FF", color: "#0B3CC8" }}
              >
                Govt. of India
              </span>
            </div>
            <p className="text-[12px] text-[#64748B] leading-relaxed">
              Pull government-verified documents directly from your DigiLocker
              account — no photo or scan required.
            </p>
          </div>
        </div>

        {/* Doc type chips */}
        <div className="px-5 py-3.5 flex items-center gap-2 flex-wrap border-b border-[#E2E8F0]">
          <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mr-1">
            Will fetch:
          </span>
          {selectedDocLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded"
              style={{
                background: "#EEF3FF",
                color: "#0B3CC8",
                border: "1px solid rgba(11,60,200,0.18)",
              }}
            >
              {label}
            </span>
          ))}
          <span
            className="text-[10.5px] font-medium px-2 py-0.5 rounded"
            style={{
              background: "#F8FAFC",
              color: "#94A3B8",
              border: "1px solid #E2E8F0",
            }}
          >
            + more coming soon
          </span>
        </div>

        {/* Action area */}
        <div className="p-5">
          {status === "error" && errorMsg && (
            <div className="flex items-start gap-2 text-[12px] text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-sm px-3.5 py-2.5 mb-3">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            id="digilocker-connect-btn"
            onClick={handleConnect}
            disabled={status === "loading"}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#0B3CC8", color: "white" }}
          >
            {status === "loading" ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Connecting to DigiLocker…
              </>
            ) : (
              "Connect DigiLocker →"
            )}
          </button>

          <p className="text-[10.5px] text-[#94A3B8] mt-2.5 text-center leading-relaxed">
            Consent-based. Your DigiLocker token is used once and never stored
            on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
