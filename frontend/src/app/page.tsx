"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import IndiaImpactMap from "./components/IndiaImpactMap";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Lock,
  Plus,
  Minus,
  Phone,
  Mail,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

/* ─── DATA ─── */

const schemes = [
  {
    name: "PM KISAN",
    full: "Pradhan Mantri Kisan Samman Nidhi",
    amount: "₹6,000/yr",
    note: "Direct income support for cultivating farmers with land records.",
    status: "eligible",
  },
  {
    name: "AB PM-JAY",
    full: "Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana",
    amount: "₹5,00,000/yr",
    note: "Cashless secondary and tertiary hospitalisation cover.",
    status: "eligible",
  },
  {
    name: "PM-SY",
    full: "Pradhan Mantri Shram Yogi Maandhan",
    amount: "₹1,26,000",
    note: "Provident provisions for pensioners in unorganised sector.",
    status: "near_miss",
  },
  {
    name: "NSP Post Matric",
    full: "National Scholarship Portal – Post Matric",
    amount: "₹18,000/yr",
    note: "Scholarships for higher education from minority communities.",
    status: "near_miss",
  },
];

const faqs = [
  {
    q: "Is Entitle affiliated with the Government?",
    a: "No. Entitle is a public-interest platform that reads eligibility rules as published in official scheme gazettes. All formal applications must be submitted via official government portals.",
  },
  {
    q: "What is Blockchain verification used for?",
    a: "Your eligibility assessment is cryptographically hashed and anchored to the public ledger. This establishes a timestamped proof that your assessment was carried out on that specific date.",
  },
  {
    q: "Are my documents safe with Entitle?",
    a: "No documents are processed directly on our servers by your claims for scheme mapping purposes. Decisions are made on verified summaries.",
  },
  {
    q: "How are the scheme criteria kept updated?",
    a: "We monitor the gazette and issue-stage scheme notifications daily. The determinations rules sets are updated as soon as a scheme's criteria change.",
  },
];

const trustPillars = [
  {
    icon: CheckCircle2,
    title: "Deterministic Matching",
    body: "No algorithm opinions or scores. Each eligibility decision is computed directly against published scheme rules.",
  },
  {
    icon: ShieldCheck,
    title: "Public Ledger Proof",
    body: "Your assessment is hashed and anchored on a public ledger. Documents are logged and anchored without server calls.",
  },
  {
    icon: FileText,
    title: "Plain Language Explanations",
    body: "We translate complex legal rules and administrative jargon into plain language insights.",
  },
  {
    icon: Lock,
    title: "Privacy First Infrastructure",
    body: "Your documents never leave your device. We process only cryptographic summaries using a zero-knowledge architecture.",
  },
];

const footerLinks = {
  Citizen: ["Check Eligibility", "Verify Certificate", "Document Wallet", "My Determination"],
  "Important Links": ["DigiLocker", "MyGov.in", "India.gov.in", "UMANG", "Polygon Explorer"],
  Platform: ["About Entitle", "How It Works", "GitHub (Open Source)", "Privacy Policy"],
};

/* ─── HEADER (shared structure) ─── */
function SiteHeader({ ctaLabel = "Check Eligibility", ctaHref = "/assistant" }) {
  const [lang, setLang] = useState("en");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (document.cookie.includes("googtrans=/en/hi")) {
        setLang("hi");
      }
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setLang(selected);
    if (selected === "en") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    } else {
      document.cookie = `googtrans=/en/${selected}; path=/;`;
      document.cookie = `googtrans=/en/${selected}; path=/; domain=${window.location.hostname}`;
    }
    window.location.reload();
  };

  const setZoom = (level: number) => {
    if (typeof document !== "undefined") {
      document.documentElement.style.fontSize = level === 0 ? "16px" : level > 0 ? "18px" : "14px";
    }
  };

  const navLinks = [
    ["Overview", "/", true],
    ["My Profile", "/profile", false],
    ["My determination", "/dashboard", false],
    ["Schemes directory", "/schemes", false],
    ["Documents", "/documents", false],
    ["Help", "#faq", false],
  ];

  const indianLanguages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिंदी (Hindi)" },
    { code: "as", name: "অসমীয়া (Assamese)" },
    { code: "bn", name: "বাংলা (Bengali)" },
    { code: "brx", name: "बड़ो (Bodo)" },
    { code: "doi", name: "डोगरी (Dogri)" },
    { code: "gu", name: "ગુજરાતી (Gujarati)" },
    { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
    { code: "ks", name: "کأشُر (Kashmiri)" },
    { code: "gom", name: "कोंकणी (Konkani)" },
    { code: "mai", name: "मैथिली (Maithili)" },
    { code: "ml", name: "മലയാളം (Malayalam)" },
    { code: "mni", name: "ꯃꯤꯇꯩꯂꯣꯟ (Manipuri)" },
    { code: "mr", name: "मराठी (Marathi)" },
    { code: "ne", name: "नेपाली (Nepali)" },
    { code: "or", name: "ଓଡ଼ିଆ (Odia)" },
    { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
    { code: "sa", name: "संस्कृतम् (Sanskrit)" },
    { code: "sat", name: "ᱥᱟᱱᱛᱟᱲᱤ (Santali)" },
    { code: "sd", name: "سنڌي (Sindhi)" },
    { code: "ta", name: "தமிழ் (Tamil)" },
    { code: "te", name: "తెలుగు (Telugu)" },
    { code: "ur", name: "اردو (Urdu)" },
  ];

  return (
    <>
      <div id="google_translate_element" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}></div>
      {/* Tricolor */}
      <div className="flex h-[5px] w-full">
        <div className="flex-1" style={{ background: "#FF9933" }} />
        <div className="flex-1" style={{ background: "#FFFFFF", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }} />
        <div className="flex-1" style={{ background: "#138808" }} />
      </div>

      {/* Utility bar */}
      <div className="text-[11.5px] font-medium py-2 px-6" style={{ background: "#1C1C1C", color: "#A0A0A0" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 hidden sm:flex">
            <a href="#main" className="hover:text-white transition-colors">Skip to content</a>
            <span className="text-[#3A3A3A]">|</span>
            <span>A public-interest service. Not a Government of India portal.</span>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="hidden sm:inline">Helpline <strong className="text-white">1800-11-0001</strong></span>
            <span className="text-[#3A3A3A] hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom(-1)} className="hover:text-white transition-colors text-xs">A-</button>
              <button onClick={() => setZoom(0)} className="text-white font-bold text-sm">A</button>
              <button onClick={() => setZoom(1)} className="hover:text-white transition-colors text-sm font-bold">A+</button>
            </div>
            <span className="text-[#3A3A3A]">|</span>
            <select
              value={lang}
              onChange={handleLanguageChange}
              className="bg-[#0B3CC8] text-white font-bold px-2 py-1 rounded outline-none cursor-pointer max-w-[120px] sm:max-w-[150px] truncate"
            >
              {indianLanguages.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-[#E2E8F0] relative z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 border-2 flex items-center justify-center font-bold text-lg sm:text-xl" style={{ borderColor: "#0B3CC8", color: "#0B3CC8", fontFamily: "var(--font-open-sans)" }}>
              E
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: "#0B3CC8", fontFamily: "var(--font-open-sans)" }}>ENTITLE</div>
              <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-0.5 font-medium hidden sm:block">Welfare Entitlement Assistance · Citizen Services</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(([label, href, active]) => (
              <Link
                key={label as string}
                href={href as string}
                className={`relative px-4 py-4 text-sm font-medium transition-colors ${active ? "text-[#0B3CC8]" : "text-[#475569] hover:text-[#0B3CC8]"}`}
              >
                {label}
                {active && <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "#0B3CC8" }} />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href={ctaHref} className="hidden sm:block">
              <button className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded transition-all hover:opacity-90" style={{ background: "#0B3CC8", color: "#fff" }}>
                {ctaLabel} <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 text-[#0F172A]" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#E2E8F0] shadow-lg py-4 px-6 flex flex-col gap-4">
            {navLinks.map(([label, href, active]) => (
              <Link
                key={label as string}
                href={href as string}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-base font-medium py-2 ${active ? "text-[#0B3CC8]" : "text-[#475569]"}`}
              >
                {label}
              </Link>
            ))}
            <Link href={ctaHref} onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 mt-2 rounded" style={{ background: "#0B3CC8", color: "#fff" }}>
                {ctaLabel} <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        )}
      </header>
    </>
  );
}

const typewriterPhrases = [
  "Know Your Rights.\nClaim Your Benefits.",
  "अपने अधिकार जानें।\nअपने लाभ प्राप्त करें।",
  "तुमचे हक्क जाणून घ्या.\nतुमचे फायदे मिळवा.",
  "ਆਪਣੇ ਅਧਿਕਾਰ ਜਾਣੋ।\nਆਪਣੇ ਲਾਭ ਪ੍ਰਾਪਤ ਕਰੋ।",
  "మీ హక్కులను తెలుసుకోండి.\nమీ ప్రయోజనాలను పొందండి.",
  "Know Your Rights.\nClaim Your Benefits."
];

function HeroTypewriter() {
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let typingSpeed = 45;
    if (isDeleting) typingSpeed = 20;

    const currentPhrase = typewriterPhrases[phraseIndex];
    
    if (!isDeleting && displayText === currentPhrase) {
      if (phraseIndex === typewriterPhrases.length - 1) {
        return;
      }
      const timeout = setTimeout(() => setIsDeleting(true), 800);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setPhraseIndex((prev) => prev + 1);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayText((prev) => 
        isDeleting
          ? currentPhrase.substring(0, prev.length - 1)
          : currentPhrase.substring(0, prev.length + 1)
      );
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <>
      {displayText.split('\n').map((line, i, arr) => (
        <span key={i}>
          {line}
          {i === 0 && displayText.includes('\n') && <br />}
        </span>
      ))}
      <span className="inline-block w-[4px] bg-white ml-2 animate-pulse" style={{ height: "0.75em", verticalAlign: "middle", opacity: phraseIndex === typewriterPhrases.length - 1 && displayText === typewriterPhrases[phraseIndex] ? 0 : 1 }}></span>
    </>
  );
}

/* ─── PAGE ─── */
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "var(--font-open-sans), sans-serif", background: "#F3F4F6" }}>
      <SiteHeader />

      {/* ── HERO ── */}
      <section id="main" className="relative py-20 md:py-28 px-6 overflow-hidden bg-[#0A1628]" style={{ backgroundImage: "linear-gradient(to bottom, rgba(10, 22, 40, 0.6), rgba(11, 60, 200, 0.8)), url('/hero-bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}>

        <div className="relative max-w-4xl mx-auto text-center text-white">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 mb-8" style={{ borderLeft: "3px solid #FF9933", paddingLeft: "12px" }}>
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "#FF9933" }} />
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span>Independent Welfare Platform</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
              <span style={{ color: "rgba(255,255,255,0.35)" }}>106 Schemes Tracked</span>
            </div>
          </div>

          <h1 translate="no" className="notranslate text-[3rem] md:text-[4rem] font-bold leading-[1.08] mb-5 text-white h-[200px] sm:h-[160px] md:h-[160px] flex flex-col justify-end md:block" style={{ letterSpacing: "-0.035em", fontFamily: "var(--font-open-sans), sans-serif" }}>
            <HeroTypewriter />
          </h1>

          <p className="text-[1.05rem] text-white/65 mb-10 max-w-xl mx-auto leading-relaxed font-normal">
            An independent, blockchain-secured citizen platform designed to accurately map your profile to valid central and state welfare schemes in plain language.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link href="/assistant">
              <button className="flex items-center gap-2.5 font-semibold px-7 py-3.5 rounded text-sm transition-all hover:opacity-90 shadow-lg" style={{ background: "#0B3CC8", color: "#fff" }}>
                Check Your Eligibility <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <a href="#schemes">
              <button className="flex items-center gap-2.5 font-semibold px-7 py-3.5 rounded text-sm border border-white/25 text-white hover:bg-white/10 transition-all">
                Browse Directory <ExternalLink className="w-4 h-4" />
              </button>
            </a>
          </div>

          {/* Ministry logo circles */}
          <div className="flex items-center justify-center gap-3 text-white/50 text-[13px]">
            <div className="flex -space-x-2">
              {[
                { abbr: "MoA", bg: "rgba(255,153,51,0.12)",  border: "rgba(255,153,51,0.35)",  text: "#FFBD6B", title: "Ministry of Agriculture & Farmers Welfare" },
                { abbr: "MoH", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.35)",  text: "#93C5FD", title: "Ministry of Health & Family Welfare" },
                { abbr: "MoE", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.35)", text: "#C4B5FD", title: "Ministry of Education" },
                { abbr: "MRD", bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.30)",  text: "#86EFAC", title: "Ministry of Rural Development" },
                { abbr: "MoL", bg: "rgba(34,211,238,0.10)",  border: "rgba(34,211,238,0.30)",  text: "#67E8F9", title: "Ministry of Labour & Employment" },
              ].map(({ abbr, bg, border, text, title }, i) => (
                <div
                  key={i}
                  title={title}
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                  style={{
                    background: bg,
                    border: `1.5px solid ${border}`,
                    color: text,
                    zIndex: 5 - i,
                    fontSize: "8px",
                    letterSpacing: "0.03em",
                    marginLeft: i === 0 ? 0 : "-8px",
                  }}
                >
                  {abbr}
                </div>
              ))}
            </div>
            <span><strong className="text-white">106 central schemes</strong> across <strong className="text-white">18 ministries</strong> — mapped and searchable.</span>
          </div>
        </div>
      </section>


      <IndiaImpactMap />

      {/* ── SCHEMES DIRECTORY ── */}
      <section id="schemes" className="py-20 px-6" style={{ background: "#F3F4F6" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: "#E8620A" }}>
                Entitle Welfare Directory
              </p>
              <h2 className="text-[1.9rem] font-bold text-[#0F172A]" style={{ letterSpacing: "-0.025em" }}>
                Assessed National Welfare Programs
              </h2>
            </div>
            <a href="/schemes" className="text-sm font-semibold hover:underline hidden md:block" style={{ color: "#0B3CC8" }}>
              View all 106 schemes →
            </a>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-sm overflow-hidden">
            {schemes.map((s, i) => (
              <div key={s.name} className={`flex items-center gap-4 px-7 py-5 hover:bg-[#F8FAFC] transition-colors ${i > 0 ? "border-t border-[#E2E8F0]" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="font-bold text-[#0F172A] text-[15px]">{s.name}</span>
                    <span className="text-[11px] text-[#64748B] hidden md:block">— {s.full}</span>
                  </div>
                  <p className="text-[12.5px] text-[#64748B] truncate">{s.note}</p>
                </div>
                <div className="shrink-0 font-bold text-[#0F172A] text-[15px] w-32 text-right hidden md:block">
                  {s.amount}
                </div>
                <div className="shrink-0">
                  {s.status === "eligible" ? (
                    <Link href="/assistant">
                      <button className="text-xs font-semibold px-4 py-2 rounded-sm text-white transition-opacity hover:opacity-90" style={{ background: "#16A34A" }}>
                        Register
                      </button>
                    </Link>
                  ) : (
                    <button className="text-xs font-semibold px-4 py-2 rounded-sm border transition-colors" style={{ borderColor: "#D97706", color: "#92400E", background: "#FFFBEB" }}>
                      Near Miss
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="px-7 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <p className="text-[12px] text-[#64748B]">Showing 4 of 106 schemes tracked</p>
              <a href="/schemes" className="text-[12px] font-semibold hover:underline" style={{ color: "#0B3CC8" }}>View all 106 schemes →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRINCIPLES ── */}
      <section style={{ background: "#0A1628" }} className="py-20 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-16">
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#FF9933" }}>
                Platform Commitments
              </p>
              <h2 className="text-[1.9rem] font-bold text-white" style={{ letterSpacing: "-0.025em" }}>
                Four Unbreakable Guarantees
              </h2>
            </div>
            <p className="text-[13px] max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Every principle is enforced in code,<br className="hidden md:block" /> not just promised in text.
            </p>
          </div>

          {/* Principle rows */}
          <div>
            {[
              {
                n: "01", title: "Deterministic Matching",
                body: "No algorithm opinions or scores. Each eligibility decision is computed directly against published scheme rules — fully auditable.",
                proof: "106 schemes · hard-coded eligibility rules",
              },
              {
                n: "02", title: "Public Ledger Proof",
                body: "Your assessment is hashed and anchored on a public blockchain. Immutable, timestamped, and independently verifiable by anyone.",
                proof: "Every certificate carries an on-chain hash",
              },
              {
                n: "03", title: "Plain Language Explanations",
                body: "We translate complex legal eligibility rules and administrative jargon into plain language that any citizen can understand.",
                proof: "No legal jargon · No fine print",
              },
              {
                n: "04", title: "Privacy First Infrastructure",
                body: "Your documents never leave your device. We process only cryptographic summaries using a zero-knowledge architecture.",
                proof: "Zero server uploads · Zero data retention",
              },
            ].map(({ n, title, body, proof }) => (
              <div
                key={n}
                className="group grid grid-cols-[40px_1fr] md:grid-cols-[72px_1fr_auto] gap-4 md:gap-6 py-7 md:py-9 items-start cursor-default"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Number */}
                <div
                  className="font-semibold group-hover:text-white/25 transition-colors duration-300"
                  style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "rgba(255,255,255,0.09)", lineHeight: 1 }}
                >
                  {n}
                </div>

                {/* Content */}
                <div>
                  <h3
                    className="font-bold text-[14px] md:text-[15px] mb-2 transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {title}
                  </h3>
                  <p className="text-[12px] md:text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {body}
                  </p>
                  {/* Mobile proof — inline under body */}
                  <p className="mt-2 text-[10px] font-mono md:hidden" style={{ color: "rgba(255,153,51,0.6)" }}>
                    — {proof}
                  </p>
                </div>

                {/* Desktop hover proof — sharp editorial tag, not a pill */}
                <div className="shrink-0 hidden md:flex items-start pt-0.5">
                  <span
                    className="text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 py-1 pl-2.5 pr-3"
                    style={{ color: "rgba(255,153,51,0.8)", borderLeft: "2px solid rgba(255,153,51,0.45)" }}
                  >
                    {proof}
                  </span>
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
          </div>
        </div>
      </section>



      {/* ── VERIFY CERTIFICATE CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background: "#0A1628" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #0B3CC8 0%, transparent 50%)" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <ShieldCheck className="w-12 h-12 mx-auto mb-6" style={{ color: "#FF9933" }} />
          <h2 className="text-[2rem] font-bold text-white mb-4" style={{ letterSpacing: "-0.025em" }}>Already have an Entitle certificate?</h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">Verify any eligibility certificate instantly on the Polygon blockchain to ensure it is authentic and tamper-proof.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input id="hashInput" type="text" placeholder="Enter Certificate ID..." className="w-full px-4 py-3 rounded text-sm outline-none border border-white/20 bg-white/5 text-white placeholder-white/30 focus:border-[#0B3CC8] transition-colors" />
            <button onClick={() => {
              const el = document.getElementById("hashInput") as HTMLInputElement;
              if (el && el.value) window.location.href = `/certificate?id=${el.value}`;
            }} className="w-full sm:w-auto shrink-0 font-semibold px-6 py-3 rounded text-sm transition-all hover:opacity-90" style={{ background: "#0B3CC8", color: "#fff" }}>
              Verify On-Chain
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-center mb-4" style={{ color: "#E8620A" }}>
            Platform Questions
          </p>
          <h2 className="text-[1.9rem] font-bold text-[#0F172A] text-center mb-12" style={{ letterSpacing: "-0.025em" }}>
            Frequently Asked Questions
          </h2>

          <div className="border-t border-[#E2E8F0]">
            {faqs.map((f, i) => (
              <div key={i} className="border-b border-[#E2E8F0]">
                <button
                  className="w-full flex items-center justify-between py-5 text-left gap-6 group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-[#0F172A] text-sm group-hover:text-[#0B3CC8] transition-colors">
                    {f.q}
                  </span>
                  {openFaq === i
                    ? <Minus className="w-4 h-4 shrink-0" style={{ color: "#0B3CC8" }} />
                    : <Plus className="w-4 h-4 shrink-0 text-[#64748B]" />
                  }
                </button>
                {openFaq === i && (
                  <div className="pb-5 text-[13px] text-[#64748B] leading-relaxed">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-14 px-6" style={{ background: "#0A1628" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
            {/* Brand col */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 border-2 flex items-center justify-center font-bold text-base" style={{ borderColor: "#3B5BDB", color: "#7C9EFF", fontFamily: "var(--font-open-sans)" }}>E</div>
                <div>
                  <div className="font-bold text-white text-sm" style={{ fontFamily: "var(--font-open-sans)" }}>ENTITLE</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-widest">Welfare Access Platform</div>
                </div>
              </div>
              <p className="text-[13px] text-white/35 leading-relaxed mb-5 max-w-xs">
                An independent, public-interest platform empowering citizens with rule-based eligibility knowledge and verifiable entitlement proofs.
              </p>
              <div className="flex flex-col gap-2 text-[13px] text-white/40">
                <a href="tel:18001100001" className="flex items-center gap-2 hover:text-white/70 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> 1800-11-0001
                </a>
                <a href="mailto:support@entitle.in" className="flex items-center gap-2 hover:text-white/70 transition-colors">
                  <Mail className="w-3.5 h-3.5" /> support@entitle.in
                </a>
              </div>
            </div>

            {/* Link cols */}
            {Object.entries(footerLinks).map(([col, links]) => (
              <div key={col}>
                <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-5">{col}</h4>
                <ul className="space-y-3">
                  {links.map((l) => (
                    <li key={l}>
                      <a href="#" onClick={e => e.preventDefault()} className="text-[13px] text-white/40 hover:text-white/80 transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-white/25">
              © 2026 Entitle Project — An independent welfare access initiative. Not affiliated with the Government of India.
            </p>
            <div className="flex items-center gap-5 text-[12px] text-white/30">
              {["National Portal", "RTI", "Accessibility", "Terms", "Privacy"].map((l) => (
                <a key={l} href="#" onClick={e => e.preventDefault()} className="hover:text-white/60 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
