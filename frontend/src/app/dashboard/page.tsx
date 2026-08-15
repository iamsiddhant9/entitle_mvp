"use client";

import Link from "next/link";
import {
  User,
  RefreshCw,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
} from "lucide-react";

/* ─────────────── DATA ─────────────── */

const schemes = [
  {
    id: 1,
    name: "PM KISAN",
    full: "Pradhan Mantri Kisan Samman Nidhi",
    amount: "₹6,000 / yr",
    dept: "DAC&FW",
    status: "eligible",
    label: "Eligible",
    conditions: 5,
    conditionsMet: 5,
  },
  {
    id: 2,
    name: "PMAY-G",
    full: "Pradhan Mantri Awas Yojana – Gramin",
    amount: "₹1,20,000",
    dept: "MoRD",
    status: "eligible",
    label: "Eligible",
    conditions: 6,
    conditionsMet: 6,
  },
  {
    id: 3,
    name: "PM FBY",
    full: "Pradhan Mantri Fasal Bima Yojana",
    amount: "₹2,50,000",
    dept: "DAC&FW",
    status: "near_miss",
    label: "Near Miss",
    conditions: 7,
    conditionsMet: 6,
  },
  {
    id: 4,
    name: "PMEGP",
    full: "PM Employment Generation Programme",
    amount: "Up to ₹25L",
    dept: "MSME",
    status: "not_eligible",
    label: "Not Eligible",
    conditions: 5,
    conditionsMet: 2,
  },
  {
    id: 5,
    name: "Atal Pension Yojana",
    full: "Atal Pension Yojana",
    amount: "₹1k–5k / mo",
    dept: "MoF",
    status: "not_eligible",
    label: "Not Eligible",
    conditions: 4,
    conditionsMet: 1,
  },
  {
    id: 6,
    name: "NRLM",
    full: "National Rural Livelihoods Mission",
    amount: "Variable",
    dept: "MoRD",
    status: "not_eligible",
    label: "Not Eligible",
    conditions: 6,
    conditionsMet: 3,
  },
];

/* ─────────────── SUB-COMPONENTS ─────────────── */

function StatusBadge({ status, label }: { status: string; label: string }) {
  if (status === "eligible")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  if (status === "near_miss")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
        <AlertTriangle className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
      <XCircle className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

const navItems = [
  { label: "Overview", href: "/" },
  { label: "My determination", href: "/dashboard", active: true },
  { label: "Schemes directory", href: "/schemes" },
  { label: "Documents", href: "/documents" },
  { label: "Help", href: "/help" },
];

/* ─────────────── PAGE ─────────────── */

export default function Dashboard() {
  const eligible = schemes.filter((s) => s.status === "eligible").length;
  const nearMiss = schemes.filter((s) => s.status === "near_miss").length;
  const notEligible = schemes.filter((s) => s.status === "not_eligible").length;

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
      <div
        className="text-[11.5px] font-medium py-2 px-6"
        style={{ background: "#1C1C1C", color: "#A0A0A0" }}
      >
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
            <button className="hover:text-white transition-colors">Language</button>
          </div>
        </div>
      </div>

      {/* ── Main Header ── */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 border-2 flex items-center justify-center font-bold text-xl"
              style={{ borderColor: "#0B3CC8", color: "#0B3CC8", fontFamily: "var(--font-open-sans)" }}
            >
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
          </div>

          {/* Right: citizen reference + user */}
          <div className="flex items-center gap-8">
            <div className="text-right hidden md:block">
              <div className="text-[11px] text-[#64748B] font-medium">Citizen reference</div>
              <div className="font-bold text-[#0F172A] text-sm tracking-wide mt-0.5">
                ENT-2026-MH-04871
              </div>
            </div>
            <div className="w-px h-10 bg-[#E2E8F0] hidden md:block" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "#EEF3FF" }}
              >
                <User className="w-5 h-5" style={{ color: "#0B3CC8" }} />
              </div>
              <div>
                <div className="font-semibold text-[#0F172A] text-sm group-hover:text-[#0B3CC8] transition-colors">
                  Kavita Deshmukh
                </div>
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
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`relative px-4 py-4 text-sm font-medium transition-colors ${
                  item.active
                    ? "text-[#0B3CC8]"
                    : "text-[#475569] hover:text-[#0B3CC8]"
                }`}
              >
                {item.label}
                {item.active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: "#0B3CC8" }}
                  />
                )}
              </Link>
            ))}
          </nav>
          <Link href="/assistant">
            <button
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded transition-all hover:opacity-90"
              style={{ background: "#0B3CC8", color: "#fff" }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-run assessment
            </button>
          </Link>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main id="main" className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">

        {/* ── Determination Card ── */}
        <div className="bg-white border border-[#E2E8F0] rounded-sm overflow-hidden">
          <div className="grid md:grid-cols-[3fr_2fr] divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">

            {/* Left: Statement */}
            <div className="p-8 md:p-10">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-5">
                Statement of determination
              </p>
              <h1
                className="text-[2.1rem] font-bold leading-[1.15] text-[#0F172A] mb-8"
                style={{ letterSpacing: "-0.03em" }}
              >
                Kavita Deshmukh qualifies for {eligible} of {schemes.length} schemes assessed.
              </h1>

              <div className="border-t border-[#E2E8F0] pt-7 mb-7">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  {[
                    ["Determination no.", "DET/MA/2026/04871"],
                    ["Assessed on", "13 Aug 2026, 10:24 AM"],
                    ["Jurisdiction", "Wardha, Maharashtra"],
                    ["Conditions evaluated", `20 across ${schemes.length} schemes`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                        {label}
                      </div>
                      <div className="text-sm font-semibold text-[#0F172A]">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-7">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-3">
                  Confirmed entitlement
                </p>
                <div
                  className="text-[3rem] font-bold tracking-tight mb-1"
                  style={{ letterSpacing: "-0.04em", color: "#0F172A" }}
                >
                  ₹5,06,000
                </div>
                <p className="text-[13px] text-[#64748B] mb-6">
                  per year, across {eligible} schemes where every condition is met
                </p>
                <div className="border border-[#E2E8F0] rounded-sm p-4 inline-block">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                    Contingent
                  </p>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: "#E8620A" }}
                  >
                    ₹1,38,000
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    subject to {nearMiss} outstanding condition{nearMiss !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Basis + Profile */}
            <div className="p-8 md:p-10 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-7">
                  Basis of this determination
                </p>
                <ol className="space-y-6">
                  {[
                    {
                      n: "01",
                      title: "Decided by rule",
                      body: "Each condition below was evaluated deterministically against the profile on record. No score, no prediction.",
                    },
                    {
                      n: "02",
                      title: "Explained in plain language",
                      body: "The reasoning text is generated for readability only. It cannot alter an outcome.",
                    },
                    {
                      n: "03",
                      title: "Recorded for proof",
                      body: "The result is hashed and anchored on a public ledger so it can be verified later.",
                    },
                  ].map(({ n, title, body }) => (
                    <li key={n} className="flex gap-4">
                      <span
                        className="text-[13px] font-bold shrink-0 mt-0.5"
                        style={{ color: "#E8620A" }}
                      >
                        {n}
                      </span>
                      <div>
                        <div className="font-semibold text-sm text-[#0F172A] mb-1">{title}</div>
                        <div className="text-[13px] text-[#64748B] leading-relaxed">{body}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-[#E2E8F0] pt-6 mt-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#0F172A]">Profile on record</span>
                  <span className="text-sm font-bold text-[#0F172A]">86% complete</span>
                </div>
                <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: "86%", background: "#0B3CC8" }}
                  />
                </div>
                <p className="text-[13px] text-[#64748B] mb-5">
                  Adding a caste certificate would allow three further schemes to be assessed.
                </p>
                <button
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-sm border transition-colors hover:bg-[#EEF3FF]"
                  style={{ borderColor: "#0B3CC8", color: "#0B3CC8" }}
                >
                  <FileDown className="w-4 h-4" />
                  Download determination (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Schemes Table ── */}
        <div className="bg-white border border-[#E2E8F0] rounded-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-0.5">
                Scheme-by-scheme result
              </p>
              <h2 className="text-lg font-bold text-[#0F172A]">
                All {schemes.length} schemes assessed
              </h2>
            </div>
            <div className="flex items-center gap-5 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-[#065F46]">
                <CheckCircle2 className="w-4 h-4" /> {eligible} Eligible
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#92400E]">
                <AlertTriangle className="w-4 h-4" /> {nearMiss} Near miss
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[#991B1B]">
                <XCircle className="w-4 h-4" /> {notEligible} Not eligible
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] border-b border-[#E2E8F0]"
                  style={{ background: "#F8FAFC" }}
                >
                  <th className="px-8 py-3 text-left">Scheme</th>
                  <th className="px-6 py-3 text-left">Benefit</th>
                  <th className="px-6 py-3 text-left">Department</th>
                  <th className="px-6 py-3 text-left">Conditions met</th>
                  <th className="px-6 py-3 text-left">Determination</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {schemes.map((s) => {
                  const pct = Math.round((s.conditionsMet / s.conditions) * 100);
                  return (
                    <tr
                      key={s.id}
                      className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="font-semibold text-[#0F172A]">{s.name}</div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">{s.full}</div>
                      </td>
                      <td className="px-6 py-5 font-semibold text-[#0F172A]">{s.amount}</td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-medium text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
                          {s.dept}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background:
                                  pct === 100 ? "#16A34A" : pct >= 70 ? "#D97706" : "#DC2626",
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[#64748B]">
                            {s.conditionsMet}/{s.conditions}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={s.status} label={s.label} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        {s.status === "eligible" && (
                          <button
                            className="text-xs font-semibold px-4 py-2 rounded-sm text-white transition-opacity hover:opacity-90"
                            style={{ background: "#0B3CC8" }}
                          >
                            Apply now
                          </button>
                        )}
                        {s.status === "near_miss" && (
                          <button
                            className="text-xs font-semibold px-4 py-2 rounded-sm border transition-colors hover:bg-[#FFFBEB]"
                            style={{ borderColor: "#D97706", color: "#92400E" }}
                          >
                            Fix &amp; apply
                          </button>
                        )}
                        {s.status === "not_eligible" && (
                          <button className="group flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#0B3CC8] transition-colors ml-auto">
                            See reasoning
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-8 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
            <p className="text-[12px] text-[#64748B]">
              Assessment ID <span className="font-mono font-semibold text-[#0F172A]">DET/MA/2026/04871</span>
              {" · "}All results are deterministic and rule-based.
            </p>
            <Link href="/certificate">
              <button
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-sm border transition-colors hover:bg-[#EEF3FF]"
                style={{ borderColor: "#0B3CC8", color: "#0B3CC8" }}
              >
                <FileDown className="w-3.5 h-3.5" />
                Get blockchain certificate
              </button>
            </Link>
          </div>
        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E2E8F0] bg-white mt-4">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <p className="text-[12px] text-[#94A3B8]">
            © 2026 Entitle Project — An independent welfare access initiative. Not affiliated with the Government of India.
          </p>
          <div className="flex items-center gap-5 text-[12px] text-[#64748B]">
            <a href="#" className="hover:text-[#0B3CC8] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#0B3CC8] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#0B3CC8] transition-colors">RTI</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
