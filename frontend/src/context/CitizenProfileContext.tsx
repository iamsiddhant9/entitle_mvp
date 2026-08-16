"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  createCitizenSession,
  getCitizenProfile,
  updateCitizenProfile,
  evaluateEligibility,
  getEligibilityResults,
  CitizenProfile,
  CitizenProfilePatch,
  EligibilityResult,
  ApiError,
} from "@/lib/api";

/* ─── Types ─── */

interface CitizenContextValue {
  citizenId: string | null;
  profile: CitizenProfile | null;
  eligibilityResults: EligibilityResult[];
  isLoading: boolean;
  error: string | null;

  /** Create a new anonymous session (called once on first visit). */
  initSession: () => Promise<void>;
  /** Patch profile fields — stores them and re-evaluates eligibility. */
  saveProfile: (patch: CitizenProfilePatch) => Promise<void>;
  /** Re-run eligibility evaluation and refresh results. */
  refreshEligibility: () => Promise<void>;
  /** Clear error message. */
  clearError: () => void;
}

/* ─── Context ─── */

const CitizenContext = createContext<CitizenContextValue | null>(null);

const STORAGE_KEY = "entitle_citizen_id";

export function CitizenProfileProvider({ children }: { children: ReactNode }) {
  const [citizenId, setCitizenId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* On mount — restore or create session */
  useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null;

    if (stored) {
      setCitizenId(stored);
      // Hydrate profile + cached results in background
      (async () => {
        try {
          const [prof, results] = await Promise.all([
            getCitizenProfile(stored),
            getEligibilityResults(stored),
          ]);
          setProfile(prof);
          setEligibilityResults(results);
        } catch {
          // If 404, the session expired — start fresh
          localStorage.removeItem(STORAGE_KEY);
          setCitizenId(null);
        }
      })();
    }
  }, []);

  const initSession = useCallback(async () => {
    if (citizenId) return; // already initialised
    setIsLoading(true);
    try {
      const session = await createCitizenSession();
      localStorage.setItem(STORAGE_KEY, session.citizen_id);
      setCitizenId(session.citizen_id);
      const prof = await getCitizenProfile(session.citizen_id);
      setProfile(prof);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to start session.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [citizenId]);

  const saveProfile = useCallback(
    async (patch: CitizenProfilePatch) => {
      if (!citizenId) return;
      setIsLoading(true);
      setError(null);
      try {
        const updated = await updateCitizenProfile(citizenId, patch);
        setProfile(updated);
        // Auto-evaluate after every profile save
        const evalResult = await evaluateEligibility(citizenId);
        setEligibilityResults(evalResult.results);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Failed to save profile.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [citizenId]
  );

  const refreshEligibility = useCallback(async () => {
    if (!citizenId) return;
    setIsLoading(true);
    try {
      const evalResult = await evaluateEligibility(citizenId);
      setEligibilityResults(evalResult.results);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to evaluate eligibility.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [citizenId]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <CitizenContext.Provider
      value={{
        citizenId,
        profile,
        eligibilityResults,
        isLoading,
        error,
        initSession,
        saveProfile,
        refreshEligibility,
        clearError,
      }}
    >
      {children}
    </CitizenContext.Provider>
  );
}

export function useCitizen(): CitizenContextValue {
  const ctx = useContext(CitizenContext);
  if (!ctx) {
    throw new Error("useCitizen must be used inside <CitizenProfileProvider>");
  }
  return ctx;
}
