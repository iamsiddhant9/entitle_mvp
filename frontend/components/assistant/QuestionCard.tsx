"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnswerValue, Question } from "@/lib/questions";

interface QuestionCardProps {
  question: Question;
  stepTitle: string;
  value: AnswerValue;
  onAnswer: (value: AnswerValue) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLast: boolean;
}

export default function QuestionCard({
  question,
  stepTitle,
  value,
  onAnswer,
  onNext,
  onSkip,
  onBack,
  canGoBack,
  isLast,
}: QuestionCardProps) {
  const [numberText, setNumberText] = useState(
    typeof value === "number" ? String(value) : ""
  );
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, []);

  /** Chips and Yes/No cards auto-advance shortly after a choice is made. */
  function selectAndAdvance(v: AnswerValue) {
    onAnswer(v);
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(onNext, 280);
  }

  const min = question.min;
  const max = question.max;
  const parsed = numberText.trim() === "" ? null : Number(numberText);
  const inRange = (n: number) =>
    (min === undefined || n >= min) && (max === undefined || n <= max);
  const numberValid =
    parsed !== null && Number.isFinite(parsed) && inRange(parsed);

  function handleNumberChange(text: string) {
    setNumberText(text);
    const n = text.trim() === "" ? null : Number(text);
    onAnswer(n !== null && Number.isFinite(n) && inRange(n) ? n : null);
  }

  function commitNumber() {
    if (numberValid) onNext();
  }

  const continueEnabled =
    question.type === "number" ? numberValid : value !== null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
      <p className="text-xs font-bold uppercase tracking-widest text-saffron-600">
        {stepTitle}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
        {question.title}
      </h2>
      {question.subtitle ? (
        <p className="mt-2 text-sm text-slate-500">{question.subtitle}</p>
      ) : null}

      <div className="mt-8">
        {question.type === "number" && (
          <div>
            <div className="flex max-w-xs items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 transition-colors focus-within:border-indiagreen focus-within:ring-2 focus-within:ring-indiagreen/20">
              {question.unit === "₹" ? (
                <span className="text-lg font-semibold text-slate-400">₹</span>
              ) : null}
              <input
                type="number"
                inputMode="numeric"
                autoFocus
                min={min}
                max={max}
                value={numberText}
                placeholder={question.placeholder}
                onChange={(e) => handleNumberChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitNumber();
                }}
                className="w-full bg-transparent text-lg font-semibold text-slate-900 outline-none placeholder:text-slate-300"
              />
              {question.unit && question.unit !== "₹" ? (
                <span className="text-sm text-slate-400">{question.unit}</span>
              ) : null}
            </div>
            {numberText.trim() !== "" && !numberValid ? (
              <p className="mt-2 text-xs font-medium text-rose-600">
                Please enter a value between {min ?? 0} and {max ?? "∞"}.
              </p>
            ) : null}
            {question.quickPicks ? (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {question.quickPicks.map((pick) => (
                    <button
                      key={pick.label}
                      type="button"
                      onClick={() => handleNumberChange(String(pick.value))}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                        parsed === pick.value
                          ? "border-indiagreen bg-indiagreen-50 text-indiagreen-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {pick.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Quick picks fill a typical value — you can edit it.
                </p>
              </>
            ) : null}
          </div>
        )}

        {question.type === "chips" && (
          <div className="flex flex-wrap gap-2.5">
            {question.options?.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => selectAndAdvance(option.value)}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
                  value === option.value
                    ? "border-indiagreen bg-indiagreen-50 text-indiagreen-700 ring-2 ring-indiagreen/30"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {question.type === "select" && (
          <select
            value={typeof value === "string" ? value : ""}
            onChange={(e) =>
              onAnswer(e.target.value === "" ? null : e.target.value)
            }
            className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition-colors focus:border-indiagreen focus:ring-2 focus:ring-indiagreen/20"
          >
            <option value="">Select from the list…</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {question.type === "boolean" && (
          <div className="grid max-w-md grid-cols-2 gap-3">
            {[
              { v: true, label: "Yes" },
              { v: false, label: "No" },
            ].map(({ v, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => selectAndAdvance(v)}
                className={cn(
                  "rounded-2xl border-2 px-6 py-6 text-lg font-bold transition-all",
                  value === v
                    ? v
                      ? "border-indiagreen bg-indiagreen-50 text-indiagreen-700"
                      : "border-slate-500 bg-slate-100 text-slate-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <div>
          {canGoBack ? (
            <Button variant="ghost" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="text-slate-400" onClick={onSkip}>
            Skip
          </Button>
          <Button
            onClick={question.type === "number" ? commitNumber : onNext}
            disabled={!continueEnabled}
          >
            {isLast ? (
              <>
                See my results <Sparkles className="h-4 w-4" />
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
