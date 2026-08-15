"use client";

import { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

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

  useEffect(() => {
    setMounted(true);

    const targets = { citizens: 43211, schemes: 106, states: 28 };
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
    }, 25);

    const feedTimer = setInterval(() => setFeedIdx(p => (p + 1) % liveFeed.length),         3200);
    const hotTimer  = setInterval(() => setActiveHot(p => (p + 1) % hotspotMarkers.length), 2400);

    return () => { clearInterval(counterTimer); clearInterval(feedTimer); clearInterval(hotTimer); };
  }, []);

  const hovered = hoveredState ? stateData[hoveredState] : null;

  return (
    <section className="py-20 px-6" style={{ background: "#0A1628" }}>
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
            {hovered && hoveredState ? (
              <div style={{ borderLeft: "2px solid #FF9933", paddingLeft: "14px" }}>
                <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Selected State
                </div>
                <div className="text-base font-bold text-white mb-5">{hoveredState}</div>
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
          <div className="flex-1 min-h-[400px]">
            {mounted && (
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 900, center: [82.5, 23] }}
                style={{ width: "100%", height: "auto" }}
                viewBox="100 0 700 680"
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const name  = geo.properties.ST_NM as string;
                      const data  = stateData[name];
                      const isHov = hoveredState === name;
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
                        />
                      );
                    })
                  }
                </Geographies>

                {hotspotMarkers.map((m, i) => {
                  const active = activeHot === i;
                  return (
                    <Marker key={m.state} coordinates={m.coords}>
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
          </div>
        </div>
      </div>
    </section>
  );
}
