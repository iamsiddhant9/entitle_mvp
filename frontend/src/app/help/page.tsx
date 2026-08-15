"use client";

import Link from "next/link";
import { useState } from "react";
import {
  User,
  ChevronDown,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Brain,
  Scale,
  FileText,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from "lucide-react";

/* ───────────────────────── FAQ DATA ───────────────────────── */

const faqs = [
  {
    question: "What is ENTITLE?",
    answer:
      "ENTITLE is an AI-powered assistance layer that helps citizens discover welfare schemes, understand eligibility requirements, identify required documents and understand their next steps. It does not replace official government portals.",
  },
  {
    question: "How does ENTITLE determine whether I am eligible?",
    answer:
      "Your profile is evaluated against predefined scheme conditions using a deterministic rule engine. The rule engine produces an eligibility status based on the available conditions and your profile data.",
  },
  {
    question: "Does AI decide my eligibility?",
    answer:
      "No. AI does not make the eligibility decision. ENTITLE's rule engine performs the eligibility assessment. AI is used to explain the result in simpler language.",
  },
  {
    question: "What does 'Eligible' mean?",
    answer:
      "Eligible means all the conditions currently configured for that scheme matched the information provided in your profile.",
  },
  {
    question: "What does 'Near Miss' mean?",
    answer:
      "Near Miss means most conditions matched but one or a small number of conditions did not. Review the missing condition shown in your determination before proceeding.",
  },
  {
    question: "What does 'Not Eligible' mean?",
    answer:
      "Not Eligible means that the current profile did not satisfy enough of the configured conditions for the scheme. The result is based on the information available during the assessment.",
  },
  {
    question: "Why does ENTITLE ask for documents?",
    answer:
      "Documents help identify which credentials may be required for a scheme and can be associated with your welfare applications. Document verification is separate from the eligibility decision.",
  },
  {
    question: "What is the blockchain certificate?",
    answer:
      "The certificate is a verifiable record of the eligibility determination. ENTITLE uses blockchain to provide a tamper-evident verification layer for the certificate record.",
  },
  {
    question: "Can ENTITLE apply for a government scheme on my behalf?",
    answer:
      "No. ENTITLE is an assistance and information layer. It does not automatically submit government applications, automate OTPs or bypass CAPTCHA systems.",
  },
  {
    question: "Can I trust the result as final government approval?",
    answer:
      "No. ENTITLE provides an eligibility assessment based on its configured rules and the information provided. It does not represent government approval or replace the relevant government application or verification process.",
  },
];

const quickLinks = [
  {
    icon: Brain,
    title: "Understand your determination",
    description:
      "See how your profile was matched against scheme conditions.",
    href: "/dashboard",
  },
  {
    icon: FileText,
    title: "Check your documents",
    description:
      "Review documents associated with your citizen profile.",
    href: "/documents",
  },
  {
    icon: Scale,
    title: "Browse schemes",
    description:
      "Explore the schemes currently available in the ENTITLE directory.",
    href: "/schemes",
  },
];

/* ───────────────────────── FAQ ITEM ───────────────────────── */

function FAQItem({
  question,
  answer,
  open,
  onClick,
}: {
  question: string;
  answer: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border border-[#E2E8F0] bg-white">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-5 px-6 py-5 text-left"
      >
        <span className="font-semibold text-[#0F172A] text-sm">
          {question}
        </span>

        <ChevronDown
          className={`w-4 h-4 shrink-0 text-[#64748B] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6">
          <div className="border-t border-[#E2E8F0] pt-4">
            <p className="text-[13px] text-[#64748B] leading-6">
              {answer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        fontFamily: "var(--font-open-sans), sans-serif",
        background: "#F3F4F6",
      }}
    >
      {/* Tricolor */}
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

      {/* Utility */}
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
                  label === "Help"
                    ? "text-[#0B3CC8]"
                    : "text-[#475569] hover:text-[#0B3CC8]"
                }`}
              >
                {label}

                {label === "Help" && (
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

      <main
        id="main"
        className="flex-1 max-w-6xl w-full mx-auto px-6 py-10"
      >
        {/* Page heading */}
        <div className="mb-9">
          <div
            className="text-[11px] font-semibold tracking-widest uppercase mb-2"
            style={{ color: "#E8620A" }}
          >
            Support Centre
          </div>

          <h1
            className="text-[2.1rem] font-bold text-[#0F172A]"
            style={{ letterSpacing: "-0.03em" }}
          >
            How can we help?
          </h1>

          <p className="text-[#64748B] text-[14px] mt-2 max-w-2xl">
            Learn how ENTITLE works, understand your eligibility result,
            manage documents and find answers to common questions.
          </p>
        </div>

        {/* Quick links */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {quickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                href={item.href}
                key={item.title}
                className="bg-white border border-[#E2E8F0] p-6 hover:border-[#0B3CC8] transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded flex items-center justify-center mb-5"
                  style={{ background: "#EEF3FF" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#0B3CC8" }} />
                </div>

                <h2 className="font-bold text-[#0F172A] text-sm">
                  {item.title}
                </h2>

                <p className="text-[12.5px] text-[#64748B] leading-relaxed mt-2">
                  {item.description}
                </p>

                <div className="flex items-center gap-1.5 mt-5 text-xs font-bold text-[#0B3CC8]">
                  Open
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* How ENTITLE works */}
        <section className="bg-white border border-[#E2E8F0] mb-8">
          <div className="px-7 py-6 border-b border-[#E2E8F0]">
            <div className="text-[11px] uppercase tracking-widest font-semibold text-[#64748B]">
              The ENTITLE model
            </div>

            <h2 className="text-xl font-bold text-[#0F172A] mt-1">
              How ENTITLE works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
            {/* Rule engine */}
            <div className="p-7">
              <div className="w-11 h-11 bg-[#EEF3FF] rounded flex items-center justify-center mb-5">
                <Scale className="w-5 h-5 text-[#0B3CC8]" />
              </div>

              <div className="text-[11px] uppercase tracking-widest font-bold text-[#0B3CC8]">
                01 · Rule Engine
              </div>

              <h3 className="font-bold text-[#0F172A] mt-2">
                Rule Engine decides
              </h3>

              <p className="text-[12.5px] text-[#64748B] leading-relaxed mt-2">
                Your profile is evaluated against the predefined eligibility
                conditions for each scheme.
              </p>
            </div>

            {/* AI */}
            <div className="p-7">
              <div className="w-11 h-11 bg-[#EEF3FF] rounded flex items-center justify-center mb-5">
                <Brain className="w-5 h-5 text-[#0B3CC8]" />
              </div>

              <div className="text-[11px] uppercase tracking-widest font-bold text-[#0B3CC8]">
                02 · AI
              </div>

              <h3 className="font-bold text-[#0F172A] mt-2">
                AI explains
              </h3>

              <p className="text-[12.5px] text-[#64748B] leading-relaxed mt-2">
                AI converts the assessment result into a clearer explanation
                of what matched, what is missing and what to do next.
              </p>
            </div>

            {/* Blockchain */}
            <div className="p-7">
              <div className="w-11 h-11 bg-[#ECFDF5] rounded flex items-center justify-center mb-5">
                <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
              </div>

              <div className="text-[11px] uppercase tracking-widest font-bold text-[#15803D]">
                03 · Blockchain
              </div>

              <h3 className="font-bold text-[#0F172A] mt-2">
                Blockchain verifies
              </h3>

              <p className="text-[12.5px] text-[#64748B] leading-relaxed mt-2">
                A certificate can provide a verifiable record of the
                assessment through the project's blockchain verification
                layer.
              </p>
            </div>
          </div>
        </section>

        {/* Status explanation */}
        <section className="bg-white border border-[#E2E8F0] mb-8">
          <div className="px-7 py-6 border-b border-[#E2E8F0]">
            <div className="text-[11px] uppercase tracking-widest font-semibold text-[#64748B]">
              Understanding results
            </div>

            <h2 className="text-xl font-bold text-[#0F172A] mt-1">
              What does my status mean?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
            <div className="p-7">
              <CheckCircle2 className="w-6 h-6 text-[#16A34A] mb-4" />

              <h3 className="font-bold text-[#065F46]">Eligible</h3>

              <p className="text-[12.5px] text-[#64748B] leading-relaxed mt-2">
                All configured conditions for the scheme matched the
                information provided in your assessment.
              </p>
            </div>

            <div className="p-7">
              <AlertTriangle className="w-6 h-6 text-[#D97706] mb-4" />

              <h3 className="font-bold text-[#92400E]">Near Miss</h3>

              <p className="text-[12.5px] text-[#64748B] leading-relaxed mt-2">
                Most conditions matched, but one or a small number of
                conditions did not.
              </p>
            </div>

            <div className="p-7">
              <XCircle className="w-6 h-6 text-[#DC2626] mb-4" />

              <h3 className="font-bold text-[#991B1B]">Not Eligible</h3>

              <p className="text-[12.5px] text-[#64748B] leading-relaxed mt-2">
                The current profile did not satisfy enough of the configured
                conditions for the scheme.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="mb-5">
            <div className="text-[11px] uppercase tracking-widest font-semibold text-[#64748B]">
              Frequently Asked Questions
            </div>

            <h2 className="text-xl font-bold text-[#0F172A] mt-1">
              Common questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <FAQItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                open={openFaq === index}
                onClick={() =>
                  setOpenFaq(openFaq === index ? null : index)
                }
              />
            ))}
          </div>
        </section>

        {/* Important note */}
        <div className="mt-8 border border-[#FDE68A] bg-[#FFFBEB] p-6">
          <div className="flex gap-4">
            <HelpCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />

            <div>
              <h3 className="font-bold text-[#92400E] text-sm">
                Important
              </h3>

              <p className="text-[12.5px] text-[#92400E] leading-relaxed mt-1">
                ENTITLE is an independent welfare-access assistance service.
                It does not replace official government portals or represent
                government approval. Always follow the applicable official
                application and verification process.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 bg-[#0B3CC8] text-white p-7 rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <MessageCircle className="w-6 h-6 mt-0.5" />

            <div>
              <h2 className="font-bold text-lg">
                Still need help?
              </h2>

              <p className="text-sm text-blue-100 mt-1">
                Use the ENTITLE assistance flow to review your profile and
                determination.
              </p>
            </div>
          </div>

          <Link
            href="/assistant"
            className="shrink-0 bg-white text-[#0B3CC8] font-bold text-sm px-5 py-3 rounded-sm hover:bg-blue-50 flex items-center gap-2"
          >
            Open Assistant
            <ArrowRight className="w-4 h-4" />
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