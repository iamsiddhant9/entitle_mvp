"use client";

import Link from "next/link";
import {
  User,
  Download,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileText
} from "lucide-react";

export default function CertificateScreen() {
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
              ["Overview", "/"], 
              ["My determination", "/dashboard"], 
              ["Schemes directory", "/schemes"], 
              ["Documents", "/documents"]
            ].map(([n, h]) => (
              <Link key={n} href={h} className="relative px-4 py-4 text-sm font-medium transition-colors text-[#475569] hover:text-[#0B3CC8]">
                {n}
              </Link>
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
            <p className="text-[#64748B] text-[13.5px] mt-2">Issued: 14 August 2026 · Valid for 12 months · Polygon Verified</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 border border-[#E2E8F0] text-[#475569] font-semibold px-5 py-2.5 rounded-sm hover:bg-white transition-colors text-sm shadow-sm bg-white">
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button className="flex items-center gap-2 border font-semibold px-5 py-2.5 rounded-sm text-sm bg-white shadow-sm hover:bg-[#EEF3FF] transition-colors" style={{ color: "#0B3CC8", borderColor: "#0B3CC8" }}>
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* ── Main Certificate ── */}
          <div className="flex-1 bg-white border border-[#E2E8F0] border-l-4 border-l-[#16A34A] rounded-sm shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <div>
                <div className="text-[11px] text-[#64748B] uppercase tracking-widest font-semibold mb-1">Government of India Standard</div>
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
                  ["Citizen Name", "Kavita Deshmukh", "font-bold text-xl text-[#0F172A]"],
                  ["Assessment ID", "DET/MA/2026/04871", "font-mono font-bold text-[#0F172A] text-lg"],
                  ["District / State", "Wardha, Maharashtra", "font-semibold text-[#0F172A]"],
                  ["Date of Issue", "14 August 2026", "font-semibold text-[#0F172A]"],
                ].map(([label, value, cls]) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-1.5">{label}</p>
                    <p className={cls}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Schemes Qualified */}
              <div>
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-4">Schemes Qualified (2 of 6 Assessed)</p>
                <div className="space-y-4">
                  {[
                    { name: "PM KISAN", full: "Pradhan Mantri Kisan Samman Nidhi", amount: "₹6,000 / yr", dept: "DAC&FW" },
                    { name: "PMAY-G", full: "Pradhan Mantri Awas Yojana – Gramin", amount: "₹1,20,000", dept: "MoRD" },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center justify-between border border-[#E2E8F0] rounded-sm p-5 hover:bg-[#F8FAFC] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#ECFDF5] rounded flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                        </div>
                        <div>
                          <div className="font-bold text-[#0F172A] text-[15px]">{s.name}</div>
                          <div className="text-[12.5px] text-[#64748B] mt-0.5">{s.full} · {s.dept}</div>
                        </div>
                      </div>
                      <div className="font-bold text-[#0F172A] text-[15px]">{s.amount}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hash */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest">Blockchain Hash (SHA-256)</p>
                  <button className="flex items-center gap-1.5 text-[11px] font-bold hover:underline" style={{ color: "#0B3CC8" }}>
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="font-mono text-[13px] text-[#475569] break-all leading-relaxed p-3 bg-white border border-[#E2E8F0] rounded-sm">
                  0x8f2d5a374b9e1c6a5d8f2b3e91b4c7d2f0a8e3d5b7c9f1a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7
                </p>
              </div>
            </div>
          </div>

          {/* ── QR Side Panel ── */}
          <div className="w-full md:w-80 bg-white border border-[#E2E8F0] rounded-sm shadow-sm p-8 flex flex-col items-center text-center">
            <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-6">Scan to Verify</p>
            <div className="w-48 h-48 bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1] rounded-sm flex items-center justify-center mb-8 p-4">
              <svg viewBox="0 0 108 108" className="w-full h-full text-[#0F172A]">
                <rect x="5" y="5" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="5"/>
                <rect x="14" y="14" width="16" height="16" fill="currentColor"/>
                <rect x="69" y="5" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="5"/>
                <rect x="78" y="14" width="16" height="16" fill="currentColor"/>
                <rect x="5" y="69" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="5"/>
                <rect x="14" y="78" width="16" height="16" fill="currentColor"/>
                <rect x="50" y="5" width="10" height="10" fill="currentColor"/>
                <rect x="50" y="22" width="10" height="10" fill="currentColor"/>
                <rect x="65" y="50" width="10" height="10" fill="currentColor"/>
                <rect x="50" y="65" width="10" height="10" fill="currentColor"/>
                <rect x="65" y="80" width="10" height="10" fill="currentColor"/>
                <rect x="80" y="65" width="10" height="10" fill="currentColor"/>
                <rect x="80" y="80" width="10" height="10" fill="currentColor"/>
                <rect x="5" y="50" width="10" height="10" fill="currentColor"/>
                <rect x="20" y="50" width="10" height="10" fill="currentColor"/>
              </svg>
            </div>
            <p className="text-[13px] text-[#64748B] leading-relaxed mb-8">
              Anyone can scan this QR code to independently verify authenticity on the Polygon blockchain — no login required.
            </p>
            <button className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-sm text-sm hover:opacity-90 transition-opacity mb-4 shadow-brand" style={{ background: "#0B3CC8" }}>
              <ExternalLink className="w-4 h-4" /> Verify On Explorer
            </button>
            <button className="w-full border border-[#E2E8F0] text-[#475569] font-semibold py-3 rounded-sm text-sm hover:bg-[#F8FAFC] transition-colors">
              Share This Receipt
            </button>
            <div className="mt-8 pt-6 border-t border-[#E2E8F0] w-full">
              <div className="flex items-center justify-center gap-2 text-[12px] text-[#16A34A] font-semibold">
                <ShieldCheck className="w-4 h-4" /> Active · Expires Aug 2027
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* ── Footer ── */}
      <footer className="border-t border-[#E2E8F0] bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <p className="text-[12px] text-[#94A3B8]">
            © 2026 Entitle Project — An independent welfare access initiative.
          </p>
        </div>
      </footer>
    </div>
  );
}
