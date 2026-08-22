"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { DEMO_DATA_LABEL, getSchemesForState, stateAbbr } from "./stateSchemes";
import { useSchemeCardTrail } from "./useSchemeCardTrail";

/** Reusable trail card elements. Cycled, never created per spawn. */
const TRAIL_POOL_SIZE = 8;

const GEO_URL = "/india-states.json";

interface StateInfo {
  citizens: number;
  topScheme: string;
  coverage: number;
}

const stateData: Record<string, StateInfo> = {
  "Andhra Pradesh":    { citizens: 3890,  topScheme: "AB PM-JAY",       coverage: 73 },
  "Arunachal Pradesh": { citizens: 450,   topScheme: "PM KISAN",         coverage: 52 },
  "Assam":             { citizens: 2780,  topScheme: "PM KISAN",         coverage: 75 },
  "Bihar":             { citizens: 6890,  topScheme: "PM KISAN",         coverage: 82 },
  "Chhattisgarh":      { citizens: 2450,  topScheme: "PM KISAN",         coverage: 80 },
  "Goa":               { citizens: 380,   topScheme: "AB PM-JAY",        coverage: 61 },
  "Gujarat":           { citizens: 3890,  topScheme: "PM-SY",            coverage: 67 },
  "Haryana":           { citizens: 1980,  topScheme: "PM KISAN",         coverage: 58 },
  "Himachal Pradesh":  { citizens: 890,   topScheme: "PM KISAN",         coverage: 63 },
  "Jharkhand":         { citizens: 2670,  topScheme: "PM KISAN",         coverage: 77 },
  "Karnataka":         { citizens: 4120,  topScheme: "AB PM-JAY",        coverage: 79 },
  "Kerala":            { citizens: 2340,  topScheme: "AB PM-JAY",        coverage: 84 },
  "Madhya Pradesh":    { citizens: 5670,  topScheme: "PM KISAN",         coverage: 74 },
  "Maharashtra":       { citizens: 8241,  topScheme: "AB PM-JAY",        coverage: 89 },
  "Manipur":           { citizens: 560,   topScheme: "NSP Scholarship",  coverage: 58 },
  "Meghalaya":         { citizens: 480,   topScheme: "PM KISAN",         coverage: 52 },
  "Mizoram":           { citizens: 290,   topScheme: "NSP Scholarship",  coverage: 49 },
  "Nagaland":          { citizens: 340,   topScheme: "PM KISAN",         coverage: 51 },
  "Odisha":            { citizens: 3450,  topScheme: "PM KISAN",         coverage: 81 },
  "Punjab":            { citizens: 2340,  topScheme: "PM KISAN",         coverage: 62 },
  "Rajasthan":         { citizens: 5120,  topScheme: "AB PM-JAY",        coverage: 71 },
  "Sikkim":            { citizens: 180,   topScheme: "NSP Scholarship",  coverage: 48 },
  "Tamil Nadu":        { citizens: 4560,  topScheme: "NSP Scholarship",  coverage: 85 },
  "Telangana":         { citizens: 2890,  topScheme: "NSP Scholarship",  coverage: 68 },
  "Tripura":           { citizens: 670,   topScheme: "PM KISAN",         coverage: 64 },
  "Uttar Pradesh":     { citizens: 12430, topScheme: "PM KISAN",         coverage: 76 },
  "Uttarakhand":       { citizens: 1230,  topScheme: "PM KISAN",         coverage: 66 },
  "West Bengal":       { citizens: 7230,  topScheme: "PM KISAN",         coverage: 78 },
  "Delhi":             { citizens: 1890,  topScheme: "AB PM-JAY",        coverage: 69 },
  "Jammu & Kashmir":   { citizens: 980,   topScheme: "PM KISAN",         coverage: 55 },
  "Ladakh":            { citizens: 120,   topScheme: "PM KISAN",         coverage: 44 },
  "Puducherry":        { citizens: 230,   topScheme: "AB PM-JAY",        coverage: 60 },
  "Chandigarh":        { citizens: 340,   topScheme: "PM-SY",            coverage: 57 },
  "Andaman & Nicobar": { citizens: 95,    topScheme: "AB PM-JAY",        coverage: 42 },
  "Lakshadweep":       { citizens: 45,    topScheme: "PM KISAN",         coverage: 38 },
  "Dadra and Nagar Haveli and Daman and Diu": { citizens: 180, topScheme: "PM-SY", coverage: 50 },
};

const hotspotMarkers: { coords: [number, number]; state: string; citizens: string }[] = [
  { coords: [76.0,  19.0], state: "Maharashtra",   citizens: "8,241"  },
  { coords: [80.9,  27.5], state: "Uttar Pradesh", citizens: "12,430" },
  { coords: [85.8,  25.6], state: "Bihar",         citizens: "6,890"  },
  { coords: [87.9,  23.0], state: "West Bengal",   citizens: "7,230"  },
  { coords: [78.7,  11.1], state: "Tamil Nadu",    citizens: "4,560"  },
  { coords: [74.2,  26.5], state: "Rajasthan",     citizens: "5,120"  },
];

const liveFeed = [
  { state: "Maharashtra",   action: "verified AB PM-JAY eligibility",     time: "just now"  },
  { state: "Uttar Pradesh", action: "claimed PM KISAN benefit",           time: "2 min ago" },
  { state: "Bihar",         action: "downloaded entitlement certificate", time: "4 min ago" },
  { state: "Tamil Nadu",    action: "checked NSP Scholarship status",     time: "6 min ago" },
  { state: "West Bengal",   action: "mapped 4 scheme eligibilities",      time: "9 min ago" },
  { state: "Rajasthan",     action: "verified AB PM-JAY eligibility",     time: "11 min ago"},
];

function getColor(coverage: number): string {
  const t = Math.max(0, Math.min(1, (coverage - 35) / 60));
  const r = Math.round(26  + t * (11  - 26));
  const g = Math.round(48  + t * (99  - 48));
  const b = Math.round(96  + t * (235 - 96));
  return `rgb(${r},${g},${b})`;
}

export default function IndiaImpactMap() {
  const [mounted,      setMounted]      = useState(false);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [feedIdx,      setFeedIdx]      = useState(0);
  const [activeHot,    setActiveHot]    = useState(0);
  const [counters,     setCounters]     = useState({ citizens: 0, schemes: 0, states: 0 });

  const sectionRef   = useRef<HTMLElement>(null);
  const statsInView  = useInView(sectionRef, { once: true, amount: 0.3 });
  const reduceMotion = useReducedMotion();

  const mapWrapRef = useRef<HTMLDivElement>(null);
  const [tappedState, setTappedState] = useState<string | null>(null);
  const [canHover,    setCanHover]    = useState(false);

  // Gate on pointer capability rather than screen width, so a touchscreen
  // laptop gets the tap fallback and a small desktop window still hovers.
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const trailEnabled = canHover && !reduceMotion;

  // Whichever state is currently "selected" - hover on desktop, tap on touch.
  const activeState = hoveredState ?? tappedState;

  // Retains the last hovered state so cards keep their content while fading
  // out on leave instead of blanking. Adjusting state during render is the
  // supported React pattern for deriving from a prop/state change.
  const [trailState, setTrailState] = useState<string | null>(null);
  if (hoveredState && hoveredState !== trailState) setTrailState(hoveredState);

  const trailSchemes  = useMemo(() => getSchemesForState(trailState),  [trailState]);
  const activeSchemes = useMemo(() => getSchemesForState(activeState), [activeState]);

  const {
    cardRefCallbacks,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
  } = useSchemeCardTrail({
    containerRef: mapWrapRef,
    activeState: trailEnabled ? hoveredState : null,
    poolSize: TRAIL_POOL_SIZE,
    enabled: trailEnabled,
  });

  useEffect(() => {
    setMounted(true);

    const feedTimer = setInterval(() => setFeedIdx(p => (p + 1) % liveFeed.length),         3200);
    const hotTimer  = setInterval(() => setActiveHot(p => (p + 1) % hotspotMarkers.length), 2400);

    return () => { clearInterval(feedTimer); clearInterval(hotTimer); };
  }, []);

  // The counters used to run on mount, which meant they finished long before
  // this below-the-fold section was ever on screen. Hold at zero until it is.
  useEffect(() => {
    if (!statsInView) return;

    const targets = { citizens: 43211, schemes: 106, states: 28 };

    if (reduceMotion) {
      setCounters(targets);
      return;
    }

    let step = 0;
    const counterTimer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / 80, 3);
      setCounters({
        citizens: Math.round(eased * targets.citizens),
        schemes:  Math.round(eased * targets.schemes),
        states:   Math.round(eased * targets.states),
      });
      if (step >= 80) clearInterval(counterTimer);
    }, 20);

    return () => clearInterval(counterTimer);
  }, [statsInView, reduceMotion]);

  const hovered = activeState ? stateData[activeState] : null;

  return (
    <section ref={sectionRef} className="py-20 px-6" style={{ background: "#0A1628" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#FF9933" }}>
            Live Platform Impact
          </p>
          <h2 className="text-[1.9rem] font-bold text-white mb-3" style={{ letterSpacing: "-0.025em" }}>
            Welfare Reach Across India
          </h2>
          <p className="text-[13px] max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
            Citizens across 28 states actively discovering and claiming their entitlements.
            Hover any state to explore local impact.
          </p>
        </div>

        {/* Shared demo-data notice. Covers BOTH the illustrative scheme cards
            and the existing headline/per-state statistics on this map. */}
        <div
          className="flex items-start gap-3 max-w-3xl mx-auto mb-12 px-4 py-3 rounded"
          style={{ background: "rgba(217,119,6,0.10)", border: "1px solid rgba(252,211,77,0.32)" }}
        >
          <span
            className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-1 rounded-sm"
            style={{ background: "rgba(252,211,77,0.18)", color: "#FCD34D" }}
          >
            Demo Data
          </span>
          <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(253,230,138,0.85)" }}>
            <strong className="font-semibold">Illustrative data.</strong> The scheme cards,
            impact statistics, per-state coverage figures and live activity feed shown on this
            map are demonstration values, not live government or backend records.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* ── Left panel ── */}
          <div className="flex flex-col gap-8 w-full lg:w-[260px] shrink-0">

            {/* Stacked stats — no cards, just large numbers with thin separators */}
            <div>
              {[
                { value: counters.citizens.toLocaleString(), label: "Citizens Helped" },
                { value: String(counters.schemes),           label: "Schemes Tracked" },
                { value: `${counters.states} / 36`,         label: "States & UTs Covered" },
              ].map((s, i) => (
                <div key={s.label}>
                  {i > 0 && <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} className="my-4" />}
                  <div
                    className="text-4xl font-semibold text-white tabular-nums tracking-tight"
                    style={{ fontFamily: "var(--font-oswald), sans-serif" }}
                  >
                    {s.value}
                  </div>
                  <div className="text-[11px] uppercase tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

            {/* State hover panel OR console-style live feed */}
            {hovered && activeState ? (
              <div style={{ borderLeft: "2px solid #FF9933", paddingLeft: "14px" }}>
                <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Selected State
                </div>
                <div className="text-base font-bold text-white mb-5">{activeState}</div>
                {[
                  { label: "Citizens Helped", value: hovered.citizens.toLocaleString(), color: "#FF9933" },
                  { label: "Coverage",        value: `${hovered.coverage}%`,            color: "#ffffff" },
                  { label: "Top Scheme",      value: hovered.topScheme,                 color: "#60A5FA" },
                ].map(row => (
                  <div key={row.label} className="mb-3">
                    <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {row.label}
                    </div>
                    <div className="text-sm font-semibold" style={{ color: row.color }}>{row.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22C55E" }} />
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Live Activity</span>
                </div>
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map(offset => {
                    const entry = liveFeed[(feedIdx + offset) % liveFeed.length];
                    const opacity = offset === 0 ? 1 : offset === 1 ? 0.5 : 0.22;
                    return (
                      <div key={offset} className="flex items-start gap-2.5" style={{ opacity }}>
                        <span
                          className="text-[9px] font-bold mt-0.5 shrink-0 font-mono px-1.5 py-0.5 rounded-sm"
                          style={{ background: "rgba(255,153,51,0.15)", color: "#FF9933", letterSpacing: "0.04em" }}
                        >
                          {entry.state.substring(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="text-[11px] font-medium" style={{ color: offset === 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)" }}>
                            {entry.action}
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{entry.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

            {/* Legend — borderless, inline */}
            <div>
              <div className="text-[10px] uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                Coverage Intensity
              </div>
              <div className="h-1 rounded-full" style={{ background: "linear-gradient(to right, #1a3060, #2563EB)" }} />
              <div className="flex justify-between text-[9px] mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                <span>Lower</span><span>Higher</span>
              </div>
              <div className="flex items-center gap-2 mt-3.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#FF9933" }} />
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Active hotspot · hover state for data</span>
              </div>
            </div>
          </div>

          {/* ── Map ── */}
          <div className="flex-1 w-full min-w-0">
          <div
            ref={mapWrapRef}
            className="relative min-h-[400px]"
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          >
            {mounted && (
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 900, center: [82.5, 23] }}
                style={{ width: "100%", height: "auto" }}
                viewBox="100 0 700 680"
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }: { geographies: any[] }) =>
                    geographies.map((geo: any) => {
                      const name  = geo.properties.ST_NM as string;
                      const data  = stateData[name];
                      const isHov = activeState === name;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isHov ? "#FF9933" : (data ? getColor(data.coverage) : "#1a2a4a")}
                          stroke="#0A1628"
                          strokeWidth={0.7}
                          style={{
                            default: { outline: "none", transition: "fill 0.18s ease" },
                            hover:   { outline: "none", fill: "#FF9933", cursor: "pointer" },
                            pressed: { outline: "none" },
                          }}
                          onMouseEnter={() => setHoveredState(name)}
                          onMouseLeave={() => setHoveredState(null)}
                          onClick={() => {
                            // Tap-to-select only where there is no real hover,
                            // so desktop behaviour is untouched.
                            if (!canHover) setTappedState(prev => (prev === name ? null : name));
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {hotspotMarkers.map((m, i) => {
                  const active = activeHot === i;
                  return (
                    <Marker key={m.state} coordinates={m.coords}>
                      {/* Expanding ring - remounts on each rotation, so the
                          CSS animation restarts and the marker reads "live".
                          Removed entirely under prefers-reduced-motion. */}
                      {active && (
                        <circle
                          className="hotspot-ping"
                          r={16}
                          fill="none"
                          stroke="#FF9933"
                          strokeWidth={1.4}
                        />
                      )}
                      <circle
                        r={active ? 16 : 8}
                        fill="#FF9933"
                        opacity={active ? 0.18 : 0.07}
                        style={{ transition: "r 0.5s ease, opacity 0.5s ease" }}
                      />
                      <circle
                        r={active ? 6 : 4}
                        fill="#FF9933"
                        opacity={active ? 1 : 0.55}
                        style={{ transition: "r 0.4s ease, opacity 0.4s ease" }}
                      />
                      {active && (
                        <>
                          <text
                            textAnchor="middle"
                            y={-20}
                            style={{
                              fontSize: "7.5px",
                              fill: "#FF9933",
                              fontWeight: "700",
                              fontFamily: "sans-serif",
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                            } as React.CSSProperties}
                          >
                            {m.state}
                          </text>
                          <text
                            textAnchor="middle"
                            y={-10}
                            style={{
                              fontSize: "8.5px",
                              fill: "rgba(255,255,255,0.65)",
                              fontFamily: "sans-serif",
                            } as React.CSSProperties}
                          >
                            {m.citizens} helped
                          </text>
                        </>
                      )}
                    </Marker>
                  );
                })}
              </ComposableMap>
            )}

            {/* ── Cursor trail overlay ──
                Pool content is keyed to trailState, so React renders these
                cards exactly once per state change and never during pointer
                movement. Position/opacity are driven imperatively by the hook. */}
            {trailEnabled && trailSchemes.length > 0 && (
              <div className="trail-layer" aria-hidden="true">
                <div
                  className="trail-name"
                  style={{ opacity: hoveredState ? 1 : 0, transition: "opacity 0.18s ease" }}
                >
                  <span className="trail-name__inner">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FF9933" }} />
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.16em] text-white"
                      style={{ fontFamily: "var(--font-oswald), sans-serif" }}
                    >
                      {trailState}
                    </span>
                  </span>
                </div>

                {Array.from({ length: TRAIL_POOL_SIZE }).map((_, i) => {
                  const scheme = trailSchemes[i % trailSchemes.length];
                  return (
                    <div key={i} ref={cardRefCallbacks[i]} className="trail-card">
                      <span className="trail-card__sheet trail-card__sheet--back" />
                      <span className="trail-card__sheet trail-card__sheet--mid" />
                      <div className="trail-card__face">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span
                            className="text-[8.5px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm"
                            style={{ background: "rgba(96,165,250,0.16)", color: "#93C5FD" }}
                          >
                            {scheme.category}
                          </span>
                          <span
                            className="text-[8.5px] font-bold tracking-[0.08em] px-1.5 py-0.5 rounded-sm shrink-0"
                            style={{ background: "rgba(252,211,77,0.20)", color: "#FCD34D", border: "1px solid rgba(252,211,77,0.4)" }}
                          >
                            {DEMO_DATA_LABEL}
                          </span>
                        </div>
                        {/* Fixed two-line box keeps every trail card the same height, so the
                            name chip can sit a predictable distance above them. */}
                        <div className="text-[11.5px] font-bold text-white leading-snug mb-1.5 line-clamp-2 h-[31px]">
                          {scheme.name}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold" style={{ color: "#FF9933" }}>
                            {scheme.detail}
                          </span>
                          <span className="text-[8.5px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {trailState ? stateAbbr(trailState) : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Touch / reduced-motion fallback ──
              No cursor to trail, so the same scheme data is shown anchored
              beneath the map. Tapping another state replaces these. */}
          {!trailEnabled && (
            <div className="mt-6">
              {activeState && activeSchemes.length > 0 ? (
                <>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FF9933" }} />
                      <span
                        className="text-[12px] font-bold uppercase tracking-[0.16em] text-white truncate"
                        style={{ fontFamily: "var(--font-oswald), sans-serif" }}
                      >
                        {activeState}
                      </span>
                    </div>
                    <span
                      className="shrink-0 text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-sm"
                      style={{ background: "rgba(252,211,77,0.18)", color: "#FCD34D", border: "1px solid rgba(252,211,77,0.4)" }}
                    >
                      {DEMO_DATA_LABEL}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {activeSchemes.slice(0, 3).map((scheme, i) => (
                      <div
                        key={scheme.name}
                        className="trail-card__face"
                        style={{ transform: `rotate(${[-0.8, 0.5, -0.4][i] ?? 0}deg)` }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span
                            className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm"
                            style={{ background: "rgba(96,165,250,0.16)", color: "#93C5FD" }}
                          >
                            {scheme.category}
                          </span>
                          <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {stateAbbr(activeState)}
                          </span>
                        </div>
                        <div className="text-[12.5px] font-bold text-white leading-snug mb-1">
                          {scheme.name}
                        </div>
                        <span className="text-[11.5px] font-semibold" style={{ color: "#FF9933" }}>
                          {scheme.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p
                  className="text-[12px] text-center py-3 rounded"
                  style={{ color: "rgba(255,255,255,0.35)", border: "1px dashed rgba(255,255,255,0.12)" }}
                >
                  Tap any state on the map to see its welfare schemes.
                </p>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
