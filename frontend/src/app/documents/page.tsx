"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  FileText,
  ArrowRight,
  ChevronRight,
  Building2,
  Landmark,
  X,
  Upload,
} from "lucide-react";
import DigiLockerButton from "@/components/documents/DigiLockerButton";
import { fetchDigiLockerDocument, type DigiLockerDocType } from "@/lib/digilocker";

/* ─────────────── TYPES ─────────────── */

type DocSource = "manual" | "digilocker";

interface DocumentRecord {
  id: number;
  type: string;
  issuer: string;
  date: string;
  expires: string;
  status: "verified" | "pending" | "revoked";
  usedIn: string[];
  source?: DocSource;
}

/* ─────────────── MOCK DATA ─────────────── */

const CITIZEN_ID = "d3b07384-4cf2-4b7e-9b2e-1a2b3c4d5e6f"; // replace with real session value

const INITIAL_DOCUMENTS: DocumentRecord[] = [
  {
    id: 1,
    type: "Income Certificate",
    issuer: "Revenue Dept. Govt. of Maharashtra",
    date: "12 Oct 2024",
    expires: "12 Oct 2027",
    status: "verified",
    usedIn: ["PM KISAN", "PMAY-G"],
    source: "manual",
  },
  {
    id: 2,
    type: "Aadhaar / Citizen Identity",
    issuer: "UIDAI – Unique Identification Authority of India",
    date: "05 Jan 2018",
    expires: "Lifetime",
    status: "verified",
    usedIn: ["All Schemes"],
    source: "digilocker", // fetched via DigiLocker OAuth
  },
  {
    id: 3,
    type: "Land Ownership Record (7/12)",
    issuer: "Revenue Dept. Govt. of Maharashtra",
    date: "15 Mar 2026",
    expires: "15 Mar 2027",
    status: "verified",
    usedIn: ["PM KISAN", "PM FBY"],
    source: "manual",
  },
  {
    id: 4,
    type: "Caste Certificate (OBC)",
    issuer: "Social Welfare Dept. Govt. of Maharashtra",
    date: "–",
    expires: "Pending",
    status: "pending",
    usedIn: ["PM FBY"],
  },
  {
    id: 5,
    type: "12th Marksheet / Student ID",
    issuer: "Maharashtra State Board of Education",
    date: "10 Aug 2023",
    expires: "Expired",
    status: "revoked",
    usedIn: [],
  },
];

/* ─────────────── STATUS BADGE ─────────────── */

function StatusBadge({ status }: { status: string }) {
  if (status === "verified")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Verified
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
        <Clock className="w-3.5 h-3.5" />
        Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
      <XCircle className="w-3.5 h-3.5" />
      Revoked
    </span>
  );
}

/* ─────────────── SOURCE BADGE ─────────────── */

function DigiLockerBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-sm ml-2 align-middle"
      style={{
        background: "#EEF3FF",
        color: "#0B3CC8",
        border: "1px solid rgba(11,60,200,0.18)",
      }}
      title="Fetched via DigiLocker"
    >
      DigiLocker ↗
    </span>
  );
}

/* ─────────────── UPLOAD MODAL ─────────────── */

interface UploadModalProps {
  onClose: () => void;
  onDigiLockerFetchComplete: (docType: DigiLockerDocType) => void;
  digiLockerPending: boolean;
}

function UploadModal({ onClose, onDigiLockerFetchComplete, digiLockerPending }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  }

  function handleManualUpload() {
    setUploading(true);
    // TODO: wire to POST /api/documents/upload/
    setTimeout(() => {
      setUploading(false);
      onClose();
    }, 1800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-sm border border-[#E2E8F0] w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-[#64748B]">
              Add Document
            </p>
            <h3 className="text-base font-bold text-[#0F172A]">Upload a Credential</h3>
          </div>
          <button
            id="upload-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F1F5F9] text-[#64748B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* DigiLocker pending notice */}
          {digiLockerPending && (
            <div className="flex items-start gap-2 text-[12px] bg-[#FFFBEB] border border-[#FDE68A] rounded-sm px-3.5 py-2.5 mb-4">
              <Clock className="w-4 h-4 text-[#92400E] shrink-0 mt-0.5" />
              <span className="text-[#92400E]">
                DigiLocker connected. Tap &ldquo;Connect DigiLocker&rdquo; again to pull your documents.
              </span>
            </div>
          )}

          {/* Manual upload zone */}
          <div className="border-2 border-dashed border-[#E2E8F0] rounded-sm p-6 text-center">
            <div className="w-10 h-10 bg-[#F1F5F9] rounded-sm flex items-center justify-center mx-auto mb-3">
              <Upload className="w-5 h-5 text-[#64748B]" />
            </div>
            <p className="text-sm font-semibold text-[#0F172A] mb-1">
              {fileName ? fileName : "Choose a file to upload"}
            </p>
            <p className="text-[12px] text-[#64748B] mb-4">
              PDF, JPG or PNG · Max 10 MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="doc-file-input"
              onChange={handleFileChange}
            />
            <div className="flex gap-2 justify-center">
              <button
                id="choose-file-btn"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold px-4 py-2 border border-[#E2E8F0] rounded-sm text-[#475569] hover:bg-[#F8FAFC] transition-colors"
              >
                Choose File
              </button>
              {fileName && (
                <button
                  id="upload-scan-btn"
                  onClick={handleManualUpload}
                  disabled={uploading}
                  className="text-sm font-semibold px-4 py-2 rounded-sm text-white transition-all disabled:opacity-60"
                  style={{ background: "#0B3CC8" }}
                >
                  {uploading ? "Scanning…" : "Upload & Scan"}
                </button>
              )}
            </div>
          </div>

          {/* DigiLocker button */}
          <DigiLockerButton
            citizenId={CITIZEN_ID}
            docTypes={["aadhaar_card", "pan_card"]}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────── PAGE ─────────────── */

export default function DocumentStatus() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<DocumentRecord[]>(INITIAL_DOCUMENTS);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [digiLockerPending, setDigiLockerPending] = useState(false);

  /* ── Handle ?digilocker=success on page load ── */
  useEffect(() => {
    const dlStatus  = searchParams.get("digilocker");
    const citizenId = searchParams.get("citizen_id");

    if (dlStatus !== "success" || !citizenId) return;

    // Clean URL without reload
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);

    setDigiLockerPending(true);
    setFetchingDocs(true);
    setSuccessBanner("DigiLocker connected. Fetching your documents…");

    // Fetch Aadhaar + PAN sequentially via the backend
    const DOC_TYPES: DigiLockerDocType[] = ["aadhaar_card", "pan_card"];

    (async () => {
      const fetched: DocumentRecord[] = [];
      for (const docType of DOC_TYPES) {
        try {
          const result = await fetchDigiLockerDocument(citizenId, docType);
          fetched.push({
            id: Date.now() + Math.random(),
            type:
              docType === "aadhaar_card"
                ? "Aadhaar / Citizen Identity"
                : "PAN Card",
            issuer:
              docType === "aadhaar_card"
                ? "UIDAI – Unique Identification Authority of India"
                : "Income Tax Dept. — CBDT",
            date: new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            expires: docType === "aadhaar_card" ? "Lifetime" : "Lifetime",
            status: "verified",
            usedIn:
              docType === "aadhaar_card" ? ["All Schemes"] : ["PM KISAN"],
            source: "digilocker",
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          // If already exists or fetch fails — silently skip for MVP
        }
      }

      if (fetched.length > 0) {
        // Merge: avoid duplicates by doc type label
        setDocuments((prev) => {
          const existingLabels = new Set(prev.map((d) => d.type));
          const newDocs = fetched.filter((d) => !existingLabels.has(d.type));
          return [...prev, ...newDocs];
        });
        setSuccessBanner(
          `✓ ${fetched.length} document${fetched.length > 1 ? "s" : ""} imported from DigiLocker successfully.`
        );
      } else {
        setSuccessBanner(
          "DigiLocker connected, but no new documents were imported."
        );
      }

      setFetchingDocs(false);
      setDigiLockerPending(false);

      // Auto-dismiss banner after 6 s
      setTimeout(() => setSuccessBanner(null), 6000);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verified = documents.filter((d) => d.status === "verified").length;
  const pending  = documents.filter((d) => d.status === "pending").length;
  const revoked  = documents.filter((d) => d.status === "revoked").length;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "var(--font-open-sans), sans-serif", background: "#F3F4F6" }}
    >
      {/* ── Tricolor bar ── */}
      <div className="flex h-[5px] w-full">
        <div className="flex-1" style={{ background: "#FF9933" }} />
        <div className="flex-1" style={{ background: "#FFFFFF", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }} />
        <div className="flex-1" style={{ background: "#138808" }} />
      </div>

      {/* ── Utility bar ── */}
      <div className="text-[11.5px] font-medium py-2 px-6" style={{ background: "#1C1C1C", color: "#A0A0A0" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="#main" className="hover:text-white transition-colors">Skip to content</a>
            <span className="text-[#3A3A3A]">|</span>
            <span>A public-interest service. Not a Government of India portal.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Helpline <strong className="text-white">1800-11-0001</strong></span>
            <span className="text-[#3A3A3A]">|</span>
            <div className="flex items-center gap-2">
              <button className="hover:text-white transition-colors text-xs">A-</button>
              <button className="text-white font-bold text-sm">A</button>
              <button className="hover:text-white transition-colors text-sm font-bold">A+</button>
            </div>
            <span className="text-[#3A3A3A]">|</span>
            <button className="hover:text-white transition-colors">English</button>
          </div>
        </div>
      </div>

      {/* ── Main Header ── */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-11 h-11 border-2 flex items-center justify-center font-bold text-xl" style={{ borderColor: "#0B3CC8", color: "#0B3CC8", fontFamily: "var(--font-open-sans)" }}>
              E
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight" style={{ color: "#0B3CC8", fontFamily: "var(--font-open-sans)" }}>
                ENTITLE
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5 font-medium">
                Welfare Entitlement Assistance · Citizen Services
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-8">
            <div className="text-right hidden md:block">
              <div className="text-[11px] text-[#64748B] font-medium">Citizen reference</div>
              <div className="font-bold text-[#0F172A] text-sm tracking-wide mt-0.5">ENT-2026-MH-04871</div>
            </div>
            <div className="w-px h-10 bg-[#E2E8F0] hidden md:block" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF" }}>
                <User className="w-5 h-5" style={{ color: "#0B3CC8" }} />
              </div>
              <div>
                <div className="font-semibold text-[#0F172A] text-sm group-hover:text-[#0B3CC8] transition-colors">Kavita Deshmukh</div>
                <div className="text-[11px] text-[#64748B]">Wardha, Maharashtra</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Navigation ── */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <nav className="flex items-center">
            {[
              ["Overview", "/", false],
              ["My determination", "/dashboard", false],
              ["Schemes directory", "/schemes", false],
              ["Documents", "/documents", true],
              ["Help", "/help", false],
            ].map(([n, h, active]) => (
              <Link
                key={n as string}
                href={h as string}
                className={`relative px-4 py-4 text-sm font-medium transition-colors ${active ? "text-[#0B3CC8]" : "text-[#475569] hover:text-[#0B3CC8]"}`}
              >
                {n}
                {active && <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "#0B3CC8" }} />}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <main id="main" className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">

        {/* ── DigiLocker success / fetch banner ── */}
        {successBanner && (
          <div
            className="flex items-center gap-3 mb-6 px-5 py-3.5 rounded-sm border text-sm font-medium"
            style={{
              background: fetchingDocs ? "#FFFBEB" : "#ECFDF5",
              borderColor: fetchingDocs ? "#FDE68A" : "#A7F3D0",
              color: fetchingDocs ? "#92400E" : "#065F46",
            }}
          >
            {fetchingDocs ? (
              <svg className="animate-spin w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span className="flex-1">{successBanner}</span>
            <button onClick={() => setSuccessBanner(null)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Title row ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <div className="text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: "#E8620A" }}>
              Credential Wallet
            </div>
            <h1 className="text-[2.1rem] font-bold text-[#0F172A]" style={{ letterSpacing: "-0.03em" }}>
              My Verified Documents
            </h1>
            <p className="text-[#64748B] text-[14px] mt-1.5">
              Cross-department credentials verified by government authorities.
            </p>
          </div>
          <button
            id="upload-document-btn"
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity text-sm shadow-brand"
            style={{ background: "#0B3CC8" }}
          >
            <Plus className="w-4 h-4" /> Upload Document
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { icon: CheckCircle2, n: verified, label: "Verified",          border: "border-[#A7F3D0]", bg: "bg-[#ECFDF5]", iconBg: "bg-white", text: "text-[#065F46]" },
            { icon: Clock,        n: pending,  label: "Pending",           border: "border-[#FDE68A]", bg: "bg-[#FFFBEB]", iconBg: "bg-white", text: "text-[#92400E]" },
            { icon: XCircle,      n: revoked,  label: "Revoked / Expired", border: "border-[#FECACA]", bg: "bg-[#FEF2F2]", iconBg: "bg-white", text: "text-[#991B1B]" },
          ].map(({ icon: Icon, n, label, border, bg, iconBg, text }) => (
            <div key={label} className={`border ${border} ${bg} rounded-sm p-6 flex items-center gap-5 shadow-sm`}>
              <div className={`w-14 h-14 ${iconBg} rounded flex items-center justify-center border ${border} shrink-0`}>
                <Icon className={`w-6 h-6 ${text}`} />
              </div>
              <div>
                <div className={`text-[2.5rem] font-bold tracking-tight leading-none ${text}`}>{n}</div>
                <div className={`text-[11px] font-semibold uppercase tracking-wider mt-2 opacity-80 ${text}`}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Document table ── */}
        <div className="bg-white border border-[#E2E8F0] rounded-sm overflow-hidden mb-10 shadow-sm">
          <div className="px-8 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-0.5">
                Document Registry
              </p>
              <h2 className="text-lg font-bold text-[#0F172A]">
                {documents.length} Files on Record
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="px-8 py-3 text-left w-[260px]">Document</th>
                  <th className="px-6 py-3 text-left">Issuing Authority</th>
                  <th className="px-6 py-3 text-left">Expiry</th>
                  <th className="px-6 py-3 text-left">Used In Schemes</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className={`border-t border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors ${doc.status === "revoked" ? "bg-[#FEF2F2]/40" : ""}`}>
                    <td className="px-8 py-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-[#F1F5F9] rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-5 h-5 text-[#64748B]" strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="font-semibold text-[#0F172A] text-[14.5px] leading-snug">
                            {doc.type}
                            {doc.source === "digilocker" && <DigiLockerBadge />}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[12.5px] text-[#64748B] max-w-[200px] leading-relaxed">{doc.issuer}</td>
                    <td className="px-6 py-5 text-[13px] font-semibold text-[#475569]">{doc.expires}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {doc.usedIn.length > 0
                          ? doc.usedIn.map((s) => (
                              <span key={s} className="text-[10.5px] font-semibold bg-[#EEF3FF] border border-[#0B3CC8]/20 px-2 py-0.5 rounded text-[#0B3CC8]">{s}</span>
                            ))
                          : <span className="text-[11px] text-[#94A3B8] font-medium">None</span>
                        }
                      </div>
                    </td>
                    <td className="px-6 py-5"><StatusBadge status={doc.status} /></td>
                    <td className="px-6 py-5 text-right">
                      <button className="group flex items-center gap-1 text-[12.5px] font-semibold ml-auto hover:underline" style={{ color: "#0B3CC8" }}>
                        View file <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Verification Network Flow ── */}
        <div className="bg-white border border-[#E2E8F0] rounded-sm shadow-sm p-8 md:p-10">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-2">Immutable Architecture</p>
          <h3 className="font-bold text-[#0F172A] text-xl mb-3">Verification Network</h3>
          <p className="text-[#64748B] text-sm mb-10 max-w-2xl">
            How your documents flow through the Entitle immutable registry to reach government authorities securely, without central storage.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {[
              { label: "Revenue Dept.",    sub: "Issues Income Cert & 7/12",    Icon: Building2,  highlight: false },
              { label: "Entitle Registry", sub: "Stores Secure Hash · Polygon", Icon: ShieldCheck, highlight: true  },
              { label: "Welfare Dept.",    sub: "Verifies without raw upload",   Icon: Landmark,   highlight: false },
            ].map((node, i) => (
              <div key={i} className="flex items-center gap-6 w-full md:w-auto">
                <div className={`text-center p-6 rounded-sm border-2 w-full md:w-56 transition-all ${node.highlight ? "border-[#16A34A] bg-[#ECFDF5] shadow-sm" : "border-[#E2E8F0] bg-[#F8FAFC]"}`}>
                  <div className={`w-14 h-14 rounded flex items-center justify-center mx-auto mb-4 ${node.highlight ? "bg-[#D1FAE5]" : "bg-white border border-[#E2E8F0]"}`}>
                    <node.Icon className={`w-6 h-6 ${node.highlight ? "text-[#065F46]" : "text-[#64748B]"}`} strokeWidth={1.5} />
                  </div>
                  <div className={`font-bold text-[14.5px] mb-1 ${node.highlight ? "text-[#065F46]" : "text-[#0F172A]"}`}>{node.label}</div>
                  <div className={`text-[12px] leading-relaxed ${node.highlight ? "text-[#059669]" : "text-[#64748B]"}`}>{node.sub}</div>
                </div>
                {i < 2 && <ArrowRight className="w-6 h-6 text-[#CBD5E1] hidden md:block shrink-0" />}
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E2E8F0] bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <p className="text-[12px] text-[#94A3B8]">
            © 2026 Entitle Project — An independent welfare access initiative. Not affiliated with the Government of India.
          </p>
        </div>
      </footer>

      {/* ── Upload Modal ── */}
      {uploadModalOpen && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onDigiLockerFetchComplete={(docType) => {
            console.log("DigiLocker fetched:", docType);
          }}
          digiLockerPending={digiLockerPending}
        />
      )}
    </div>
  );
}
