"use client";

/**
 * OfflineBanner Component
 *
 * Displays a warning banner when the user loses internet connection.
 * Shows a "back online" message when connection is restored.
 */

import { memo } from "react";
import { WifiOff, Wifi, X } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

export const OfflineBanner = memo(function OfflineBanner() {
  const { isOnline, wasOffline, clearWasOffline } = useOnlineStatus();

  // Show offline warning
  if (!isOnline) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg"
        role="alert"
        aria-live="assertive"
      >
        <WifiOff className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">
          You&apos;re offline. Your recording will be saved locally until connection is restored.
        </span>
      </div>
    );
  }

  // Show "back online" message briefly
  if (wasOffline) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[100] bg-green-500 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg"
        role="status"
        aria-live="polite"
      >
        <Wifi className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">You&apos;re back online!</span>
        <button
          onClick={clearWasOffline}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
});
