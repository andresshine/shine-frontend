/**
 * useOnlineStatus Hook
 *
 * Tracks browser online/offline status and provides connection state.
 * Useful for showing offline warnings and handling network changes gracefully.
 */

import { useState, useEffect, useCallback } from "react";

interface UseOnlineStatusResult {
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Whether connection was just restored (for showing "back online" message) */
  wasOffline: boolean;
  /** Clear the wasOffline flag */
  clearWasOffline: () => void;
}

export function useOnlineStatus(): UseOnlineStatusResult {
  const [isOnline, setIsOnline] = useState(() => {
    // Default to true during SSR
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  });

  const [wasOffline, setWasOffline] = useState(false);

  const clearWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      console.log("🌐 Connection restored");

      // Auto-clear the "back online" message after 5 seconds
      setTimeout(() => {
        setWasOffline(false);
      }, 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("🌐 Connection lost");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    clearWasOffline,
  };
}
