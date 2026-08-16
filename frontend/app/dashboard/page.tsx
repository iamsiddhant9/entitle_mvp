"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, Search } from "lucide-react";
import SchemeCard from "@/components/dashboard/SchemeCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  getErrorMessage,
  getResults,
  listSchemes,
  type EligibilityResult,
  type EligibilityStatus,
  type Scheme,
} from "@/lib/api";
import { useCitizenProfile } from "@/context/CitizenProfileContext";
import { cn } from "@/lib/utils";

const SECTIONS: Array<{
  status: EligibilityStatus;
  title: string;
  dot: string;
  blurb: string;
}> = [
  {
    status: "eligible",
    title: "Eligible",
    dot: "bg-emerald-500",
    blurb: "You can claim these today.",
  },
  {
    status: "near_miss",
    title: "Near miss",
    dot: "bg-amber-400",
    blurb: "You’re just one condition away.",
  },
  {
    status: "not_eligible",
    title: "Not eligible",
    dot: "bg-rose-400",
    blurb: "Based on your current answers.",
  },
];

export default function DashboardPage() {
  const { citizenId, ready } = useCitizenProfile();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [results, setResults] = useState<EligibilityResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!ready) return;
    if (!citizenId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([listSchemes(), getResults(citizenId)])
      .then(([schemeList, resultList]) => {
        if (!cancelled) {
          setSchemes(schemeList);
          setResults(resultList);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, citizenId, reloadKey]);

  const schemesByCode = useMemo(() => {
    const map = new Map<string, Scheme>();
    for (const scheme of schemes) map.set(scheme.code, scheme);
    return map;
  }, [schemes]);

  const grouped = useMemo(() => {
    const groups: Record<EligibilityStatus, EligibilityResult[]> = {
      eligible: [],
      near_miss: [],
      not_eligible: [],
    };
    for (const result of results ?? []) {
      (groups[result.status] ?? groups.not_eligible).push(result);
    }
    return groups;
  }, [results]);

  if (!ready || loading) {
    return (
      <div className="py-32">
        <LoadingSpinner size="lg" label="Loading your entitlement report…" />
      </div>
    );
  }

  if (!citizenId) {
    return (
      <EmptyState
        title="Let’s find your schemes first"
        body="We don’t have any answers from you yet. It takes about a minute to check all 12 schemes — no login, no documents."
        cta="Start the eligibility check"
      />
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Could not load your results
        </h1>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <Button
          variant="outline"
          className="mt-8"
          onClick={() => setReloadKey((k) => k + 1)}
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <EmptyState
        title="No results yet"
        body="Your session exists, but your answers haven’t been evaluated yet. Run the quick check to see your schemes."
        cta="Check my eligibility"
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            Your entitlement report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Evaluated across {results.length} schemes · Session{" "}
            <span className="font-mono text-xs">{citizenId.slice(0, 8)}…</span>
          </p>
        </div>
        <Link href="/assistant" className={buttonVariants({ variant: "outline" })}>
          <RefreshCw className="h-4 w-4" /> Re-check eligibility
        </Link>
      </div>

      <div className="mt-8 space-y-10">
        {SECTIONS.map((section) => {
          const list = grouped[section.status];
          return (
            <section key={section.status}>
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={cn("h-2.5 w-2.5 rounded-full", section.dot)}
                />
                <h2 className="text-lg font-bold text-slate-900">
                  {section.title}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {list.length}
                </span>
                <span className="text-xs text-slate-400">
                  · {section.blurb}
                </span>
              </div>
              {list.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  No schemes in this category.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {list.map((result) => (
                    <SchemeCard
                      key={result.id}
                      result={result}
                      scheme={schemesByCode.get(result.scheme_code)}
                      citizenId={citizenId}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-saffron/15 to-indiagreen/15">
        <Search className="h-6 w-6 text-indiagreen" />
      </span>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
      <Link
        href="/assistant"
        className={cn(buttonVariants({ size: "lg" }), "mt-8")}
      >
        {cta}
      </Link>
    </div>
  );
}
