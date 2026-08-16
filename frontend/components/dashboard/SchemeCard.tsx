"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, ChevronDown, ExternalLink, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import ExplainPanel from "./ExplainPanel";
import DocumentsPanel from "./DocumentsPanel";
import {
  getErrorMessage,
  issueCertificate,
  type EligibilityResult,
  type Scheme,
} from "@/lib/api";
import { cn, formatRuleLabel } from "@/lib/utils";

interface SchemeCardProps {
  result: EligibilityResult;
  scheme?: Scheme;
  citizenId: string;
}

export default function SchemeCard({
  result,
  scheme,
  citizenId,
}: SchemeCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  async function handleIssue() {
    setIssuing(true);
    setIssueError(null);
    try {
      const issued = await issueCertificate(result.id);
      router.push(`/certificate?id=${issued.certificate_id}`);
    } catch (err) {
      setIssueError(getErrorMessage(err));
      setIssuing(false);
    }
  }

  const showMissing =
    result.status !== "eligible" && result.missing_rules.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        className="w-full p-5 text-left md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            {scheme?.domain ? (
              <Badge variant="secondary">{scheme.domain}</Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={result.status} />
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 transition-transform",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>

        <h3 className="mt-3 text-lg font-bold text-slate-900">
          {result.scheme_name}
        </h3>
        {scheme?.benefit ? (
          <p className="mt-1 text-sm font-semibold text-indiagreen-700">
            {scheme.benefit}
          </p>
        ) : null}

        {result.status === "eligible" ? (
          <p className="mt-2 text-xs font-medium text-slate-500">
            You meet all {result.matched_rules.length} conditions for this
            scheme.
          </p>
        ) : showMissing ? (
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              What’s missing
            </p>
            <ul className="mt-1.5 space-y-1">
              {result.missing_rules.map((rule, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-sm text-slate-600"
                >
                  <XCircle
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      result.status === "near_miss"
                        ? "text-amber-500"
                        : "text-rose-400"
                    )}
                  />
                  {formatRuleLabel(rule)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-slate-100 p-5 md:p-6">
          <ExplainPanel resultId={result.id} />

          {result.status !== "not_eligible" ? (
            <DocumentsPanel
              citizenId={citizenId}
              schemeCode={result.scheme_code}
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-4">
            {result.status === "eligible" ? (
              <Button onClick={() => void handleIssue()} disabled={issuing}>
                <Award className="h-4 w-4" />
                {issuing ? "Generating certificate…" : "Generate certificate"}
              </Button>
            ) : null}
            {scheme?.source_url ? (
              <a
                href={scheme.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indiagreen-700 hover:underline"
              >
                Official portal <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>

          {issueError ? (
            <p className="text-sm font-medium text-rose-600">{issueError}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
