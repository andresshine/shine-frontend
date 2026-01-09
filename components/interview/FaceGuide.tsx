"use client";

/**
 * FaceGuide Component
 *
 * SVG overlay showing face/body positioning guide with corner brackets.
 * Helps users position themselves properly in the frame for video testimonials.
 * Hidden when recording or when user is properly framed.
 *
 * Features:
 * - Corner brackets for framing reference
 * - Person silhouette outline for positioning
 * - Scales proportionally with video container
 * - Uses brand primary color for consistency
 * - Cycling positioning hints for user guidance
 *
 * @author Shine Studio
 */

import { memo, useState, useEffect } from "react";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Positioning hints that cycle to help users frame themselves */
const POSITIONING_HINTS = [
  "Center yourself within the guide",
  "Keep your head in the oval",
  "Sit about an arm's length away",
  "Look directly at the camera",
];

/** Time between hint changes (ms) */
const HINT_CYCLE_INTERVAL_MS = 4000;

/** Animation duration for hint transitions (ms) */
const HINT_TRANSITION_MS = 500;

// =============================================================================
// COMPONENT
// =============================================================================

export const FaceGuide = memo(function FaceGuide() {
  // Use CSS custom property for brand color with 40% opacity
  const guideColor = 'color-mix(in srgb, var(--brand-primary) 40%, transparent)';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** Current hint index */
  const [hintIndex, setHintIndex] = useState(0);
  /** Whether hint is visible (for fade animation) */
  const [hintVisible, setHintVisible] = useState(true);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /** Cycle through positioning hints */
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setHintVisible(false);

      // After fade out, change hint and fade in
      setTimeout(() => {
        setHintIndex((prev) => (prev + 1) % POSITIONING_HINTS.length);
        setHintVisible(true);
      }, HINT_TRANSITION_MS);
    }, HINT_CYCLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Corner Brackets - scale with container */}
      <div className="absolute inset-[8%]">
        {/* Top Left */}
        <svg className="absolute top-0 left-0 w-[6%] min-w-6 max-w-10 aspect-square" viewBox="0 0 32 32" fill="none" style={{ color: guideColor }}>
          <path d="M2 12 L2 2 L12 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        {/* Top Right */}
        <svg className="absolute top-0 right-0 w-[6%] min-w-6 max-w-10 aspect-square" viewBox="0 0 32 32" fill="none" style={{ color: guideColor }}>
          <path d="M20 2 L30 2 L30 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        {/* Bottom Left */}
        <svg className="absolute bottom-0 left-0 w-[6%] min-w-6 max-w-10 aspect-square" viewBox="0 0 32 32" fill="none" style={{ color: guideColor }}>
          <path d="M2 20 L2 30 L12 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        {/* Bottom Right */}
        <svg className="absolute bottom-0 right-0 w-[6%] min-w-6 max-w-10 aspect-square" viewBox="0 0 32 32" fill="none" style={{ color: guideColor }}>
          <path d="M20 30 L30 30 L30 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Person Outline - premium framing guide for video testimonials */}
      <svg
        viewBox="0 0 200 200"
        aria-hidden="true"
        className="h-[88%] w-auto mt-[6%]"
        preserveAspectRatio="xMidYMid meet"
        style={{ color: guideColor }}
      >
        {/* Head outline - tall oval for face */}
        <ellipse
          cx="100"
          cy="55"
          rx="48"
          ry="55"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="5 7"
        />

        {/* Neck - short transition to shoulders */}
        <path
          d="M 65 105 Q 60 115, 50 125 M 135 105 Q 140 115, 150 125"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
        />

        {/* Shoulders - steep angle, quickly extends wide */}
        <path
          d="M 50 125 Q 25 135, -10 155 M 150 125 Q 175 135, 210 155"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
        />

        {/* Arms continuing out of frame */}
        <path
          d="M -10 155 L -25 200 M 210 155 L 225 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
        />
      </svg>

      {/* Positioning Hint */}
      <div
        className="absolute bottom-[12%] left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm"
        style={{
          opacity: hintVisible ? 1 : 0,
          transition: `opacity ${HINT_TRANSITION_MS}ms ease-in-out`,
        }}
      >
        <p
          className="text-white/80 text-xs sm:text-sm font-medium whitespace-nowrap"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
        >
          {POSITIONING_HINTS[hintIndex]}
        </p>
      </div>
    </div>
  );
});
