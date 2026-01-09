"use client";

/**
 * Session Timeout Warning Component
 *
 * Modal overlay that warns users their session is about to expire.
 * Provides options to continue or end the session.
 */

import { Clock, RefreshCw, LogOut } from "lucide-react";

interface SessionTimeoutWarningProps {
  /** Whether the warning is visible */
  isVisible: boolean;
  /** Seconds remaining before timeout */
  secondsRemaining: number;
  /** Called when user wants to continue session */
  onContinue: () => void;
  /** Called when user wants to end session */
  onEndSession?: () => void;
}

export function SessionTimeoutWarning({
  isVisible,
  secondsRemaining,
  onContinue,
  onEndSession,
}: SessionTimeoutWarningProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="max-w-sm w-full bg-white dark:bg-[#141417] rounded-[var(--brand-radius)] p-6 shadow-2xl
                    border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]"
      >
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center text-[#121214] dark:text-white mb-2">
          Session Timeout
        </h2>

        {/* Message */}
        <p className="text-center text-[#787168] dark:text-[rgba(255,255,255,0.6)] mb-4">
          Your session will expire due to inactivity.
        </p>

        {/* Countdown */}
        <div className="text-center mb-6">
          <span className="text-4xl font-bold text-amber-500">
            {secondsRemaining}
          </span>
          <span className="text-sm text-[#787168] dark:text-[rgba(255,255,255,0.6)] ml-2">
            seconds remaining
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 min-h-[44px]
                       rounded-xl text-white font-semibold
                       transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #8f84c2 0%, #7269a8 100%)",
              boxShadow: "0 4px 16px rgba(143, 132, 194, 0.25)",
            }}
          >
            <RefreshCw className="w-5 h-5" />
            Continue Session
          </button>

          {onEndSession && (
            <button
              onClick={onEndSession}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 min-h-[44px]
                         rounded-xl font-semibold
                         bg-transparent
                         border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]
                         text-[#787168] dark:text-[rgba(255,255,255,0.6)]
                         hover:border-[rgba(0,0,0,0.2)] dark:hover:border-[rgba(255,255,255,0.2)]
                         transition-colors"
            >
              <LogOut className="w-5 h-5" />
              End Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
