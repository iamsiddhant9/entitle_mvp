"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import ProgressBar from "@/components/assistant/ProgressBar";
import QuestionCard from "@/components/assistant/QuestionCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { evaluate, getErrorMessage, updateProfile } from "@/lib/api";
import { ALL_QUESTIONS, STEPS } from "@/lib/questions";
import { useCitizenProfile } from "@/context/CitizenProfileContext";

export default function AssistantPage() {
  const router = useRouter();
  const { answers, setAnswer, ensureCitizen } = useCitizenProfile();
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stepTitles = useMemo(() => STEPS.map((s) => s.title), []);
  const question = ALL_QUESTIONS[index];
  const isLast = index === ALL_QUESTIONS.length - 1;

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      setStatusText("Creating your anonymous session…");
      const citizenId = await ensureCitizen();
      setStatusText("Saving your answers…");
      await updateProfile(citizenId, answers);
      setStatusText("Running the rule engine across all schemes…");
      await evaluate(citizenId);
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (isLast) {
      void finish();
    } else {
      setIndex((i) => Math.min(i + 1, ALL_QUESTIONS.length - 1));
    }
  }

  function handleSkip() {
    setAnswer(question.field, null);
    handleNext();
  }

  function handleBack() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  if (submitting) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
        <div className="relative">
          <span className="absolute inset-0 -m-3 animate-ping rounded-2xl bg-indiagreen/10" />
          <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-saffron to-indiagreen shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </span>
        </div>
        <h1 className="mt-8 text-2xl font-bold text-slate-900">
          Evaluating your entitlements…
        </h1>
        <p className="mt-2 text-sm text-slate-500">{statusText}</p>
        <p className="mt-6 max-w-sm text-xs text-slate-400">
          Checking all 12 schemes with a deterministic rule engine — no AI
          decides your eligibility.
        </p>
        <LoadingSpinner className="mt-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <ProgressBar
        stepTitles={stepTitles}
        stepIndex={question.stepIndex}
        questionNumber={index + 1}
        questionCount={ALL_QUESTIONS.length}
      />

      {error ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <div key={index} className="mt-6 animate-question-in">
        <QuestionCard
          question={question}
          stepTitle={question.stepTitle}
          value={answers[question.field]}
          onAnswer={(v) => setAnswer(question.field, v)}
          onNext={handleNext}
          onSkip={handleSkip}
          onBack={handleBack}
          canGoBack={index > 0}
          isLast={isLast}
        />
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        You can skip any question — skipped answers simply count as unknown.
      </p>
    </div>
  );
}
