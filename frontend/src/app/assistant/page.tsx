"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info,
  Wheat,
  GraduationCap,
  Store,
  Briefcase,
  Search,
  Users,
} from "lucide-react";

/* ─────────────── DATA ─────────────── */
const steps = [
  { n: 1, label: "Personal Details", done: true },
  { n: 2, label: "Current Occupation", done: false, active: true },
  { n: 3, label: "Income & Assets", done: false },
  { n: 4, label: "Land Details", done: false },
  { n: 5, label: "Family Composition", done: false },
];

const options = [
  { id: "farmer", label: "Farmer / Agriculture", desc: "You own or cultivate land for crop production.", icon: Wheat },
  { id: "agricultural_labourer", label: "Agricultural Labourer", desc: "You work on farmland owned by others.", icon: Users },
  { id: "student", label: "Student", desc: "Currently enrolled in a recognized educational institution.", icon: GraduationCap },
  { id: "self_employed", label: "Self-employed / Business Owner", desc: "You run your own trade, profession or micro-enterprise.", icon: Store },
  { id: "salaried", label: "Salaried Employee", desc: "You receive a fixed monthly salary from an employer.", icon: Briefcase },
  { id: "unemployed", label: "Unemployed / Seeking Work", desc: "Currently without formal employment.", icon: Search },
];

export default function AssistantFlow() {
  const [selected, setSelected] = useState("farmer");
  const [digiLockerNotice, setDigiLockerNotice] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("digilocker") === "success") {
      // Clean URL without reload
      window.history.replaceState({}, "", window.location.pathname);
      setDigiLockerNotice(
        "DigiLocker connected. Your documents are being imported — check the Documents page."
      );
      setTimeout(() => setDigiLockerNotice(null), 7000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* ── Header ── */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 border-2 flex items-center justify-center font-bold text-xl" style={{ borderColor: "#0B3CC8", color: "#0B3CC8", fontFamily: "var(--font-open-sans)" }}>
              E
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight" style={{ color: "#0B3CC8", fontFamily: "var(--font-open-sans)" }}>
                ENTITLE
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5 font-medium">
                Eligibility Assessment Engine
              </div>
            </div>
          </div>
          <Link href="/">
            <button className="flex items-center gap-2 text-sm font-semibold text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] px-4 py-2 rounded transition-colors hover:bg-[#F8FAFC]">
              <X className="w-4 h-4" /> Save &amp; Exit
            </button>
          </Link>
        </div>
      </header>

      {/* ── Progress Bar ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between text-sm font-semibold mb-3">
            <span className="text-[#0F172A]">Citizen Assessment</span>
            <span style={{ color: "#0B3CC8" }}>Step 2 of 5 · 40% Complete</span>
          </div>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: "40%", background: "#0B3CC8" }} />
          </div>
        </div>
      </div>

      <main id="main" className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col md:flex-row gap-8">
        
        {/* ── Sidebar ── */}
        <div className="hidden md:flex flex-col w-64 shrink-0">
          <div className="bg-white rounded-sm border border-[#E2E8F0] p-7 sticky top-24">
            <h3 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-6">Assessment Steps</h3>
            <ul className="space-y-5">
              {steps.map((s) => (
                <li key={s.n} className="flex items-center gap-4">
                  <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0 rounded-sm border ${
                    s.done ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
                    : s.active ? "text-white border-[#0B3CC8] bg-[#0B3CC8]" : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]"
                  }`}>
                    {s.done ? <CheckCircle2 className="w-4.5 h-4.5" /> : s.n}
                  </div>
                  <span className={`text-sm ${s.done ? "text-[#065F46] font-semibold" : s.active ? "font-bold text-[#0F172A]" : "text-[#64748B] font-medium"}`}>
                    {s.label}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">Why we ask this</p>
              <p className="text-[12.5px] text-[#64748B] leading-relaxed">Occupation type is the largest factor in determining your eligibility for agricultural and employment welfare programs.</p>
            </div>
          </div>
        </div>

        {/* ── Form Card ── */}
        <div className="flex-1">
          <div className="bg-white rounded-sm border border-[#E2E8F0] overflow-hidden">
            {/* Top accent line */}
            <div className="h-[3px] w-full" style={{ background: "#0B3CC8" }} />
            
            <div className="p-8 md:p-10">

              {/* DigiLocker notice */}
              {digiLockerNotice && (
                <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-sm border text-[12.5px] font-medium text-[#065F46] bg-[#ECFDF5] border-[#A7F3D0]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{digiLockerNotice}</span>
                  <button onClick={() => setDigiLockerNotice(null)} className="opacity-60 hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="mb-10">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#0B3CC8" }}>Section 2 of 5</div>
                <h2 className="text-2xl font-bold text-[#0F172A] mb-2">What is your current occupation?</h2>
                <p className="text-[#64748B] text-[14px]">Select the option that best describes your primary source of livelihood.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {options.map(({ id, label, desc, icon: Icon }) => (
                  <label key={id} className={`flex items-start gap-4 p-5 border-2 rounded-sm cursor-pointer transition-all duration-150 ${
                    selected === id ? "border-[#0B3CC8] bg-[#EEF3FF]/40" : "border-[#E2E8F0] hover:border-[#0B3CC8]/30 hover:bg-[#F8FAFC]"
                  }`}>
                    <input type="radio" name="occupation" value={id} checked={selected === id} onChange={(e) => setSelected(e.target.value)} className="sr-only" />
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 transition-colors ${selected === id ? "bg-[#0B3CC8]" : "bg-[#F1F5F9]"}`}>
                      <Icon className={`w-5 h-5 ${selected === id ? "text-white" : "text-[#64748B]"}`} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-sm mb-1 ${selected === id ? "text-[#0B3CC8]" : "text-[#0F172A]"}`}>{label}</div>
                      <div className="text-[12px] text-[#64748B] leading-relaxed">{desc}</div>
                    </div>
                    {/* Radio indicator */}
                    <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected === id ? "border-[#0B3CC8] bg-[#0B3CC8]" : "border-[#CBD5E1]"}`}>
                      {selected === id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between mt-10 pt-8 border-t border-[#E2E8F0]">
                <button className="flex items-center gap-2 border border-[#E2E8F0] text-[#475569] font-semibold px-6 py-3 rounded hover:bg-[#F8FAFC] transition-colors text-sm">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-[12px] font-medium text-[#64748B] hidden sm:block">Auto-saved securely</span>
                  <Link href="/dashboard">
                    <button className="flex items-center gap-2 text-white font-semibold px-8 py-3 rounded hover:opacity-90 transition-opacity text-sm shadow-brand" style={{ background: "#0B3CC8" }}>
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3 bg-[#EEF3FF] border border-[#0B3CC8]/20 rounded-sm p-5">
            <Info className="w-5 h-5 shrink-0" style={{ color: "#0B3CC8" }} />
            <p className="text-[13px] text-[#0F172A]/80 leading-relaxed">
              If you have multiple income sources, choose your <strong>primary</strong> livelihood. You can declare secondary occupations in the next section for accurate eligibility mapping.
            </p>
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
