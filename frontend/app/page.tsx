import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import HowItWorks from "@/components/landing/HowItWorks";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <HowItWorks />
      <section className="mx-auto max-w-4xl px-4 pb-24">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-saffron/10 via-white to-indiagreen/10 p-8 text-center shadow-sm md:p-12">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            Sixty seconds. Twelve schemes. Zero guesswork.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
            Your answers stay in an anonymous session — no name, no phone
            number, no Aadhaar required to check your eligibility.
          </p>
          <Link
            href="/assistant"
            className={cn(buttonVariants({ size: "lg" }), "mt-8")}
          >
            Check my eligibility <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
