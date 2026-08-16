"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User, ShieldCheck, CheckCircle2, Clock, XCircle,
  Plus, FileText, ArrowRight, ChevronRight, Building2,
  Landmark, X, Upload, Loader2, AlertTriangle,
} from "lucide-react";
import DigiLockerButton from "@/components/documents/DigiLockerButton";
import { useCitizen } from "@/context/CitizenProfileContext";
import {
  uploadDocument, confirmDocument,
  DocType, DocumentUploadResponse, ApiError,
} from "@/lib/api";

/* ─────────────── TYPES ─────────────── */

interface DocumentRecord {
  id: number;
  type: string;
  issuer: string;
  expires: string;
  status: "verified" | "pending" | "expired";
  source?: "manual" | "digilocker";
  extractedFields?: Record<string, string | number | boolean | null>;
  needsConfirm?: boolean;
}

/* ─────────────── STATUS BADGE ─────────────── */

function StatusBadge({ status }: { status: string }) {
  if (status === "verified")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
        <Clock className="w-3.5 h-3.5" /> Pending Confirmation
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
      <XCircle className="w-3.5 h-3.5" /> Expired
    </span>
  );
}

function DigiLockerBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-sm ml-2 align-middle"
      style={{ background: "#EEF3FF", color: "#0B3CC8", border: "1px solid rgba(11,60,200,0.18)" }}
    >
      DigiLocker ↗
    </span>
  );
}

/* ─────────────── UPLOAD MODAL ─────────────── */

const DOC_TYPE_OPTIONS: { id: DocType; label: string }[] = [
  { id: "aadhaar_card", label: "Aadhaar Card" },
  { id: "pan_card", label: "PAN Card" },
  { id: "income_certificate", label: "Income Certificate" },
  { id: "land_ownership_document", label: "Land Ownership Document (7/12)" },
  { id: "ration_card", label: "Ration Card" },
  { id: "bpl_ration_card", label: "BPL Ration Card" },
  { id: "bank_passbook", label: "Bank Passbook" },
  { id: "student_id", label: "Student ID" },
  { id: "mark_sheet", label: "Mark Sheet" },
  { id: "trade_certificate", label: "Trade Certificate" },
  { id: "birth_certificate", label: "Birth Certificate" },
  { id: "domicile_certificate", label: "Domicile Certificate" },
];

interface UploadModalProps {
  citizenId: string;
  onClose: () => void;
  onUploaded: (doc: DocumentUploadResponse) => void;
}

function UploadModal({ citizenId, onClose, onUploaded }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>("aadhaar_card");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadDocument(file, docType, citizenId);
      onUploaded(result);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-sm border border-[#E2E8F0] w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-[#64748B]">Add Document</p>
            <h3 className="text-base font-bold text-[#0F172A]">Upload a Credential</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F1F5F9] text-[#64748B] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="flex items-start gap-2 text-[12px] text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-sm px-3.5 py-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Document type */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wider mb-2">
              Document Type
            </label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value as DocType)}
              className="w-full border border-[#E2E8F0] rounded-sm px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#0B3CC8] transition-colors"
            >
              {DOC_TYPE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>

          {/* Drop zone */}
          <div className="border-2 border-dashed border-[#E2E8F0] rounded-sm p-6 text-center">
            <div className="w-10 h-10 bg-[#F1F5F9] rounded-sm flex items-center justify-center mx-auto mb-3">
              <Upload className="w-5 h-5 text-[#64748B]" />
            </div>
            <p className="text-sm font-semibold text-[#0F172A] mb-1">
              {file ? file.name : "Choose a file to upload"}
            </p>
            <p className="text-[12px] text-[#64748B] mb-4">JPEG, PNG or WEBP · Max 10 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
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
              {file && (
                <button
                  id="upload-scan-btn"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-sm text-white transition-all disabled:opacity-60"
                  style={{ background: "#0B3CC8" }}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {uploading ? "Scanning…" : "Upload & Scan"}
                </button>
              )}
            </div>
          </div>

          {/* DigiLocker */}
          <DigiLockerButton citizenId={citizenId} docTypes={["aadhaar_card", "pan_card"]} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────── CONFIRM MODAL ─────────────── */

interface ConfirmModalProps {
  doc: DocumentUploadResponse;
  citizenId: string;
  onConfirmed: (documentId: number) => void;
  onClose: () => void;
}

function ConfirmModal({ doc, citizenId, onConfirmed, onClose }: ConfirmModalProps) {
  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(doc.extracted_fields ?? {}).map(([k, v]) => [k, String(v ?? "")])
    )
  );
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      await confirmDocument(doc.document_id, citizenId, fields);
      onConfirmed(doc.document_id);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Confirmation failed.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-sm border border-[#E2E8F0] w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-[#64748B]">Review Extraction</p>
            <h3 className="text-base font-bold text-[#0F172A]">Confirm Document Fields</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F1F5F9] text-[#64748B]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {doc.is_blurry && (
            <div className="flex items-start gap-2 text-[12px] text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-sm px-3.5 py-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>This image is blurry. Extraction may be inaccurate — please review carefully before confirming.</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-[12px] text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-sm px-3.5 py-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-[13px] text-[#64748B] mb-4 leading-relaxed">
            Gemini Vision extracted the following fields. Correct any errors, then confirm to add this document to your profile.
          </p>

          {Object.keys(fields).length === 0 ? (
            <p className="text-[13px] text-[#64748B] italic mb-4">No fields were extracted (doc type may not support OCR). Confirm to record the document.</p>
          ) : (
            <div className="space-y-3 mb-5">
              {Object.entries(fields).map(([key, val]) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                    {key.replace(/_/g, " ")}
                  </label>
                  <input
                    type="text"
                    value={val}
                    onChange={e => setFields(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border border-[#E2E8F0] rounded-sm px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#0B3CC8] transition-colors font-mono"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-[#E2E8F0] text-[#475569] font-semibold py-2.5 rounded-sm text-sm hover:bg-[#F8FAFC] transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-document-btn"
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 flex items-center justify-center gap-2 text-white font-semibold py-2.5 rounded-sm text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: "#0B3CC8" }}
            >
              {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {confirming ? "Confirming…" : "Confirm & Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── PAGE INNER ─────────────── */

function DocumentStatusInner() {
  const searchParams = useSearchParams();
  const { citizenId } = useCitizen();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [pendingUpload, setPendingUpload] = useState<DocumentUploadResponse | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  /* Handle ?digilocker=success on page load */
  useEffect(() => {
    const dlStatus = searchParams.get("digilocker");
    if (dlStatus === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      setSuccessBanner("DigiLocker connected! You can now upload documents manually or use DigiLocker to fetch them.");
      setTimeout(() => setSuccessBanner(null), 7000);
    }
    if (dlStatus === "error") {
      window.history.replaceState({}, "", window.location.pathname);
      setErrorBanner("DigiLocker connection failed. Please try again or upload documents manually.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleUploaded(doc: DocumentUploadResponse) {
    // Add as pending confirmation
    const record: DocumentRecord = {
      id: doc.document_id,
      type: doc.doc_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      issuer: "Uploaded · Pending confirmation",
      expires: doc.expiry_date ?? (doc.expiry_status === "not_applicable" ? "Not applicable" : "—"),
      status: "pending",
      source: "manual",
      extractedFields: doc.extracted_fields,
      needsConfirm: true,
    };
    setDocuments(prev => [record, ...prev]);
    setPendingUpload(doc);
    setSuccessBanner(`Document uploaded — Gemini extracted fields. Please confirm them.`);
    setTimeout(() => setSuccessBanner(null), 8000);
  }

  function handleConfirmed(documentId: number) {
    setDocuments(prev =>
      prev.map(d =>
        d.id === documentId
          ? { ...d, status: "verified", issuer: "Confirmed via Entitle", needsConfirm: false }
          : d
      )
    );
    setPendingUpload(null);
    setSuccessBanner("Document confirmed and added to your profile!");
    setTimeout(() => setSuccessBanner(null), 5000);
  }

  const verified = documents.filter(d => d.status === "verified").length;
  const pending  = documents.filter(d => d.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-open-sans), sans-serif", background: "#F3F4F6" }}>
      {/* Tricolor bar */}
      <div className="flex h-[5px] w-full">
        <div className="flex-1" style={{ background: "#FF9933" }} />
        <div className="flex-1" style={{ background: "#FFFFFF", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }} />
        <div className="flex-1" style={{ background: "#138808" }} />
      </div>

      {/* Utility bar */}
      <div className="text-[11.5px] font-medium py-2 px-6" style={{ background: "#1C1C1C", color: "#A0A0A0" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="#main" className="hover:text-white transition-colors">Skip to content</a>
            <span className="text-[#3A3A3A]">|</span>
            <span>A public-interest service. Not a Government of India portal.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Helpline <strong className="text-white">1800-11-0001</strong></span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-11 h-11 border-2 flex items-center justify-center font-bold text-xl" style={{ borderColor: "#0B3CC8", color: "#0B3CC8" }}>E</div>
            <div>
              <div className="text-xl font-bold tracking-tight" style={{ color: "#0B3CC8" }}>ENTITLE</div>
              <div className="text-[11px] text-[#64748B] mt-0.5 font-medium">Welfare Entitlement Assistance · Citizen Services</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF" }}>
              <User className="w-5 h-5" style={{ color: "#0B3CC8" }} />
            </div>
            <div className="text-sm font-semibold text-[#0F172A]">
              {citizenId ? `ENT-${citizenId.slice(0, 8).toUpperCase()}` : "No session"}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 flex items-center">
          <nav className="flex items-center">
            {[
              ["Overview", "/", false],
              ["My Profile", "/profile", false],
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

        {/* Banners */}
        {successBanner && (
          <div className="flex items-center gap-3 mb-6 px-5 py-3.5 rounded-sm border text-sm font-medium bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="flex-1">{successBanner}</span>
            <button onClick={() => setSuccessBanner(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {errorBanner && (
          <div className="flex items-center gap-3 mb-6 px-5 py-3.5 rounded-sm border text-sm font-medium bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* No session */}
        {!citizenId && (
          <div className="bg-white border border-[#E2E8F0] rounded-sm p-12 flex flex-col items-center gap-4 text-center mb-8">
            <ShieldCheck className="w-12 h-12" style={{ color: "#0B3CC8" }} />
            <p className="text-lg font-semibold text-[#0F172A]">Start your assessment first</p>
            <p className="text-[#64748B] text-sm max-w-sm">Complete the eligibility questionnaire to get a citizen session before uploading documents.</p>
            <Link href="/assistant">
              <button className="mt-2 px-6 py-3 text-white font-semibold rounded text-sm" style={{ background: "#0B3CC8" }}>Start Assessment</button>
            </Link>
          </div>
        )}

        {/* Title + Upload button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <div className="text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: "#E8620A" }}>Credential Wallet</div>
            <h1 className="text-[2.1rem] font-bold text-[#0F172A]" style={{ letterSpacing: "-0.03em" }}>My Verified Documents</h1>
            <p className="text-[#64748B] text-[14px] mt-1.5">Upload, confirm and manage government documents linked to your profile.</p>
          </div>
          {citizenId && (
            <button
              id="upload-document-btn"
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity text-sm shadow-sm"
              style={{ background: "#0B3CC8" }}
            >
              <Plus className="w-4 h-4" /> Upload Document
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { icon: CheckCircle2, n: verified, label: "Verified", border: "border-[#A7F3D0]", bg: "bg-[#ECFDF5]", text: "text-[#065F46]" },
            { icon: Clock,        n: pending,  label: "Pending Confirmation", border: "border-[#FDE68A]", bg: "bg-[#FFFBEB]", text: "text-[#92400E]" },
            { icon: ShieldCheck,  n: documents.length, label: "Total on record", border: "border-[#E2E8F0]", bg: "bg-white", text: "text-[#0F172A]" },
          ].map(({ icon: Icon, n, label, border, bg, text }) => (
            <div key={label} className={`border ${border} ${bg} rounded-sm p-6 flex items-center gap-5 shadow-sm`}>
              <div className={`w-14 h-14 bg-white rounded flex items-center justify-center border ${border} shrink-0`}>
                <Icon className={`w-6 h-6 ${text}`} />
              </div>
              <div>
                <div className={`text-[2.5rem] font-bold tracking-tight leading-none ${text}`}>{n}</div>
                <div className={`text-[11px] font-semibold uppercase tracking-wider mt-2 opacity-80 ${text}`}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Document table */}
        <div className="bg-white border border-[#E2E8F0] rounded-sm overflow-hidden mb-10 shadow-sm">
          <div className="px-8 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-0.5">Document Registry</p>
              <h2 className="text-lg font-bold text-[#0F172A]">
                {documents.length === 0 ? "No documents uploaded yet" : `${documents.length} File${documents.length !== 1 ? "s" : ""} on Record`}
              </h2>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="px-8 py-16 flex flex-col items-center gap-3 text-center">
              <FileText className="w-10 h-10 text-[#CBD5E1]" />
              <p className="text-[#64748B] font-medium">No documents yet</p>
              <p className="text-[13px] text-[#94A3B8]">Upload your first document using the button above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-8 py-3 text-left">Document</th>
                    <th className="px-6 py-3 text-left">Issuing Authority</th>
                    <th className="px-6 py-3 text-left">Expiry</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
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
                            <div className="text-[11px] text-[#64748B] mt-0.5">ID #{doc.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-[12.5px] text-[#64748B]">{doc.issuer}</td>
                      <td className="px-6 py-5 text-[13px] font-semibold text-[#475569]">{doc.expires}</td>
                      <td className="px-6 py-5"><StatusBadge status={doc.status} /></td>
                      <td className="px-6 py-5 text-right">
                        {doc.needsConfirm && pendingUpload?.document_id === doc.id ? (
                          <button
                            onClick={() => setPendingUpload(pendingUpload)}
                            className="flex items-center gap-1 text-[12.5px] font-semibold ml-auto hover:underline"
                            style={{ color: "#D97706" }}
                          >
                            Review & Confirm <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[12px] text-[#94A3B8]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Verification Network */}
        <div className="bg-white border border-[#E2E8F0] rounded-sm shadow-sm p-8 md:p-10">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-2">Immutable Architecture</p>
          <h3 className="font-bold text-[#0F172A] text-xl mb-3">Verification Network</h3>
          <p className="text-[#64748B] text-sm mb-10 max-w-2xl">
            How your documents flow through the Entitle immutable registry to reach government authorities securely, without central storage.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {[
              { label: "Government Issuer",   sub: "Issues certificates & records", Icon: Building2,  highlight: false },
              { label: "Entitle Registry",    sub: "Stores Secure Hash · Polygon",  Icon: ShieldCheck, highlight: true  },
              { label: "Welfare Department",  sub: "Verifies without raw upload",   Icon: Landmark,   highlight: false },
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

      <footer className="border-t border-[#E2E8F0] bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <p className="text-[12px] text-[#94A3B8]">© 2026 Entitle Project — An independent welfare access initiative. Not affiliated with the Government of India.</p>
        </div>
      </footer>

      {/* Upload Modal */}
      {uploadModalOpen && citizenId && (
        <UploadModal
          citizenId={citizenId}
          onClose={() => setUploadModalOpen(false)}
          onUploaded={handleUploaded}
        />
      )}

      {/* Confirm Modal — auto-opens when a new upload has extracted fields */}
      {pendingUpload && citizenId && (
        <ConfirmModal
          doc={pendingUpload}
          citizenId={citizenId}
          onConfirmed={handleConfirmed}
          onClose={() => setPendingUpload(null)}
        />
      )}
    </div>
  );
}

/* ─────────────── EXPORT ─────────────── */
export default function DocumentStatus() {
  return (
    <Suspense>
      <DocumentStatusInner />
    </Suspense>
  );
}
