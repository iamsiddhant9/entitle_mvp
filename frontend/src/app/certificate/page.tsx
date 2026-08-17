"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  User, Download, Share2, CheckCircle2, Copy,
  ExternalLink, ShieldCheck, Loader2, X,
} from "lucide-react";
import { useCitizen } from "@/context/CitizenProfileContext";
import { getCertificate, listSchemes, CertificateDetail, SchemeListItem, ApiError } from "@/lib/api";

/* ─────────────── INNER ─────────────── */

function CertificateInner() {
  const searchParams = useSearchParams();
  const certId = searchParams.get("id");
  const { citizenId, eligibilityResults } = useCitizen();

  const [cert, setCert] = useState<CertificateDetail | null>(null);
  const [schemes, setSchemes] = useState<SchemeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    listSchemes().then(setSchemes).catch(() => {});
  }, []);

  useEffect(() => {
    if (!certId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getCertificate(Number(certId))
      .then(c => { setCert(c); setLoading(false); })
      .catch(e => {
        setError(e instanceof ApiError ? e.message : "Failed to load certificate.");
        setLoading(false);
      });
  }, [certId]);

  const schemeMap = Object.fromEntries(schemes.map(s => [s.code, s]));
  const eligibleSchemes = eligibilityResults.filter(r => r.status === "eligible");
  const displayRef = citizenId ? `ENT-${citizenId.slice(0, 8).toUpperCase()}` : "—";

  function copyHash() {
    if (cert?.eligibility_hash) {
      navigator.clipboard.writeText(cert.eligibility_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function getVerifyUrl() {
    if (cert?.explorer_url) return cert.explorer_url;
    if (cert?.qr_payload) return cert.qr_payload;
    return "#";
  }

  const issuedDate = cert?.issued_at ? new Date(cert.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

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
          <div className="flex items-center gap-8">
            <div className="text-right hidden md:block">
              <div className="text-[11px] text-[#64748B] font-medium">Citizen reference</div>
              <div className="font-bold text-[#0F172A] text-sm tracking-wide mt-0.5">{displayRef}</div>
            </div>
            <div className="w-px h-10 bg-[#E2E8F0] hidden md:block" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF" }}>
                <User className="w-5 h-5" style={{ color: "#0B3CC8" }} />
              </div>
              <div>
                <div className="font-semibold text-[#0F172A] text-sm">Anonymous Citizen</div>
                <div className="text-[11px] text-[#64748B]">Verified session</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 flex items-center">
          <nav className="flex items-center">
            {[["Overview", "/"], ["My determination", "/dashboard"], ["Schemes directory", "/schemes"], ["Documents", "/documents"]].map(([n, h]) => (
              <Link key={n} href={h} className="relative px-4 py-4 text-sm font-medium transition-colors text-[#475569] hover:text-[#0B3CC8]">{n}</Link>
            ))}
          </nav>
        </div>
      </div>

      <main id="main" className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: "#E8620A" }}>Eligibility Receipt</div>
            <h1 className="text-[1.9rem] font-bold text-[#0F172A]" style={{ letterSpacing: "-0.025em" }}>Certificate of Record</h1>
            {cert && (
              <p className="text-[#64748B] text-[13.5px] mt-2">Issued: {issuedDate} · Polygon Amoy Verified</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 border border-[#E2E8F0] text-[#475569] font-semibold px-5 py-2.5 rounded-sm hover:bg-white transition-colors text-sm shadow-sm bg-white"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={() => navigator.share?.({ title: "ENTITLE Certificate", url: window.location.href })}
              className="flex items-center gap-2 border font-semibold px-5 py-2.5 rounded-sm text-sm bg-white shadow-sm hover:bg-[#EEF3FF] transition-colors"
              style={{ color: "#0B3CC8", borderColor: "#0B3CC8" }}
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-sm border text-[12.5px] font-medium text-[#991B1B] bg-[#FEF2F2] border-[#FECACA]">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-[#E2E8F0] rounded-sm p-16 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#0B3CC8" }} />
            <p className="text-[#64748B] font-medium">Loading certificate from blockchain…</p>
          </div>
        )}

        {/* No cert ID — show prompt to go to dashboard */}
        {!loading && !cert && !error && (
          <div className="bg-white border border-[#E2E8F0] rounded-sm p-16 flex flex-col items-center gap-4 text-center">
            <ShieldCheck className="w-12 h-12" style={{ color: "#0B3CC8" }} />
            <p className="text-lg font-semibold text-[#0F172A]">No certificate selected</p>
            <p className="text-[#64748B] text-sm max-w-md">Issue a blockchain certificate from the dashboard for any eligible scheme.</p>
            <Link href="/dashboard">
              <button className="mt-4 px-6 py-3 text-white font-semibold rounded text-sm" style={{ background: "#0B3CC8" }}>Go to Dashboard</button>
            </Link>
          </div>
        )}

        {/* Certificate */}
        {cert && !loading && (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Main Certificate */}
            <div className="flex-1 bg-white border border-[#E2E8F0] border-l-4 border-l-[#16A34A] rounded-sm shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 flex items-center justify-between bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div>
                  <div className="text-[11px] text-[#64748B] uppercase tracking-widest font-semibold mb-1">Polygon Amoy Blockchain</div>
                  <div className="text-[#0F172A] font-bold text-lg">ENTITLE · Certificate of Record</div>
                </div>
                <div className="flex items-center gap-2 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" /> Polygon Verified
                </div>
              </div>

              <div className="p-8 md:p-10 space-y-10">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                  {[
                    ["Citizen Reference", displayRef, "font-bold text-xl text-[#0F172A]"],
                    ["Certificate ID", `CERT-${cert.id}`, "font-mono font-bold text-[#0F172A] text-lg"],
                    ["Eligibility Result", `#${cert.eligibility_result_id}`, "font-semibold text-[#0F172A]"],
                    ["Date of Issue", issuedDate, "font-semibold text-[#0F172A]"],
                  ].map(([label, value, cls]) => (
                    <div key={label}>
                      <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-1.5">{label}</p>
                      <p className={cls}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Eligible Schemes */}
                {eligibleSchemes.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-4">
                      Schemes Qualified ({eligibleSchemes.length} of {eligibilityResults.length} Assessed)
                    </p>
                    <div className="space-y-4">
                      {eligibleSchemes.map(r => {
                        const meta = schemeMap[r.scheme_code];
                        return (
                          <div key={r.id} className="flex items-center justify-between border border-[#E2E8F0] rounded-sm p-5 hover:bg-[#F8FAFC] transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-[#ECFDF5] rounded flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                              </div>
                              <div>
                                <div className="font-bold text-[#0F172A] text-[15px]">{meta?.name ?? r.scheme_code}</div>
                                {meta?.description && <div className="text-[12.5px] text-[#64748B] mt-0.5 line-clamp-1">{meta.description}</div>}
                              </div>
                            </div>
                            {meta?.source_url && (
                              <a href={meta.source_url} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold hover:underline" style={{ color: "#0B3CC8" }}>
                                Apply →
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Hash */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-sm p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest">Blockchain Hash (SHA-256)</p>
                    <button onClick={copyHash} className="flex items-center gap-1.5 text-[11px] font-bold hover:underline" style={{ color: "#0B3CC8" }}>
                      <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="font-mono text-[13px] text-[#475569] break-all leading-relaxed p-3 bg-white border border-[#E2E8F0] rounded-sm">
                    {cert.eligibility_hash}
                  </p>
                </div>

                {/* Tx Hash */}
                {cert.tx_hash && (
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-sm p-6">
                    <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-3">Transaction Hash</p>
                    <a
                      href={cert.explorer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[12px] break-all hover:underline"
                      style={{ color: "#0B3CC8" }}
                    >
                      {cert.tx_hash}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* QR Side Panel */}
            <div className="w-full md:w-80 bg-white border border-[#E2E8F0] rounded-sm shadow-sm p-8 flex flex-col items-center text-center">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-6">Scan to Verify</p>
              {/* QR code placeholder — renders the real qr_payload URL as text since we don't have a QR library */}
              <div className="w-48 h-48 bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1] rounded-sm flex items-center justify-center mb-8 p-4">
                <QRCode value={getVerifyUrl()} size={150} fgColor="#0F172A" />
              </div>
              <p className="text-[13px] text-[#64748B] leading-relaxed mb-8">
                Anyone can scan this QR code to independently verify authenticity on the Polygon blockchain — no login required.
              </p>
              <a href={cert?.explorer_url || "#"} target="_blank" rel="noopener noreferrer" className="w-full">
                <button className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-sm text-sm hover:opacity-90 transition-opacity mb-4 shadow-sm" style={{ background: "#0B3CC8" }}>
                  <ExternalLink className="w-4 h-4" /> Verify On Explorer
                </button>
              </a>
              <button
                onClick={() => navigator.share?.({ title: "ENTITLE Certificate", url: window.location.href })}
                className="w-full border border-[#E2E8F0] text-[#475569] font-semibold py-3 rounded-sm text-sm hover:bg-[#F8FAFC] transition-colors"
              >
                Share This Receipt
              </button>
              <div className="mt-8 pt-6 border-t border-[#E2E8F0] w-full">
                <div className="flex items-center justify-center gap-2 text-[12px] text-[#16A34A] font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Active · Blockchain anchored
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <p className="text-[12px] text-[#94A3B8]">© 2026 Entitle Project — An independent welfare access initiative.</p>
        </div>
      </footer>
    </div>
  );
}

/* ─── EXPORT ─── */
export default function CertificateScreen() {
  return (
    <Suspense>
      <CertificateInner />
    </Suspense>
  );
}
