"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { explain, getErrorMessage, type ExplainLanguage } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ExplainPanel({ resultId }: { resultId: number }) {
  const [language, setLanguage] = useState<ExplainLanguage>("en");
  const [texts, setTexts] = useState<Partial<Record<ExplainLanguage, string>>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  async function load(lang: ExplainLanguage) {
    setLanguage(lang);
    setOpened(true);
    if (texts[lang]) return;
    setLoading(true);
    setError(null);
    try {
      const res = await explain(resultId, lang);
      setTexts((prev) => ({ ...prev, [lang]: res.explanation }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Sparkles className="h-4 w-4 text-saffron-600" /> AI explanation
        </p>
        {opened ? (
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {(["en", "hi"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => void load(lang)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-bold transition-colors",
                  language === lang
                    ? "bg-indiagreen text-white"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {lang === "en" ? "EN" : "हिंदी"}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        {!opened ? (
          <Button variant="outline" size="sm" onClick={() => void load(language)}>
            Why? Explain this decision
          </Button>
        ) : loading ? (
          <LoadingSpinner
            size="sm"
            label="Writing a plain-language explanation…"
            className="py-3"
          />
        ) : error ? (
          <div>
            <p className="text-sm font-medium text-rose-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => void load(language)}
            >
              Try again
            </Button>
          </div>
        ) : (
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {texts[language]}
          </p>
        )}
      </div>
    </div>
  );
}
