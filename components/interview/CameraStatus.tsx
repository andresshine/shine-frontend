"use client";

/**
 * CameraStatus Component
 * Badge showing camera/recording status
 */

import { useInterview } from "@/lib/hooks/useInterview";

export function CameraStatus() {
  const { state } = useInterview();
  const { isRecording } = state;

  return (
    <div className="absolute top-4 left-4">
      <div className="px-3 py-2 rounded-lg flex items-center gap-2 bg-white/60 dark:bg-black/60 backdrop-blur-glass">
        {/* Status Indicator Dot */}
        <div
          className={`w-2 h-2 rounded-full ${
            isRecording
              ? "bg-red-500 animate-pulse"
              : "bg-green-500"
          }`}
        />

        {/* Status Text */}
        <span className="text-sm text-foreground-light dark:text-white">
          {isRecording ? "Recording" : "Ready to record"}
        </span>
      </div>
    </div>
  );
}
