"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import {
  confirmDocument,
  getErrorMessage,
  missingDocuments,
  uploadDocument,
  type DocType,
  type MissingDocumentsResponse,
  type UploadedDocument,
} from "@/lib/api";
import { cn, humanize } from "@/lib/utils";

const DOC_LABELS: Record<string, string> = {
  aadhaar_card: "Aadhaar Card",
  land_ownership_document: "Land Ownership Document",
  income_certificate: "Income Certificate",
  bank_passbook: "Bank Passbook",
  ration_card: "Ration Card",
  birth_certificate: "Birth Certificate",
};

const docLabel = (docType: string) => DOC_LABELS[docType] ?? humanize(docType);

interface PendingDoc {
  doc: UploadedDocument;
  confirming: boolean;
  error: string | null;
}

export default function DocumentsPanel({
  citizenId,
  schemeCode,
}: {
  citizenId: string;
  schemeCode: string;
}) {
  const [data, setData] = useState<MissingDocumentsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, PendingDoc>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await missingDocuments(citizenId, schemeCode);
      setData(res);
    } catch (err) {
      setLoadError(getErrorMessage(err));
    }
  }, [citizenId, schemeCode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleFile(docType: string, file: File) {
    setUploading((prev) => ({ ...prev, [docType]: true }));
    setUploadErrors((prev) => ({ ...prev, [docType]: "" }));
    try {
      const doc = await uploadDocument(citizenId, docType as DocType, file);
      setPending((prev) => ({
        ...prev,
        [docType]: { doc, confirming: false, error: null },
      }));
    } catch (err) {
      setUploadErrors((prev) => ({ ...prev, [docType]: getErrorMessage(err) }));
    } finally {
      setUploading((prev) => ({ ...prev, [docType]: false }));
    }
  }

  async function handleConfirm(docType: string) {
    const entry = pending[docType];
    if (!entry) return;
    setPending((prev) => ({
      ...prev,
      [docType]: { ...entry, confirming: true, error: null },
    }));
    try {
      await confirmDocument(
        entry.doc.document_id,
        true,
        entry.doc.extracted_fields
      );
      setPending((prev) => {
        const next = { ...prev };
        delete next[docType];
        return next;
      });
      await refresh();
    } catch (err) {
      setPending((prev) => ({
        ...prev,
        [docType]: { ...entry, confirming: false, error: getErrorMessage(err) },
      }));
    }
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="text-sm font-medium text-rose-600">{loadError}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => void refresh()}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <LoadingSpinner size="sm" label="Checking required documents…" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <FileText className="h-4 w-4 text-indiagreen" /> Documents
        <span className="text-xs font-medium text-slate-400">
          {data.uploaded_documents.length}/{data.required_documents.length}{" "}
          confirmed
        </span>
      </p>

      <div className="mt-3 space-y-3">
        {data.required_documents.length === 0 ? (
          <p className="text-sm text-slate-400">
            This scheme has no document requirements on record.
          </p>
        ) : (
          data.required_documents.map((docType) => {
            const isUploaded = data.uploaded_documents.includes(docType);
            const entry = pending[docType];
            const busy = Boolean(uploading[docType]);
            const inputId = `doc-${schemeCode}-${docType}`;

            return (
              <div
                key={docType}
                className="rounded-xl border border-slate-200 bg-white p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <FileText className="h-4 w-4 text-slate-400" />
                    {docLabel(docType)}
                  </p>
                  {isUploaded ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Confirmed
                    </span>
                  ) : (
                    <div>
                      <input
                        id={inputId}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        disabled={busy}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleFile(docType, file);
                          e.target.value = "";
                        }}
                      />
                      <label
                        htmlFor={inputId}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "cursor-pointer",
                          busy && "pointer-events-none opacity-50"
                        )}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {busy
                          ? "Uploading…"
                          : entry
                            ? "Re-upload"
                            : "Upload"}
                      </label>
                    </div>
                  )}
                </div>

                {uploadErrors[docType] ? (
                  <p className="mt-2 text-xs font-medium text-rose-600">
                    {uploadErrors[docType]}
                  </p>
                ) : null}

                {entry && !isUploaded ? (
                  <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                    {entry.doc.is_blurry ? (
                      <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        This photo looks blurry — please re-upload a clearer
                        photo.
                      </p>
                    ) : null}
                    {entry.doc.is_expired ? (
                      <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        This document appears to be expired.
                      </p>
                    ) : null}

                    {Object.keys(entry.doc.extracted_fields).length > 0 ? (
                      <dl className="space-y-1.5">
                        {Object.entries(entry.doc.extracted_fields).map(
                          ([key, val]) => (
                            <div
                              key={key}
                              className="flex justify-between gap-4 text-xs"
                            >
                              <dt className="font-medium text-slate-500">
                                {humanize(key)}
                              </dt>
                              <dd className="text-right font-semibold text-slate-800">
                                {typeof val === "object" && val !== null
                                  ? JSON.stringify(val)
                                  : String(val)}
                              </dd>
                            </div>
                          )
                        )}
                      </dl>
                    ) : (
                      <p className="text-xs text-slate-400">
                        No fields could be read from this document.
                      </p>
                    )}

                    {entry.error ? (
                      <p className="text-xs font-medium text-rose-600">
                        {entry.error}
                      </p>
                    ) : null}

                    <Button
                      size="sm"
                      onClick={() => void handleConfirm(docType)}
                      disabled={entry.confirming}
                    >
                      {entry.confirming
                        ? "Confirming…"
                        : "Looks correct — confirm"}
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
