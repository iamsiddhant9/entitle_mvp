"use client";

// Public verification page — the target of the certificate QR code.
// Must work standalone with nothing but the hash in the URL.

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { ChainStatusBadge } from "@/components/certificate/CertificateView";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import {
  ApiError,
  getErrorMessage,
  verifyCertificate,
  type VerifyResult,
} from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

export default function VerifyPage({
  params,
}: {
  params: { hash: string };
}) {
  const hash = decodeURIComponent(params.hash);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    verifyCertificate(hash)
      .then((res) => {
        if (cancelled) return;
        if (res.exists) setResult(res);
        else setNotFound(true);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hash]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
        ENTITLE Certificate Verification
      </p>

      {loading ? (
        <div className="py-24">
          <LoadingSpinner size="lg" label="Verifying certificate…" />
        </div>
      ) : error ? (
        <div className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <p className="mt-2 text-xs text-rose-500">
            Could not reach the verification service. Please try again in a
            moment.
          </p>
        </div>
      ) : notFound || !result ? (
        <NotFoundCard hash={hash} />
      ) : (
        <ResultCard result={result} />
      )}
    </div>
  );
}

function NotFoundCard({ hash }: { hash: string }) {
  return (
    <div className="mt-10 rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
      <XCircle className="mx-auto h-16 w-16 text-rose-500" />
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
        No certificate matches this hash
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        The certificate may have been tampered with, or it was never issued by
        ENTITLE.
      </p>
      <HashBlock hash={hash} />
    </div>
  );
}

function ResultCard({ result }: { result: VerifyResult }) {
  const onChainFailed = result.verified_on_chain === false;

  return (
    <div
      className={cn(
        "mt-10 rounded-2xl border bg-white p-8 text-center shadow-sm",
        onChainFailed ? "border-amber-200" : "border-emerald-200"
      )}
    >
      {onChainFailed ? (
        <>
          <ShieldAlert className="mx-auto h-16 w-16 text-amber-500" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Found in registry, but not verified on-chain
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This hash exists in the ENTITLE registry, but the on-chain check
            could not confirm it.
          </p>
        </>
      ) : (
        <>
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Certificate is authentic
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {result.verified_on_chain === null
              ? "Verified against the ENTITLE registry (blockchain not configured)."
              : "This eligibility hash is anchored on the Polygon Amoy blockchain."}
          </p>
        </>
      )}

      <dl className="mx-auto mt-8 max-w-md space-y-3 text-left text-sm">
        {result.scheme_name ? (
          <Row label="Scheme">
            <span className="font-semibold text-slate-900">
              {result.scheme_name}
            </span>
          </Row>
        ) : null}
        {result.status ? (
          <Row label="Decision">
            <StatusBadge status={result.status} />
          </Row>
        ) : null}
        {result.issued_at ? (
          <Row label="Issued">{formatDate(result.issued_at)}</Row>
        ) : null}
        {result.chain_status ? (
          <Row label="Blockchain">
            <ChainStatusBadge status={result.chain_status} />
          </Row>
        ) : null}
      </dl>

      {result.explorer_url ? (
        <a
          href={result.explorer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-indiagreen-700 hover:underline"
        >
          View transaction on PolygonScan{" "}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null}

      <HashBlock hash={result.eligibility_hash} />
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="font-medium text-slate-800">{children}</dd>
    </div>
  );
}

function HashBlock({ hash }: { hash: string }) {
  return (
    <div className="mt-8 rounded-xl bg-slate-50 p-3 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Eligibility hash
      </p>
      <p className="mt-1 break-all font-mono text-xs text-slate-600">{hash}</p>
    </div>
  );
}
