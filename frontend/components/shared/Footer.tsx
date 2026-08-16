import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-saffron to-indiagreen">
              <ShieldCheck className="h-4 w-4 text-white" />
            </span>
            <span className="font-extrabold tracking-tight text-slate-900">
              ENTITLE
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Know what you’re entitled to. Claim what’s yours.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/assistant"
                className="text-slate-600 hover:text-slate-900"
              >
                Check eligibility
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard"
                className="text-slate-600 hover:text-slate-900"
              >
                My results
              </Link>
            </li>
            <li>
              <Link
                href="/#how-it-works"
                className="text-slate-600 hover:text-slate-900"
              >
                How it works
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Disclaimer
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            ENTITLE is an independent hackathon prototype — an assistance layer
            on top of official portals. It is not affiliated with the Government
            of India. Always confirm details on the official scheme portal
            before applying.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-slate-400">
          <p>Built for India’s citizens · MIT License</p>
          <p>Rule engine decides · Gemini explains · Polygon verifies</p>
        </div>
      </div>
    </footer>
  );
}
