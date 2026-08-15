"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  User,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  FileText,
  IndianRupee,
  Building2,
  Filter,
  ChevronDown,
} from "lucide-react";

/* ───────────────────────── DATA ───────────────────────── */

const schemes = [
  {
    id: "pm-kisan",
    name: "PM KISAN",
    full: "Pradhan Mantri Kisan Samman Nidhi",
    amount: "₹6,000 / yr",
    department: "DAC&FW",
    category: "Agriculture",
    status: "eligible",
    description:
      "Income support scheme for eligible farmer families engaged in agricultural activities.",
    documents: ["Aadhaar / Citizen Identity", "Land Ownership Record"],
    conditions: 5,
    conditionsMet: 5,
  },
  {
    id: "pmay-g",
    name: "PMAY-G",
    full: "Pradhan Mantri Awas Yojana – Gramin",
    amount: "₹1,20,000",
    department: "MoRD",
    category: "Housing",
    status: "eligible",
    description:
      "Housing assistance programme for eligible rural households.",
    documents: ["Aadhaar / Citizen Identity", "Income Certificate"],
    conditions: 6,
    conditionsMet: 6,
  },
  {
    id: "pm-fby",
    name: "PM FBY",
    full: "Pradhan Mantri Fasal Bima Yojana",
    amount: "₹2,50,000",
    department: "DAC&FW",
    category: "Agriculture",
    status: "near_miss",
    description:
      "Crop insurance programme for eligible farmers against specified crop-related risks.",
    documents: ["Land Ownership Record", "Identity Document"],
    conditions: 7,
    conditionsMet: 6,
  },
  {
    id: "pmegp",
    name: "PMEGP",
    full: "PM Employment Generation Programme",
    amount: "Up to ₹25L",
    department: "MSME",
    category: "Employment",
    status: "not_eligible",
    description:
      "Credit-linked support programme intended to encourage employment generation through micro-enterprises.",
    documents: ["Identity Document", "Income / Business Documents"],
    conditions: 5,
    conditionsMet: 2,
  },
  {
    id: "atal-pension",
    name: "Atal Pension Yojana",
    full: "Atal Pension Yojana",
    amount: "₹1k–5k / mo",
    department: "MoF",
    category: "Pension",
    status: "not_eligible",
    description:
      "Pension-focused social security scheme assessed against the citizen profile.",
    documents: ["Aadhaar / Citizen Identity", "Bank Details"],
    conditions: 4,
    conditionsMet: 1,
  },
  {
    id: "nrlm",
    name: "NRLM",
    full: "National Rural Livelihoods Mission",
    amount: "Variable",
    department: "MoRD",
    category: "Livelihood",
    status: "not_eligible",
    description:
      "Livelihood-oriented programme supporting eligible rural households and community institutions.",
    documents: ["Identity Document", "Income / Household Documents"],
    conditions: 6,
    conditionsMet: 3,
  },
];

const categories = [
  "All",
  "Agriculture",
  "Housing",
  "Employment",
  "Pension",
  "Livelihood",
];

/* ───────────────────────── COMPONENTS ───────────────────────── */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "eligible") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Eligible
      </span>
    );
  }

  if (status === "near_miss") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
        <AlertTriangle className="w-3.5 h-3.5" />
        Near Miss
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
      <XCircle className="w-3.5 h-3.5" />
      Not Eligible
    </span>
  );
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function SchemesDirectory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openScheme, setOpenScheme] = useState<string | null>(null);

  const filteredSchemes = useMemo(() => {
    return schemes.filter((scheme) => {
      const matchesSearch =
        scheme.name.toLowerCase().includes(search.toLowerCase()) ||
        scheme.full.toLowerCase().includes(search.toLowerCase()) ||
        scheme.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || scheme.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        fontFamily: "var(--font-open-sans), sans-serif",
        background: "#F3F4F6",
      }}
    >
      {/* Tricolor bar */}
      <div className="flex h-[5px] w-full">
        <div className="flex-1" style={{ background: "#FF9933" }} />
        <div
          className="flex-1"
          style={{
            background: "#FFFFFF",
            borderTop: "1px solid #e2e8f0",
            borderBottom: "1px solid #e2e8f0",
          }}
        />
        <div className="flex-1" style={{ background: "#138808" }} />
      </div>

      {/* Utility bar */}
      <div
        className="text-[11.5px] font-medium py-2 px-6"
        style={{ background: "#1C1C1C", color: "#A0A0A0" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="#main" className="hover:text-white">
              Skip to content
            </a>
            <span className="text-[#3A3A3A]">|</span>
            <span>
              A public-interest service. Not a Government of India portal.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span>
              Helpline <strong className="text-white">1800-11-0001</strong>
            </span>
            <span className="text-[#3A3A3A]">|</span>
            <span>English</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div
              className="w-11 h-11 border-2 flex items-center justify-center font-bold text-xl"
              style={{ borderColor: "#0B3CC8", color: "#0B3CC8" }}
            >
              E
            </div>

            <div>
              <div
                className="text-xl font-bold tracking-tight"
                style={{ color: "#0B3CC8" }}
              >
                ENTITLE
              </div>

              <div className="text-[11px] text-[#64748B] mt-0.5 font-medium">
                Welfare Entitlement Assistance · Citizen Services
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "#EEF3FF" }}
            >
              <User className="w-5 h-5" style={{ color: "#0B3CC8" }} />
            </div>

            <div className="hidden sm:block">
              <div className="font-semibold text-[#0F172A] text-sm">
                Kavita Deshmukh
              </div>
              <div className="text-[11px] text-[#64748B]">
                Wardha, Maharashtra
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center overflow-x-auto">
            {[
              ["Overview", "/"],
              ["My determination", "/dashboard"],
              ["Schemes directory", "/schemes"],
              ["Documents", "/documents"],
              ["Help", "/help"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className={`relative px-4 py-4 text-sm font-medium whitespace-nowrap ${
                  label === "Schemes directory"
                    ? "text-[#0B3CC8]"
                    : "text-[#475569] hover:text-[#0B3CC8]"
                }`}
              >
                {label}

                {label === "Schemes directory" && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: "#0B3CC8" }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main */}
      <main
        id="main"
        className="flex-1 max-w-7xl w-full mx-auto px-6 py-10"
      >
        {/* Title */}
        <div className="mb-8">
          <div
            className="text-[11px] font-semibold tracking-widest uppercase mb-2"
            style={{ color: "#E8620A" }}
          >
            Scheme Registry
          </div>

          <h1
            className="text-[2.1rem] font-bold text-[#0F172A]"
            style={{ letterSpacing: "-0.03em" }}
          >
            Schemes Directory
          </h1>

          <p className="text-[#64748B] text-[14px] mt-2 max-w-2xl">
            Explore welfare schemes assessed by ENTITLE. Understand the
            purpose, potential benefits, documents and eligibility conditions
            before starting your assessment.
          </p>
        </div>

        {/* Search + filter */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-sm mb-7">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search schemes..."
                className="w-full border border-[#E2E8F0] rounded-sm py-3 pl-11 pr-4 text-sm outline-none focus:border-[#0B3CC8]"
              />
            </div>

            <div className="relative md:w-56">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none border border-[#E2E8F0] rounded-sm py-3 pl-11 pr-10 text-sm text-[#475569] bg-white outline-none focus:border-[#0B3CC8]"
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Scheme count */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm font-bold text-[#0F172A]">
              {filteredSchemes.length} schemes
            </span>
            <span className="text-sm text-[#64748B] ml-2">
              currently in the ENTITLE directory
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-2 gap-5">
          {filteredSchemes.map((scheme) => {
            const percentage =
              (scheme.conditionsMet / scheme.conditions) * 100;

            const isOpen = openScheme === scheme.id;

            return (
              <div
                key={scheme.id}
                className="bg-white border border-[#E2E8F0] rounded-sm overflow-hidden hover:border-[#CBD5E1] transition-colors"
              >
                <div className="p-6">
                  {/* top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold tracking-widest text-[#0B3CC8]">
                          {scheme.category.toUpperCase()}
                        </span>

                        <span className="text-[#CBD5E1]">·</span>

                        <span className="text-[11px] text-[#64748B]">
                          {scheme.department}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-[#0F172A]">
                        {scheme.name}
                      </h2>

                      <p className="text-[12.5px] text-[#64748B] mt-1">
                        {scheme.full}
                      </p>
                    </div>

                    <StatusBadge status={scheme.status} />
                  </div>

                  {/* description */}
                  <p className="text-[13px] text-[#475569] leading-relaxed mt-5">
                    {scheme.description}
                  </p>

                  {/* benefit */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                      <div className="flex items-center gap-2 text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                        <IndianRupee className="w-3.5 h-3.5" />
                        Benefit
                      </div>

                      <div className="font-bold text-[#0F172A] mt-2">
                        {scheme.amount}
                      </div>
                    </div>

                    <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                      <div className="flex items-center gap-2 text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                        <Building2 className="w-3.5 h-3.5" />
                        Department
                      </div>

                      <div className="font-bold text-[#0F172A] mt-2">
                        {scheme.department}
                      </div>
                    </div>
                  </div>

                  {/* condition meter */}
                  <div className="mt-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                        Eligibility conditions
                      </span>

                      <span className="text-xs font-bold text-[#0F172A]">
                        {scheme.conditionsMet}/{scheme.conditions}
                      </span>
                    </div>

                    <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          background:
                            percentage === 100
                              ? "#16A34A"
                              : percentage >= 70
                              ? "#D97706"
                              : "#DC2626",
                        }}
                      />
                    </div>
                  </div>

                  {/* expand */}
                  <button
                    onClick={() =>
                      setOpenScheme(isOpen ? null : scheme.id)
                    }
                    className="mt-6 flex items-center justify-between w-full pt-5 border-t border-[#E2E8F0] text-sm font-semibold text-[#0B3CC8]"
                  >
                    <span>
                      {isOpen ? "Hide scheme details" : "View scheme details"}
                    </span>

                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="mt-5 pt-5 border-t border-[#E2E8F0]">
                      <div className="text-[11px] uppercase tracking-widest font-semibold text-[#64748B] mb-3">
                        Common documents
                      </div>

                      <div className="space-y-2">
                        {scheme.documents.map((document) => (
                          <div
                            key={document}
                            className="flex items-center gap-2 text-sm text-[#475569]"
                          >
                            <FileText className="w-4 h-4 text-[#0B3CC8]" />
                            {document}
                          </div>
                        ))}
                      </div>

                      <div className="mt-5">
                        <Link
                          href="/assistant"
                          className="inline-flex items-center gap-2 bg-[#0B3CC8] text-white text-sm font-semibold px-5 py-2.5 rounded-sm hover:opacity-90"
                        >
                          Check my eligibility
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredSchemes.length === 0 && (
          <div className="bg-white border border-[#E2E8F0] p-12 text-center">
            <Search className="w-8 h-8 mx-auto text-[#94A3B8] mb-4" />

            <h3 className="font-bold text-[#0F172A]">
              No schemes found
            </h3>

            <p className="text-sm text-[#64748B] mt-1">
              Try another search term or category.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 bg-[#0B3CC8] text-white p-7 rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <h2 className="font-bold text-lg">
              Not sure which schemes apply to you?
            </h2>

            <p className="text-sm text-blue-100 mt-1">
              Let ENTITLE assess your profile against the available schemes.
            </p>
          </div>

          <Link
            href="/assistant"
            className="shrink-0 bg-white text-[#0B3CC8] font-bold text-sm px-5 py-3 rounded-sm hover:bg-blue-50"
          >
            Start assessment
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <p className="text-[12px] text-[#94A3B8]">
            © 2026 Entitle Project — An independent welfare access initiative.
            Not affiliated with the Government of India.
          </p>
        </div>
      </footer>
    </div>
  );
}