import {
  ClipboardList,
  MessagesSquare,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  text: string;
}

const HOW_IT_WORKS_STEPS: Step[] = [
  {
    icon: ClipboardList,
    title: "Discover",
    text: "Answer 14 quick questions about yourself — no documents or login needed.",
  },
  {
    icon: Scale,
    title: "Evaluate",
    text: "A deterministic rule engine checks all 12 schemes. No AI ever decides your eligibility.",
  },
  {
    icon: MessagesSquare,
    title: "Explain",
    text: "Gemini explains every decision in plain English or हिंदी, grounded in the actual rules.",
  },
  {
    icon: ShieldCheck,
    title: "Verify",
    text: "Generate a tamper-proof certificate anchored on Polygon — anyone can scan the QR to verify it.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-4 pb-20">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          How it works
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
          From “I don’t know what I qualify for” to a verifiable certificate in
          four steps.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <div
            key={step.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-saffron/15 to-indiagreen/15">
                <step.icon className="h-5 w-5 text-indiagreen" />
              </span>
              <span className="text-xs font-extrabold text-slate-300">
                0{index + 1}
              </span>
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
