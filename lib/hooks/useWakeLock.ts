/**
 * useWakeLock Hook
 *
 * Prevents the screen from sleeping during video recording.
 * Uses the Screen Wake Lock API when available, with graceful fallback.
 */

import { useEffect, useRef, useCallback } from "react";

interface UseWakeLockOptions {
  /** Whether wake lock should be active */
  enabled: boolean;
}

interface UseWakeLockResult {
  /** Whether wake lock is currently active */
  isActive: boolean;
  /** Whether wake lock is supported in this browser */
  isSupported: boolean;
  /** Request wake lock manually */
  request: () => Promise<void>;
  /** Release wake lock manually */
  release: () => Promise<void>;
}

export function useWakeLock({ enabled }: UseWakeLockOptions): UseWakeLockResult {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isActiveRef = useRef(false);

  // Check if Wake Lock API is supported
  const isSupported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  /** Request a wake lock */
  const request = useCallback(async () => {
    if (!isSupported) {
      console.log("🔋 Wake Lock not supported in this browser");
      return;
    }

    try {
      // Release any existing wake lock first
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
      }

      // Request new wake lock
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      isActiveRef.current = true;
      console.log("🔋 Wake Lock activated - screen will stay on");

      // Handle wake lock release (e.g., when tab becomes hidden)
      wakeLockRef.current.addEventListener("release", () => {
        isActiveRef.current = false;
        console.log("🔋 Wake Lock released");
      });
    } catch (err) {
      // Wake lock request can fail if:
      // - Page is not visible
      // - Battery is low (some browsers)
      // - User denied permission
      console.warn("🔋 Wake Lock request failed:", err);
      isActiveRef.current = false;
    }
  }, [isSupported]);

  /** Release the wake lock */
  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        isActiveRef.current = false;
        console.log("🔋 Wake Lock manually released");
      } catch (err) {
        console.warn("🔋 Wake Lock release failed:", err);
      }
    }
  }, []);

  // Auto-manage wake lock based on enabled state
  useEffect(() => {
    if (enabled) {
      request();
    } else {
      release();
    }

    return () => {
      release();
    };
  }, [enabled, request, release]);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    if (!enabled || !isSupported) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && enabled) {
        // Re-request wake lock when page becomes visible
        await request();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, isSupported, request]);

  return {
    isActive: isActiveRef.current,
    isSupported,
    request,
    release,
  };
}
