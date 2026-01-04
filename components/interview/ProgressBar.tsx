"use client";

/**
 * ProgressBar Component
 * Displays progress through interview questions with time estimate
 */

import { Clock } from "lucide-react";
import { useInterview } from "@/lib/hooks/useInterview";

export function ProgressBar() {
  const { progress, timeEstimate } = useInterview();

  return (
    <div className="px-4 md:px-6 py-4 md:py-6 pb-5 md:pb-[29px] border-b border-border-light dark:border-gold/10 bg-white/30 dark:bg-gray-900/30">
      {/* Time Remaining */}
      <div className="flex items-center justify-end gap-2 mb-2">
        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 dark:text-gray-400" />
        <span
          className="text-sm md:text-base font-semibold bg-gradient-to-br from-brand-primary to-brand-secondary bg-clip-text text-transparent"
          aria-live="polite"
        >
          {timeEstimate.min} - {timeEstimate.max} min
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="h-1.5 md:h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-300 relative"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
