"use client";

// Global citizen session + questionnaire draft.
// citizen_id is a UUID persisted in localStorage ("entitle_citizen_id");
// answers are the profile draft, also persisted so re-checks come pre-filled.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createCitizen } from "@/lib/api";
import {
  EMPTY_ANSWERS,
  type AnswerValue,
  type ProfileAnswers,
  type ProfileField,
} from "@/lib/questions";

const CITIZEN_ID_KEY = "entitle_citizen_id";
const ANSWERS_KEY = "entitle_answers";

interface CitizenProfileContextValue {
  /** UUID of the anonymous citizen session, or null before one exists. */
  citizenId: string | null;
  /** True once localStorage has been read on the client. */
  ready: boolean;
  /** Draft questionnaire answers (null = unanswered / skipped). */
  answers: ProfileAnswers;
  setAnswer: (field: ProfileField, value: AnswerValue) => void;
  /** Creates the citizen session on first use (POST /api/citizens/) and caches it. */
  ensureCitizen: () => Promise<string>;
  /** Clears the session and all draft answers. */
  reset: () => void;
}

const CitizenProfileContext = createContext<CitizenProfileContextValue | null>(
  null
);

export function CitizenProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [citizenId, setCitizenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ProfileAnswers>(EMPTY_ANSWERS);
  const [ready, setReady] = useState(false);
  const creating = useRef<Promise<string> | null>(null);

  useEffect(() => {
    try {
      const storedId = window.localStorage.getItem(CITIZEN_ID_KEY);
      if (storedId) setCitizenId(storedId);
      const storedAnswers = window.localStorage.getItem(ANSWERS_KEY);
      if (storedAnswers) {
        const parsed = JSON.parse(storedAnswers) as Partial<ProfileAnswers>;
        setAnswers({ ...EMPTY_ANSWERS, ...parsed });
      }
    } catch {
      // Corrupted storage — start fresh.
    }
    setReady(true);
  }, []);

  const setAnswer = useCallback((field: ProfileField, value: AnswerValue) => {
    setAnswers((prev) => {
      const next = { ...prev, [field]: value } as ProfileAnswers;
      try {
        window.localStorage.setItem(ANSWERS_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode) — keep in memory only.
      }
      return next;
    });
  }, []);

  const ensureCitizen = useCallback(async (): Promise<string> => {
    if (citizenId) return citizenId;
    if (!creating.current) {
      creating.current = createCitizen()
        .then(({ citizen_id }) => {
          setCitizenId(citizen_id);
          try {
            window.localStorage.setItem(CITIZEN_ID_KEY, citizen_id);
          } catch {
            // Storage unavailable — session lives for this tab only.
          }
          return citizen_id;
        })
        .finally(() => {
          creating.current = null;
        });
    }
    return creating.current;
  }, [citizenId]);

  const reset = useCallback(() => {
    setCitizenId(null);
    setAnswers(EMPTY_ANSWERS);
    try {
      window.localStorage.removeItem(CITIZEN_ID_KEY);
      window.localStorage.removeItem(ANSWERS_KEY);
    } catch {
      // Storage unavailable — nothing to clear.
    }
  }, []);

  return (
    <CitizenProfileContext.Provider
      value={{ citizenId, ready, answers, setAnswer, ensureCitizen, reset }}
    >
      {children}
    </CitizenProfileContext.Provider>
  );
}

export function useCitizenProfile(): CitizenProfileContextValue {
  const ctx = useContext(CitizenProfileContext);
  if (!ctx) {
    throw new Error(
      "useCitizenProfile must be used within a CitizenProfileProvider"
    );
  }
  return ctx;
}
