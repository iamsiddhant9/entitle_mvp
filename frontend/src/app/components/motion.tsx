"use client";

/**
 * Shared motion primitives for the ENTITLE landing page.
 *
 * Reduced-motion policy: `initial` states are never branched on the user's
 * motion preference — only the transition is. That keeps the server-rendered
 * markup identical in both cases (no hydration mismatch) while reduced-motion
 * users snap straight to the final state instead of seeing a half-played
 * animation. Purely decorative layers (HeroBeams) are CSS-driven and removed
 * outright by the prefers-reduced-motion block in globals.css.
 */

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

/** Confident deceleration curve — used everywhere so the page reads as one system. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/* ─── Scroll-triggered reveal ─── */

type RevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Seconds of delay — pass `index * 0.08` to stagger a list. */
  delay?: number;
  /** Distance in px to travel upward. */
  y?: number;
  duration?: number;
  /** Fraction of the element that must be visible before it fires. */
  amount?: number;
};

export function Reveal({
  children,
  className,
  style,
  delay = 0,
  y = 18,
  duration = 0.6,
  amount = 0.2,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={reduceMotion ? { duration: 0 } : { duration, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Per-word headline reveal ─── */

type WordRevealProps = {
  /** Newline characters are preserved as line breaks. */
  text: string;
  /** Seconds between each word. */
  stagger?: number;
  duration?: number;
};

/**
 * Reveals a headline word by word with a blur/rise/fade — a confident reveal
 * rather than a character-by-character typewriter. Safe to use inside
 * <AnimatePresence> for phrase swaps; exit runs faster than entry so language
 * changes never feel sluggish.
 */
export function WordReveal({ text, stagger = 0.055, duration = 0.7 }: WordRevealProps) {
  const reduceMotion = useReducedMotion();
  const lines = text.split("\n");

  // Counts words across all lines so the stagger stays continuous line to line.
  let wordIndex = 0;

  return (
    <>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className="block">
          {line.split(" ").map((word, i) => {
            const index = wordIndex++;
            return (
              <motion.span
                key={`${lineIndex}-${i}`}
                className="inline-block whitespace-pre"
                initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  y: -8,
                  filter: "blur(8px)",
                  transition: reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.28, delay: index * 0.022, ease: "easeIn" },
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration, delay: index * stagger, ease: EASE_OUT }
                }
              >
                {word}{" "}
              </motion.span>
            );
          })}
        </span>
      ))}
    </>
  );
}

/* ─── Hero background beams ─── */

/**
 * Restrained falling-light-beam layer for the hero. Deliberately CSS-only:
 * no JS ticking behind the fold, and `prefers-reduced-motion` removes it
 * wholesale via globals.css. Beams sit in document order before the hero
 * content, so content always paints on top.
 */
const BEAMS: { left: string; duration: string; delay: string; color: string; mobile: boolean }[] = [
  { left: "12%", duration: "17s", delay: "0s",   color: "rgba(255,153,51,0.50)", mobile: true },
  { left: "27%", duration: "23s", delay: "-9s",  color: "rgba(124,158,255,0.42)", mobile: false },
  { left: "44%", duration: "19s", delay: "-4s",  color: "rgba(255,153,51,0.34)", mobile: true },
  { left: "63%", duration: "26s", delay: "-14s", color: "rgba(124,158,255,0.48)", mobile: false },
  { left: "78%", duration: "20s", delay: "-6s",  color: "rgba(255,153,51,0.44)", mobile: true },
  { left: "91%", duration: "29s", delay: "-18s", color: "rgba(124,158,255,0.32)", mobile: false },
];

export function HeroBeams() {
  return (
    <div className="hero-beams" aria-hidden="true">
      <div className="hero-wash" />
      {BEAMS.map((beam) => (
        <span
          key={beam.left}
          // Half the beams are dropped under 640px — fewer moving layers on
          // the devices least able to afford them.
          className={`hero-beam ${beam.mobile ? "" : "hidden sm:block"}`}
          style={
            {
              left: beam.left,
              "--beam-color": beam.color,
              "--beam-duration": beam.duration,
              "--beam-delay": beam.delay,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
