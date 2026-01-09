"use client";

/**
 * Session Timeout Hook
 *
 * Monitors user activity and triggers a warning/timeout after periods of inactivity.
 * Useful for interview sessions to prevent data loss from idle sessions.
 *
 * Features:
 * - Configurable warning and timeout durations
 * - Tracks mouse, keyboard, touch, and scroll events
 * - Provides countdown for warning state
 * - Callbacks for warning and timeout events
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface UseSessionTimeoutOptions {
  /** Time in ms before showing warning (default: 5 minutes) */
  warningTime?: number;
  /** Time in ms after warning before timeout (default: 1 minute) */
  timeoutAfterWarning?: number;
  /** Called when warning should be shown */
  onWarning?: () => void;
  /** Called when session times out */
  onTimeout?: () => void;
  /** Called when user activity resets the timer */
  onActivity?: () => void;
  /** Whether the timeout is enabled (default: true) */
  enabled?: boolean;
}

interface UseSessionTimeoutResult {
  /** Whether the warning is currently showing */
  isWarningVisible: boolean;
  /** Seconds remaining before timeout (only valid when warning is visible) */
  secondsRemaining: number;
  /** Manually reset the timeout timer */
  resetTimeout: () => void;
  /** Dismiss the warning and reset timer */
  dismissWarning: () => void;
}

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "touchstart",
  "scroll",
  "click",
] as const;

export function useSessionTimeout({
  warningTime = 5 * 60 * 1000, // 5 minutes
  timeoutAfterWarning = 60 * 1000, // 1 minute
  onWarning,
  onTimeout,
  onActivity,
  enabled = true,
}: UseSessionTimeoutOptions = {}): UseSessionTimeoutResult {
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Start the warning timer
  const startWarningTimer = useCallback(() => {
    clearAllTimers();
    lastActivityRef.current = Date.now();

    warningTimerRef.current = setTimeout(() => {
      setIsWarningVisible(true);
      setSecondsRemaining(Math.ceil(timeoutAfterWarning / 1000));
      onWarning?.();

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearAllTimers();
            onTimeout?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set timeout timer
      timeoutTimerRef.current = setTimeout(() => {
        clearAllTimers();
        onTimeout?.();
      }, timeoutAfterWarning);
    }, warningTime);
  }, [warningTime, timeoutAfterWarning, onWarning, onTimeout, clearAllTimers]);

  // Reset the timeout
  const resetTimeout = useCallback(() => {
    if (!enabled) return;
    setIsWarningVisible(false);
    setSecondsRemaining(0);
    startWarningTimer();
    onActivity?.();
  }, [enabled, startWarningTimer, onActivity]);

  // Dismiss warning and reset
  const dismissWarning = useCallback(() => {
    setIsWarningVisible(false);
    setSecondsRemaining(0);
    startWarningTimer();
  }, [startWarningTimer]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    if (!enabled) return;

    // Throttle activity detection to every 1 second
    const now = Date.now();
    if (now - lastActivityRef.current < 1000) return;

    // Only reset if warning is not visible (user must explicitly dismiss)
    if (!isWarningVisible) {
      lastActivityRef.current = now;
      startWarningTimer();
    }
  }, [enabled, isWarningVisible, startWarningTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      return;
    }

    // Start initial timer
    startWarningTimer();

    // Add activity listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, handleActivity, startWarningTimer, clearAllTimers]);

  return {
    isWarningVisible,
    secondsRemaining,
    resetTimeout,
    dismissWarning,
  };
}
