import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-saffron/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indiagreen/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center md:pb-20 md:pt-28">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-saffron-600" />
          Rules decide · AI explains · Blockchain verifies
        </p>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          Know What You’re Entitled To.{" "}
          <span className="bg-gradient-to-r from-saffron via-amber-500 to-indiagreen bg-clip-text text-transparent">
            Claim What’s Yours.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 md:text-lg">
          Answer a few simple questions and ENTITLE checks 12 major government
          welfare schemes in under 60 seconds — with plain-language AI
          explanations in English and हिंदी, and a blockchain-verified
          certificate of your eligibility.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/assistant"
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
          >
            Find my schemes <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how-it-works"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto"
            )}
          >
            How it works
          </a>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          No login. No documents to start. Your session stays anonymous.
        </p>
      </div>
    </section>
  );
}
