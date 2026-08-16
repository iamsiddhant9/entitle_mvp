"use client";

import { QRCodeSVG } from "qrcode.react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Certificate, ChainStatus } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const CHAIN_BADGES: Record<
  ChainStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  submitted: { label: "Anchored on Polygon Amoy", variant: "success" },
  simulated: {
    label: "Simulated — blockchain not configured",
    variant: "secondary",
  },
  failed: { label: "On-chain submission failed", variant: "warning" },
};

export function ChainStatusBadge({ status }: { status: ChainStatus }) {
  const config = CHAIN_BADGES[status] ?? CHAIN_BADGES.simulated;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function CertificateView({
  certificate,
}: {
  certificate: Certificate;
}) {
  const payload = certificate.payload;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      {/* Tricolor accent strip */}
      <div className="h-2 bg-gradient-to-r from-saffron via-slate-100 to-indiagreen" />

      <div className="p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-saffron to-indiagreen">
              <ShieldCheck className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-slate-900">
                ENTITLE
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Eligibility Certificate
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold">Certificate No. ENT-{certificate.id}</p>
            <p>Issued {formatDate(certificate.issued_at)}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-500">
              This certifies that the anonymous citizen identified below was
              evaluated by the ENTITLE deterministic rule engine for
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900 md:text-3xl">
              {payload.scheme_name}
            </h2>
            <div className="mt-3">
              <StatusBadge status={payload.status} />
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Citizen ID
                </dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-slate-700">
                  {payload.citizen_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Scheme code
                </dt>
                <dd className="mt-0.5 font-mono text-xs text-slate-700">
                  {payload.scheme_code}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Evaluated at
                </dt>
                <dd className="mt-0.5 font-medium text-slate-700">
                  {formatDate(payload.evaluated_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Issued at
                </dt>
                <dd className="mt-0.5 font-medium text-slate-700">
                  {formatDate(certificate.issued_at)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="shrink-0 self-center rounded-2xl border border-slate-200 bg-white p-4 text-center md:self-start">
            <QRCodeSVG value={certificate.qr_payload} size={140} />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Scan to verify
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Eligibility hash (SHA-256)
          </p>
          <p className="mt-1 break-all font-mono text-xs text-slate-700">
            {certificate.eligibility_hash}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ChainStatusBadge status={certificate.chain_status} />
          {certificate.explorer_url ? (
            <a
              href={certificate.explorer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indiagreen-700 hover:underline print:hidden"
            >
              View transaction on PolygonScan{" "}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {certificate.tx_hash ? (
            <span className="hidden break-all font-mono text-[10px] text-slate-400 print:inline">
              tx: {certificate.tx_hash}
            </span>
          ) : null}
        </div>

        <p className="mt-8 border-t border-slate-100 pt-4 text-[11px] leading-relaxed text-slate-400">
          This certificate records the output of a deterministic rule
          evaluation over self-declared answers. It contains no personal
          information — only its SHA-256 hash is anchored on the blockchain. It
          is not a government-issued document; always confirm on the official
          scheme portal.
        </p>
      </div>
    </div>
  );
}
