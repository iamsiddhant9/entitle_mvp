"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User, X, CheckCircle2, ArrowRight, ArrowLeft, Info,
  Wheat, GraduationCap, Store, Briefcase, Search, Users,
  Loader2,
} from "lucide-react";
import { useCitizen } from "@/context/CitizenProfileContext";
import { CitizenProfilePatch } from "@/lib/api";

/* ─────────────── DATA ─────────────── */

const STEPS = [
  { n: 1, label: "Personal Details" },
  { n: 2, label: "Current Occupation" },
  { n: 3, label: "Income & Assets" },
  { n: 4, label: "Land & Family" },
  { n: 5, label: "Submit" },
];

const OCCUPATIONS = [
  { id: "farmer", label: "Farmer / Agriculture", desc: "You own or cultivate land for crop production.", icon: Wheat },
  { id: "worker", label: "Agricultural Labourer", desc: "You work on farmland owned by others.", icon: Users },
  { id: "student", label: "Student", desc: "Currently enrolled in a recognized educational institution.", icon: GraduationCap },
  { id: "self_employed", label: "Self-employed / Business Owner", desc: "You run your own trade, profession or micro-enterprise.", icon: Store },
  { id: "salaried", label: "Salaried Employee", desc: "You receive a fixed monthly salary from an employer.", icon: Briefcase },
  { id: "unemployed", label: "Unemployed / Seeking Work", desc: "Currently without formal employment.", icon: Search },
];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh",
];

/* ─────────────── INNER COMPONENT ─────────────── */

function AssistantFlowInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { citizenId, profile, isLoading, error, initSession, saveProfile, clearError } = useCitizen();

  const [step, setStep] = useState(1);
  const [digiLockerNotice, setDigiLockerNotice] = useState<string | null>(null);

  /* Form state per step */
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("");
  const [gender, setGender] = useState("");
  const [caste, setCaste] = useState("");
  const [occupation, setOccupation] = useState("farmer");
  const [income, setIncome] = useState("");
  const [hasBankAccount, setHasBankAccount] = useState(true);
  const [landOwned, setLandOwned] = useState(false);
  const [disability, setDisability] = useState(false);
  const [girlChildAge, setGirlChildAge] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Prefill from existing profile */
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.age) setAge(String(profile.age));
      if (profile.state) setState(profile.state);
      if (profile.gender) setGender(profile.gender);
      if (profile.caste) setCaste(profile.caste);
      if (profile.occupation) setOccupation(profile.occupation);
      if (profile.income) setIncome(String(profile.income));
      if (profile.has_bank_account !== null) setHasBankAccount(!!profile.has_bank_account);
      if (profile.land_owned !== null) setLandOwned(!!profile.land_owned);
      if (profile.disability !== null) setDisability(!!profile.disability);
      if (profile.girl_child_age) setGirlChildAge(String(profile.girl_child_age));
    }
  }, [profile]);

  /* Init session on first load */
  useEffect(() => {
    if (!citizenId) initSession();
  }, [citizenId, initSession]);

  /* DigiLocker notice */
  useEffect(() => {
    if (searchParams.get("digilocker") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      setDigiLockerNotice("DigiLocker connected. Your documents are being imported — check the Documents page.");
      setTimeout(() => setDigiLockerNotice(null), 7000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.round((step / STEPS.length) * 100);

  async function handleSubmit() {
    setSubmitting(true);
    const patch: CitizenProfilePatch = {
      full_name: fullName || null,
      age: age ? Number(age) : null,
      state: state || null,
      gender: gender || null,
      caste: caste || null,
      occupation: occupation || null,
      income: income ? Number(income) : null,
      has_bank_account: hasBankAccount,
      land_owned: landOwned,
      disability: disability,
      girl_child_age: girlChildAge ? Number(girlChildAge) : null,
    };
    await saveProfile(patch);
    setSubmitting(false);
    router.push("/dashboard");
  }

  const inputCls = "w-full border border-[#E2E8F0] rounded-sm px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#0B3CC8] focus:ring-1 focus:ring-[#0B3CC8] transition-colors";
  const labelCls = "block text-[12px] font-semibold text-[#475569] uppercase tracking-wider mb-2";
  const checkboxLabelCls = "flex items-center gap-3 cursor-pointer select-none";

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
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <Image
              src="/entitle-logo.jpg"
              alt="ENTITLE"
              width={160}
              height={52}
              className="h-11 w-auto object-contain"
              priority
            />
            <div className="text-[11px] text-[#64748B] font-medium hidden lg:block border-l border-[#E2E8F0] pl-3">
              Eligibility Assessment Engine
            </div>
          </Link>
          <Link href="/">
            <button className="flex items-center gap-2 text-sm font-semibold text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] px-4 py-2 rounded transition-colors hover:bg-[#F8FAFC]">
              <X className="w-4 h-4" /> Save &amp; Exit
            </button>
          </Link>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between text-sm font-semibold mb-3">
            <span className="text-[#0F172A]">Citizen Assessment</span>
            <span style={{ color: "#0B3CC8" }}>Step {step} of {STEPS.length} · {progress}% Complete</span>
          </div>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: "#0B3CC8" }} />
          </div>
        </div>
      </div>

      <main id="main" className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-64 shrink-0">
          <div className="bg-white rounded-sm border border-[#E2E8F0] p-7 sticky top-24">
            <h3 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-6">Assessment Steps</h3>
            <ul className="space-y-5">
              {STEPS.map((s) => {
                const done = step > s.n;
                const active = step === s.n;
                return (
                  <li key={s.n} className="flex items-center gap-4">
                    <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0 rounded-sm border ${done ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]" : active ? "text-white border-[#0B3CC8] bg-[#0B3CC8]" : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]"}`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                    </div>
                    <span className={`text-sm ${done ? "text-[#065F46] font-semibold" : active ? "font-bold text-[#0F172A]" : "text-[#64748B] font-medium"}`}>{s.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Form Card */}
        <div className="flex-1">
          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-sm border text-[12.5px] font-medium text-[#991B1B] bg-[#FEF2F2] border-[#FECACA]">
              <span className="flex-1">{error}</span>
              <button onClick={clearError}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* DigiLocker notice */}
          {digiLockerNotice && (
            <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-sm border text-[12.5px] font-medium text-[#065F46] bg-[#ECFDF5] border-[#A7F3D0]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="flex-1">{digiLockerNotice}</span>
              <button onClick={() => setDigiLockerNotice(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="bg-white rounded-sm border border-[#E2E8F0] overflow-hidden">
            <div className="h-[3px] w-full" style={{ background: "#0B3CC8" }} />

            <div className="p-8 md:p-10">
              {/* ── STEP 1: Basic Identity ── */}
              {step === 1 && (
                <>
                  <div className="mb-8">
                    <div className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#0B3CC8" }}>Section 1 of 5</div>
                    <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Basic Identity</h2>
                    <p className="text-[#64748B] text-[14px]">Let's start with your basic demographic details.</p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className={labelCls}>Full Name (Optional)</label>
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Rahul Sharma" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Age (Years)</label>
                      <input type="number" min="0" max="120" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 35" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>State of Residence</label>
                      <select value={state} onChange={e => setState(e.target.value)} className={inputCls}>
                        <option value="" disabled>Select State</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Gender</label>
                      <select id="gender-select" value={gender} onChange={e => setGender(e.target.value)} className={inputCls}>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other / Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Caste Category</label>
                      <select id="caste-select" value={caste} onChange={e => setCaste(e.target.value)} className={inputCls}>
                        <option value="">Select category</option>
                        <option value="general">General</option>
                        <option value="obc">OBC</option>
                        <option value="sc">SC</option>
                        <option value="st">ST</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP 2: Occupation ── */}
              {step === 2 && (
                <>
                  <div className="mb-8">
                    <div className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#0B3CC8" }}>Section 2 of 5</div>
                    <h2 className="text-2xl font-bold text-[#0F172A] mb-2">What is your current occupation?</h2>
                    <p className="text-[#64748B] text-[14px]">Select the option that best describes your primary source of livelihood.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {OCCUPATIONS.map(({ id, label, desc, icon: Icon }) => (
                      <label key={id} className={`flex items-start gap-4 p-5 border-2 rounded-sm cursor-pointer transition-all duration-150 ${occupation === id ? "border-[#0B3CC8] bg-[#EEF3FF]/40" : "border-[#E2E8F0] hover:border-[#0B3CC8]/30 hover:bg-[#F8FAFC]"}`}>
                        <input type="radio" name="occupation" value={id} checked={occupation === id} onChange={e => setOccupation(e.target.value)} className="sr-only" />
                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 transition-colors ${occupation === id ? "bg-[#0B3CC8]" : "bg-[#F1F5F9]"}`}>
                          <Icon className={`w-5 h-5 ${occupation === id ? "text-white" : "text-[#64748B]"}`} strokeWidth={1.75} />
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold text-sm mb-1 ${occupation === id ? "text-[#0B3CC8]" : "text-[#0F172A]"}`}>{label}</div>
                          <div className="text-[12px] text-[#64748B] leading-relaxed">{desc}</div>
                        </div>
                        <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${occupation === id ? "border-[#0B3CC8] bg-[#0B3CC8]" : "border-[#CBD5E1]"}`}>
                          {occupation === id && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* ── STEP 3: Income & Assets ── */}
              {step === 3 && (
                <>
                  <div className="mb-8">
                    <div className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#0B3CC8" }}>Section 3 of 5</div>
                    <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Income &amp; Assets</h2>
                    <p className="text-[#64748B] text-[14px]">Your annual household income is used to determine financial eligibility thresholds.</p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className={labelCls}>Annual Household Income (₹)</label>
                      <input id="income-input" type="number" min="0" value={income} onChange={e => setIncome(e.target.value)} placeholder="e.g. 150000" className={inputCls} />
                      <p className="text-[11.5px] text-[#64748B] mt-2">Enter your total annual income from all sources in rupees.</p>
                    </div>
                    <div>
                      <label className={labelCls}>Bank Account</label>
                      <div className="flex gap-4">
                        {[{ val: true, label: "Yes, I have a bank account" }, { val: false, label: "No bank account" }].map(({ val, label }) => (
                          <label key={String(val)} className={`flex-1 flex items-center gap-3 p-4 border-2 rounded-sm cursor-pointer transition-all ${hasBankAccount === val ? "border-[#0B3CC8] bg-[#EEF3FF]/40" : "border-[#E2E8F0] hover:border-[#0B3CC8]/30"}`}>
                            <input type="radio" name="bank" checked={hasBankAccount === val} onChange={() => setHasBankAccount(val)} className="sr-only" />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${hasBankAccount === val ? "border-[#0B3CC8] bg-[#0B3CC8]" : "border-[#CBD5E1]"}`}>
                              {hasBankAccount === val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-sm font-medium text-[#0F172A]">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP 4: Land & Family ── */}
              {step === 4 && (
                <>
                  <div className="mb-8">
                    <div className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#0B3CC8" }}>Section 4 of 5</div>
                    <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Land &amp; Family Details</h2>
                    <p className="text-[#64748B] text-[14px]">A few more details to complete your eligibility mapping.</p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className={checkboxLabelCls}>
                        <input id="land-checkbox" type="checkbox" checked={landOwned} onChange={e => setLandOwned(e.target.checked)} className="w-5 h-5 accent-[#0B3CC8] rounded" />
                        <div>
                          <span className="text-sm font-semibold text-[#0F172A]">I own agricultural land</span>
                          <p className="text-[12px] text-[#64748B]">Required for PM Kisan and other farmer-specific schemes.</p>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className={checkboxLabelCls}>
                        <input id="disability-checkbox" type="checkbox" checked={disability} onChange={e => setDisability(e.target.checked)} className="w-5 h-5 accent-[#0B3CC8] rounded" />
                        <div>
                          <span className="text-sm font-semibold text-[#0F172A]">I have a disability</span>
                          <p className="text-[12px] text-[#64748B]">Unlocks additional disability-specific scheme assessments.</p>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className={labelCls}>Age of youngest girl child (years) — optional</label>
                      <input id="girl-child-age-input" type="number" min="0" max="18" value={girlChildAge} onChange={e => setGirlChildAge(e.target.value)} placeholder="e.g. 5 (leave blank if none)" className={inputCls} />
                      <p className="text-[11.5px] text-[#64748B] mt-2">Required for Sukanya Samriddhi Yojana assessment.</p>
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP 5: Review & Submit ── */}
              {step === 5 && (
                <>
                  <div className="mb-8">
                    <div className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#0B3CC8" }}>Section 5 of 5</div>
                    <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Review &amp; Submit</h2>
                    <p className="text-[#64748B] text-[14px]">Confirm your details and run the eligibility assessment across all 12 schemes.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    {[
                      ["Full Name", fullName || "—"],
                      ["Age", age || "—"],
                      ["State", state || "—"],
                      ["Gender", gender || "—"],
                      ["Caste", caste.toUpperCase() || "—"],
                      ["Occupation", occupation],
                      ["Annual Income", income ? `₹${Number(income).toLocaleString("en-IN")}` : "—"],
                      ["Bank Account", hasBankAccount ? "Yes" : "No"],
                      ["Land Owned", landOwned ? "Yes" : "No"],
                      ["Disability", disability ? "Yes" : "No"],
                      ["Girl Child Age", girlChildAge || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="border border-[#E2E8F0] rounded-sm px-4 py-3">
                        <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">{label}</div>
                        <div className="font-semibold text-[#0F172A]">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex gap-3 bg-[#EEF3FF] border border-[#0B3CC8]/20 rounded-sm p-4">
                    <Info className="w-5 h-5 shrink-0 text-[#0B3CC8] mt-0.5" />
                    <p className="text-[13px] text-[#0F172A]/80 leading-relaxed">
                      Clicking <strong>Run Assessment</strong> will evaluate your profile against all 12 government schemes and generate your determination.
                    </p>
                  </div>
                </>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-10 pt-8 border-t border-[#E2E8F0]">
                <button
                  onClick={() => setStep(s => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="flex items-center gap-2 border border-[#E2E8F0] text-[#475569] font-semibold px-6 py-3 rounded hover:bg-[#F8FAFC] transition-colors text-sm disabled:opacity-40"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-[12px] font-medium text-[#64748B] hidden sm:block">Auto-saved securely</span>
                  {step < 5 ? (
                    <button
                      onClick={() => setStep(s => s + 1)}
                      className="flex items-center gap-2 text-white font-semibold px-8 py-3 rounded hover:opacity-90 transition-opacity text-sm shadow-sm"
                      style={{ background: "#0B3CC8" }}
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      id="run-assessment-btn"
                      onClick={handleSubmit}
                      disabled={submitting || isLoading}
                      className="flex items-center gap-2 text-white font-semibold px-8 py-3 rounded hover:opacity-90 transition-opacity text-sm shadow-sm disabled:opacity-60"
                      style={{ background: "#0B3CC8" }}
                    >
                      {(submitting || isLoading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {(submitting || isLoading) ? "Running assessment…" : "Run Assessment"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
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

/* ─── EXPORT (wrapped in Suspense for useSearchParams) ─── */

export default function AssistantFlow() {
  return (
    <Suspense>
      <AssistantFlowInner />
    </Suspense>
  );
}
