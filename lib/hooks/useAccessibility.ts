/**
 * useAccessibility Hook
 *
 * Manages accessibility features for the interview UI including
 * ARIA announcements, focus management, and reduced motion support.
 *
 * @author Shine Studio
 */

import { useEffect, useCallback, useRef, useState } from "react";
import {
  announce,
  announceRecordingState,
  announceQuestionChange,
  prefersReducedMotion,
  trapFocus,
  returnFocus,
} from "@/lib/utils/accessibility";

// =============================================================================
// TYPES
// =============================================================================

export interface UseAccessibilityConfig {
  /** Whether accessibility features are enabled */
  enabled?: boolean;
}

export interface UseAccessibilityResult {
  /** Announce a message to screen readers */
  announce: (message: string, priority?: "polite" | "assertive") => void;
  /** Announce recording state change */
  announceRecordingState: (
    state: "countdown" | "started" | "stopped" | "uploading" | "complete",
    countdown?: number
  ) => void;
  /** Announce question change */
  announceQuestionChange: (
    questionNumber: number,
    totalQuestions: number,
    questionText: string
  ) => void;
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Trap focus within a container */
  trapFocus: (container: HTMLElement) => () => void;
  /** Return focus to previous element */
  returnFocus: () => void;
  /** Store the current focus for later restoration */
  saveFocus: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function useAccessibility({
  enabled = true,
}: UseAccessibilityConfig = {}): UseAccessibilityResult {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [reducedMotion, setReducedMotion] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Check and monitor reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const handleAnnounce = useCallback(
    (message: string, priority?: "polite" | "assertive") => {
      if (!enabled) return;
      announce(message, priority);
    },
    [enabled]
  );

  const handleRecordingState = useCallback(
    (
      state: "countdown" | "started" | "stopped" | "uploading" | "complete",
      countdown?: number
    ) => {
      if (!enabled) return;
      announceRecordingState(state, countdown);
    },
    [enabled]
  );

  const handleQuestionChange = useCallback(
    (questionNumber: number, totalQuestions: number, questionText: string) => {
      if (!enabled) return;
      announceQuestionChange(questionNumber, totalQuestions, questionText);
    },
    [enabled]
  );

  const handleTrapFocus = useCallback(
    (container: HTMLElement) => {
      if (!enabled) return () => {};
      return trapFocus(container);
    },
    [enabled]
  );

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const handleReturnFocus = useCallback(() => {
    returnFocus(previousFocusRef.current);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    announce: handleAnnounce,
    announceRecordingState: handleRecordingState,
    announceQuestionChange: handleQuestionChange,
    prefersReducedMotion: reducedMotion,
    trapFocus: handleTrapFocus,
    returnFocus: handleReturnFocus,
    saveFocus,
  };
}
