"use client";

/**
 * useSchemeCardTrail
 *
 * A state-scoped cursor trail for the India impact map, adapted from the
 * technique in Codrops' MotionTrailAnimations (js/demo1/imageTrail.js):
 *
 *   - track the pointer, plus the position at which the last card spawned
 *   - keep a lerped "cache" position that lags behind the real cursor
 *   - in a rAF loop, spawn the next card once the cursor has travelled
 *     further than a distance threshold
 *   - cycle a fixed pool of elements rather than creating DOM per spawn
 *   - each card animates from the lagging position to the live one, then
 *     fades out; the lag is what reads as a trail
 *
 * Three deliberate departures from the reference:
 *
 *   1. The reference binds a global `window` mousemove. This binds nothing
 *      globally - the consumer wires `handlePointerMove` to the map wrapper
 *      only, and the rAF loop runs solely while a state is hovered.
 *   2. The reference uses GSAP. This uses framer-motion's imperative
 *      `animate()`, which is already a dependency. No React state is touched
 *      during pointer movement, so the 36 <Geography> paths never re-render.
 *   3. Coordinates are container-relative (not pageX/pageY) and clamped to
 *      the container, so cards stay fully readable at the map's edges.
 */

import { animate } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";

type Point = { x: number; y: number };

type PlaybackControls = { stop: () => void };

export type SchemeCardTrailOptions = {
  /** The positioned element the cards are absolutely placed within. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Currently hovered state name, or null when the pointer is outside any state. */
  activeState: string | null;
  /** Number of reusable card elements. */
  poolSize: number;
  /** False on touch/coarse pointers and under prefers-reduced-motion. */
  enabled: boolean;
  /**
   * Pixels the cursor must travel before the next card is released.
   * The reference uses 80px across a full viewport; the map is roughly half
   * that wide, so a tighter threshold keeps the trail's density comparable.
   */
  threshold?: number;
};

/** How strongly the trailing anchor lags the real cursor. Reference uses 0.1. */
const LERP = 0.14;
/** Total life of a card: travel, then fade. Reference uses 0.4 + 0.4. */
const CARD_DURATION = 0.85;
/** Per-slot rotation so the trail reads as a scattered pile, not a stack of clones. */
const TILTS = [-5, 3.5, -2, 6, -4.5, 2.5, -6.5, 4];

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;

export function useSchemeCardTrail({
  containerRef,
  activeState,
  poolSize,
  enabled,
  threshold = 70,
}: SchemeCardTrailOptions) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const pointer = useRef<Point>({ x: 0, y: 0 });
  const lastSpawn = useRef<Point>({ x: 0, y: 0 });
  const cache = useRef<Point>({ x: 0, y: 0 });
  const hasPointer = useRef(false);

  /**
   * One stable ref callback per pool slot, built once. Returning the raw
   * ref object instead would make every property read on this hook's result
   * look like a ref access during render.
   */
  const cardRefCallbacks = useMemo(
    () =>
      Array.from({ length: poolSize }, (_, i) => (el: HTMLDivElement | null) => {
        cardRefs.current[i] = el;
      }),
    [poolSize],
  );

  const rect = useRef<DOMRect | null>(null);
  /** Measured card height, retained for clamping cards inside the container. */
  const cardH = useRef(96);
  const slot = useRef(0);
  const zIndex = useRef(1);
  const controls = useRef<(PlaybackControls | null)[]>([]);
  const rafId = useRef<number | null>(null);
  const activeRef = useRef<string | null>(null);
  const prevActive = useRef<string | null>(null);

  /**
   * Cache the container box. Read on enter and on scroll/resize rather than
   * per pointer event, so we never force layout on the move path.
   */
  const refreshRect = useCallback(() => {
    rect.current = containerRef.current?.getBoundingClientRect() ?? null;
  }, [containerRef]);

  const stopAll = useCallback(() => {
    controls.current.forEach((c) => c?.stop());
    controls.current = [];
  }, []);

  /** duration 0 hides leftovers outright; a small duration fades them out. */
  const clearCards = useCallback(
    (duration: number) => {
      stopAll();
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        controls.current[i] = animate(
          el,
          { opacity: 0, scale: 0.9 },
          { duration },
        ) as unknown as PlaybackControls;
      });
      zIndex.current = 1;
    },
    [stopAll],
  );

  /** Release the next card in the pool at the current cursor position. */
  const spawn = useCallback(() => {
    const box = rect.current;
    if (!box) return;

    slot.current = (slot.current + 1) % poolSize;
    const el = cardRefs.current[slot.current];
    if (!el) return;

    controls.current[slot.current]?.stop();
    // Bounded so a long hover can never climb toward the name chip's layer.
    zIndex.current = zIndex.current > 10000 ? 2 : zIndex.current + 1;
    el.style.zIndex = String(zIndex.current);

    const w = el.offsetWidth || 200;
    const h = el.offsetHeight || 96;
    cardH.current = h;

    // Keep the whole card inside the map so it never clips or overflows.
    const clampX = (v: number) => Math.max(0, Math.min(v, box.width - w));
    const clampY = (v: number) => Math.max(0, Math.min(v, box.height - h));

    const fromX = clampX(cache.current.x - w / 2);
    const fromY = clampY(cache.current.y - h / 2);
    const toX = clampX(pointer.current.x - w / 2);
    const toY = clampY(pointer.current.y - h / 2);

    const tilt = TILTS[slot.current % TILTS.length];

    controls.current[slot.current] = animate(
      el,
      {
        x: [fromX, toX, toX],
        y: [fromY, toY, toY],
        opacity: [1, 1, 0],
        scale: [0.94, 1, 0.88],
        rotate: [tilt * 1.5, tilt, tilt * 0.5],
      },
      {
        duration: CARD_DURATION,
        times: [0, 0.45, 1],
        ease: ["easeOut", "easeIn"],
      },
    ) as unknown as PlaybackControls;
  }, [poolSize]);

  const stopLoop = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  /** Wire to the map wrapper's onPointerMove. Writes to refs only. */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      if (e.pointerType === "touch") return;
      if (!rect.current) refreshRect();
      const box = rect.current;
      if (!box) return;
      pointer.current.x = e.clientX - box.left;
      pointer.current.y = e.clientY - box.top;
      hasPointer.current = true;
    },
    [enabled, refreshRect],
  );

  /** Wire to the map wrapper's onPointerEnter. */
  const handlePointerEnter = useCallback(() => {
    if (!enabled) return;
    refreshRect();
  }, [enabled, refreshRect]);

  /** Wire to the map wrapper's onPointerLeave - covers exiting via the edge. */
  const handlePointerLeave = useCallback(() => {
    if (!enabled) return;
    hasPointer.current = false;
    clearCards(0.22);
  }, [enabled, clearCards]);

  // Keep the cached box honest while the trail is live.
  useEffect(() => {
    if (!enabled) return;
    const onViewportChange = () => refreshRect();
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange);
    return () => {
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [enabled, refreshRect]);

  /**
   * Drive the lifecycle off the hovered state.
   *
   * Entering a state anchors the trail at the cursor and releases one card
   * immediately - without that, small states and UTs (Goa, Sikkim, Delhi)
   * are too small to ever accumulate `threshold` pixels of travel and would
   * show nothing at all.
   */
  useEffect(() => {
    activeRef.current = activeState;
    const previous = prevActive.current;
    prevActive.current = activeState;

    if (!enabled) return;

    if (!activeState) {
      clearCards(0.22);
      stopLoop();
      return;
    }

    // Switching states: drop the outgoing cards outright rather than fading
    // them, since their DOM nodes already carry the incoming state's text.
    if (previous && previous !== activeState) clearCards(0);

    if (!rect.current) refreshRect();

    cache.current = { ...pointer.current };
    lastSpawn.current = { ...pointer.current };

    if (hasPointer.current) spawn();

    const tick = () => {
      if (activeRef.current && hasPointer.current) {
        const dx = pointer.current.x - lastSpawn.current.x;
        const dy = pointer.current.y - lastSpawn.current.y;

        // The lagging anchor each card starts from - this is what trails.
        cache.current.x = lerp(cache.current.x, pointer.current.x, LERP);
        cache.current.y = lerp(cache.current.y, pointer.current.y, LERP);

        if (Math.hypot(dx, dy) > threshold) {
          spawn();
          lastSpawn.current = { ...pointer.current };
        }
      }
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => stopLoop();
  }, [activeState, enabled, threshold, clearCards, spawn, stopLoop, refreshRect]);

  // Unmount safety.
  useEffect(() => {
    return () => {
      stopAll();
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [stopAll]);

  return {
    /** Ref callbacks for the pool: ref={cardRefCallbacks[i]}. */
    cardRefCallbacks,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
  };
}
