"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User, RefreshCw, FileDown, CheckCircle2,
  AlertTriangle, XCircle, ChevronRight, Loader2, X,
} from "lucide-react";
import { useCitizen } from "@/context/CitizenProfileContext";
import {
  explainEligibility, issueCertificate, listSchemes,
  EligibilityResult, SchemeListItem, ApiError,
} from "@/lib/api";

/* ─────────────── Helpers ─────────────── */

function StatusBadge({ status }: { status: string }) {
  if (status === "eligible")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
        <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
      </span>
    );
  if (status === "near_miss")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
        <AlertTriangle className="w-3.5 h-3.5" /> Near Miss
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
      <XCircle className="w-3.5 h-3.5" /> Not Eligible
    </span>
  );
}

const navItems = [
  { label: "Overview", href: "/" },
  { label: "My Profile", href: "/profile" },
  { label: "My determination", href: "/dashboard", active: true },
  { label: "Schemes directory", href: "/schemes" },
  { label: "Documents", href: "/documents" },
  { label: "Help", href: "/help" },
];

/* ─────────────── PAGE ─────────────── */

export default function Dashboard() {
  const { citizenId, profile, eligibilityResults, isLoading, error, refreshEligibility, clearError } = useCitizen();

  const [schemes, setSchemes] = useState<SchemeListItem[]>([]);
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [loadingExplain, setLoadingExplain] = useState<number | null>(null);
  const [issuingCert, setIssuingCert] = useState<number | null>(null);
  const [certLinks, setCertLinks] = useState<Record<number, string>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  /* Load scheme metadata for name/amount display */
  useEffect(() => {
    listSchemes().then(setSchemes).catch(() => {});
  }, []);

  /* Auto-evaluate if there are no results yet but we have a citizenId */
  useEffect(() => {
    if (citizenId && eligibilityResults.length === 0 && !isLoading) {
      refreshEligibility();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citizenId]);

  /* Enrich results with scheme metadata */
  const schemeMap = Object.fromEntries(schemes.map(s => [s.code, s]));

  const eligible = eligibilityResults.filter(r => r.status === "eligible");
  const nearMiss = eligibilityResults.filter(r => r.status === "near_miss");
  const notEligible = eligibilityResults.filter(r => r.status === "not_eligible");

  async function handleExplain(result: EligibilityResult) {
    if (!citizenId) return;
    setLoadingExplain(result.id);
    try {
      const res = await explainEligibility({
        eligibility_result_id: result.id,
        citizen_id: citizenId,
        language: "en",
      });
      setExplanations(prev => ({ ...prev, [result.id]: res.explanation }));
    } catch (e) {
      setLocalError(e instanceof ApiError ? e.message : "Failed to explain result.");
    } finally {
      setLoadingExplain(null);
    }
  }

  async function handleIssueCert(result: EligibilityResult) {
    setIssuingCert(result.id);
    try {
      const cert = await issueCertificate(result.id);
      setCertLinks(prev => ({ ...prev, [result.id]: `/certificate?id=${cert.certificate_id}` }));
    } catch (e) {
      setLocalError(e instanceof ApiError ? e.message : "Failed to issue certificate.");
    } finally {
      setIssuingCert(null);
    }
  }

  const displayName = profile?.state ? `Citizen · ${profile.state}` : "Citizen";
  const displayRef = citizenId ? `ENT-${citizenId.slice(0, 8).toUpperCase()}` : "—";

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-open-sans), sans-serif", background: "#F3F4F6" }}>
      {/* Tricolor bar */}
      <div className="flex h-[5px] w-full">
        <div className="flex-1" style={{ background: "#FF9933" }} />
        <div className="flex-1" style={{ background: "#FFFFFF", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }} />
        <div className="flex-1" style={{ background: "#138808" }} />
      </div>

      {/* Utility bar */}
      <div className="text-[11.5px] font-medium py-2 px-6" style={{ background: "#1C1C1C", color: "#A0A0A0" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="#main" onClick={e => e.preventDefault()} className="hover:text-white transition-colors">Skip to content</a>
            <span className="text-[#3A3A3A]">|</span>
            <span>A public-interest service. Not a Government of India portal.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Helpline <strong className="text-white">1800-11-0001</strong></span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-11 h-11 border-2 flex items-center justify-center font-bold text-xl" style={{ borderColor: "#0B3CC8", color: "#0B3CC8" }}>E</div>
            <div>
              <div className="text-xl font-bold tracking-tight" style={{ color: "#0B3CC8" }}>ENTITLE</div>
              <div className="text-[11px] text-[#64748B] mt-0.5 font-medium">Welfare Entitlement Assistance · Citizen Services</div>
            </div>
          </Link>
          <div className="flex items-center gap-8">
            <div className="text-right hidden md:block">
              <div className="text-[11px] text-[#64748B] font-medium">Citizen reference</div>
              <div className="font-bold text-[#0F172A] text-sm tracking-wide mt-0.5">{displayRef}</div>
            </div>
            <div className="w-px h-10 bg-[#E2E8F0] hidden md:block" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF" }}>
                <User className="w-5 h-5" style={{ color: "#0B3CC8" }} />
              </div>
              <div>
                <div className="font-semibold text-[#0F172A] text-sm">Anonymous Citizen</div>
                <div className="text-[11px] text-[#64748B]">{displayName}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <nav className="flex items-center">
            {navItems.map(item => (
              <Link key={item.label} href={item.href} className={`relative px-4 py-4 text-sm font-medium transition-colors ${item.active ? "text-[#0B3CC8]" : "text-[#475569] hover:text-[#0B3CC8]"}`}>
                {item.label}
                {item.active && <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "#0B3CC8" }} />}
              </Link>
            ))}
          </nav>
          <button onClick={refreshEligibility} disabled={isLoading} className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded transition-all hover:opacity-90 disabled:opacity-60" style={{ background: "#0B3CC8", color: "#fff" }}>
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Re-run assessment
          </button>
        </div>
      </div>

      <main id="main" className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Error banners */}
        {(error || localError) && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-sm border text-[12.5px] font-medium text-[#991B1B] bg-[#FEF2F2] border-[#FECACA]">
            <span className="flex-1">{error || localError}</span>
            <button onClick={() => { clearError(); setLocalError(null); }}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && eligibilityResults.length === 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-sm p-16 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#0B3CC8" }} />
            <p className="text-[#64748B] font-medium">Running eligibility assessment across 12 schemes…</p>
          </div>
        )}

        {/* No session state */}
        {!citizenId && !isLoading && (
          <div className="bg-white border border-[#E2E8F0] rounded-sm p-16 flex flex-col items-center gap-4 text-center">
            <p className="text-[#64748B] font-medium text-lg">No assessment found.</p>
            <p className="text-[#64748B] text-sm max-w-md">Complete the eligibility questionnaire to see your determination.</p>
            <Link href="/assistant">
              <button className="mt-4 px-6 py-3 text-white font-semibold rounded text-sm" style={{ background: "#0B3CC8" }}>Start Assessment</button>
            </Link>
          </div>
        )}

        {/* Results */}
        {eligibilityResults.length > 0 && (
          <>
            {/* Determination Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-sm overflow-hidden">
              <div className="grid md:grid-cols-[3fr_2fr] divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
                <div className="p-8 md:p-10">
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-5">Statement of determination</p>
                  <h1 className="text-[2rem] font-bold leading-[1.15] text-[#0F172A] mb-8" style={{ letterSpacing: "-0.03em" }}>
                    Your profile qualifies for <span style={{ color: "#0B3CC8" }}>{eligible.length}</span> of {eligibilityResults.length} schemes assessed.
                  </h1>
                  <div className="border-t border-[#E2E8F0] pt-7 mb-7">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      {[
                        ["Citizen reference", displayRef],
                        ["Assessed on", new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })],
                        ["Jurisdiction", profile?.state ?? "—"],
                        ["Schemes evaluated", String(eligibilityResults.length)],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">{label}</div>
                          <div className="text-sm font-semibold text-[#0F172A]">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-10 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-7">Determination breakdown</p>
                    <div className="space-y-4">
                      {[
                        { label: "Eligible", count: eligible.length, color: "#065F46", bg: "#ECFDF5" },
                        { label: "Near Miss", count: nearMiss.length, color: "#92400E", bg: "#FFFBEB" },
                        { label: "Not Eligible", count: notEligible.length, color: "#991B1B", bg: "#FEF2F2" },
                      ].map(({ label, count, color, bg }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-3 rounded-sm" style={{ background: bg }}>
                          <span className="text-sm font-semibold" style={{ color }}>{label}</span>
                          <span className="text-lg font-bold" style={{ color }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-[#E2E8F0] pt-6 mt-6">
                    <Link href="/assistant">
                      <button className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-sm border transition-colors hover:bg-[#EEF3FF]" style={{ borderColor: "#0B3CC8", color: "#0B3CC8" }}>
                        <FileDown className="w-4 h-4" /> Update profile to improve results
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Schemes Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748B] mb-0.5">Scheme-by-scheme result</p>
                  <h2 className="text-lg font-bold text-[#0F172A]">All {eligibilityResults.length} schemes assessed</h2>
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-[#065F46]"><CheckCircle2 className="w-4 h-4" /> {eligible.length} Eligible</span>
                  <span className="flex items-center gap-1.5 font-semibold text-[#92400E]"><AlertTriangle className="w-4 h-4" /> {nearMiss.length} Near miss</span>
                  <span className="flex items-center gap-1.5 font-semibold text-[#991B1B]"><XCircle className="w-4 h-4" /> {notEligible.length} Not eligible</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B] border-b border-[#E2E8F0]" style={{ background: "#F8FAFC" }}>
                      <th className="px-8 py-3 text-left">Scheme</th>
                      <th className="px-6 py-3 text-left">Conditions met</th>
                      <th className="px-6 py-3 text-left">Determination</th>
                      <th className="px-6 py-3 text-left">AI Explanation</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibilityResults.map(r => {
                      const meta = schemeMap[r.scheme_code];
                      const total = r.matched_rules.length + r.missing_rules.length;
                      const pct = total > 0 ? Math.round((r.matched_rules.length / total) * 100) : 0;
                      return (
                        <tr key={r.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-8 py-5">
                            <div className="font-semibold text-[#0F172A]">{meta?.name ?? r.scheme_code}</div>
                            {meta?.description && <div className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1 max-w-xs">{meta.description}</div>}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-20 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#16A34A" : pct >= 70 ? "#D97706" : "#DC2626" }} />
                              </div>
                              <span className="text-xs font-semibold text-[#64748B]">{r.matched_rules.length}/{total}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5"><StatusBadge status={r.status} /></td>
                          <td className="px-6 py-5 max-w-xs">
                            {explanations[r.id] ? (
                              <p className="text-[12px] text-[#475569] leading-relaxed line-clamp-3">{explanations[r.id]}</p>
                            ) : (
                              <button
                                onClick={() => handleExplain(r)}
                                disabled={loadingExplain === r.id}
                                className="flex items-center gap-1.5 text-[12px] font-semibold hover:underline disabled:opacity-60"
                                style={{ color: "#0B3CC8" }}
                              >
                                {loadingExplain === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                {loadingExplain === r.id ? "Explaining…" : "Explain"}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            {r.status === "eligible" && (
                              certLinks[r.id] ? (
                                <Link href={certLinks[r.id]}>
                                  <button className="text-xs font-semibold px-4 py-2 rounded-sm text-white hover:opacity-90" style={{ background: "#16A34A" }}>
                                    View Certificate
                                  </button>
                                </Link>
                              ) : (
                                <button
                                  onClick={() => handleIssueCert(r)}
                                  disabled={issuingCert === r.id}
                                  className="text-xs font-semibold px-4 py-2 rounded-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                                  style={{ background: "#0B3CC8" }}
                                >
                                  {issuingCert === r.id ? "Issuing…" : "Get Certificate"}
                                </button>
                              )
                            )}
                            {r.status === "near_miss" && (
                              <Link href="/assistant">
                                <button className="text-xs font-semibold px-4 py-2 rounded-sm border transition-colors hover:bg-[#FFFBEB]" style={{ borderColor: "#D97706", color: "#92400E" }}>
                                  Fix &amp; apply
                                </button>
                              </Link>
                            )}
                            {r.status === "not_eligible" && (
                              <button onClick={() => handleExplain(r)} className="group flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#0B3CC8] transition-colors ml-auto">
                                See reasoning <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-8 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
                <p className="text-[12px] text-[#64748B]">
                  Reference <span className="font-mono font-semibold text-[#0F172A]">{displayRef}</span> · All results are deterministic and rule-based.
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white mt-4">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <p className="text-[12px] text-[#94A3B8]">© 2026 Entitle Project — An independent welfare access initiative. Not affiliated with the Government of India.</p>
          <div className="flex items-center gap-5 text-[12px] text-[#64748B]">
            <a href="#" onClick={e => e.preventDefault()} className="hover:text-[#0B3CC8] transition-colors">Privacy</a>
            <a href="#" onClick={e => e.preventDefault()} className="hover:text-[#0B3CC8] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
