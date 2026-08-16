"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import CertificateView from "@/components/certificate/CertificateView";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCertificate, getErrorMessage, type Certificate } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function CertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="py-32">
          <LoadingSpinner size="lg" label="Loading certificate…" />
        </div>
      }
    >
      <CertificateContent />
    </Suspense>
  );
}

function CertificateContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(idParam);
    if (!idParam || !Number.isInteger(id) || id <= 0) {
      setError(
        "This link is missing a valid certificate id. Generate a certificate from your dashboard first."
      );
      setLoading(false);
      return;
    }
    let cancelled = false;
    getCertificate(id)
      .then((cert) => {
        if (!cancelled) setCertificate(cert);
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
  }, [idParam]);

  if (loading) {
    return (
      <div className="py-32">
        <LoadingSpinner size="lg" label="Loading certificate…" />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Certificate not found
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {error ?? "We could not load this certificate."}
        </p>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }), "mt-8")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      <CertificateView certificate={certificate} />

      <p className="mt-4 text-center text-xs text-slate-400 print:hidden">
        Anyone can verify this certificate by scanning the QR code — it opens a
        public verification page.
      </p>
    </div>
  );
}
