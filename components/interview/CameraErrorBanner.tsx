"use client";

/**
 * CameraErrorBanner Component
 *
 * Displays camera/microphone connection issues and provides
 * recovery options. Shows different states for disconnection
 * and reconnection attempts.
 *
 * @author Shine Studio
 */

import { memo } from "react";
import { Camera, Mic, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import type { DeviceHealth, DeviceStatus } from "@/lib/hooks/useCameraHealth";

// =============================================================================
// TYPES
// =============================================================================

interface CameraErrorBannerProps {
  /** Current device health status */
  health: DeviceHealth;
  /** Error message to display */
  error: string | null;
  /** Whether reconnection is in progress */
  isReconnecting: boolean;
  /** Number of reconnection attempts */
  reconnectAttempts: number;
  /** Callback to attempt reconnection */
  onReconnect: () => void;
  /** Maximum reconnection attempts before showing failure */
  maxAttempts?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

const getStatusIcon = (status: DeviceStatus) => {
  switch (status) {
    case "connected":
      return <CheckCircle className="w-4 h-4 text-accent-green" />;
    case "reconnecting":
      return <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />;
    case "disconnected":
    case "error":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
  }
};

const getStatusText = (status: DeviceStatus) => {
  switch (status) {
    case "connected":
      return "Connected";
    case "reconnecting":
      return "Reconnecting...";
    case "disconnected":
      return "Disconnected";
    case "error":
      return "Error";
  }
};

// =============================================================================
// COMPONENT
// =============================================================================

export const CameraErrorBanner = memo(function CameraErrorBanner({
  health,
  error,
  isReconnecting,
  reconnectAttempts,
  onReconnect,
  maxAttempts = 3,
}: CameraErrorBannerProps) {
  const hasIssue =
    health.camera !== "connected" || health.microphone !== "connected";
  const canRetry = reconnectAttempts < maxAttempts;

  if (!hasIssue) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
    >
      <div className="bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 rounded-[var(--brand-radius)] p-4 shadow-lg backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-red-600 dark:text-red-400">
              Device Connection Issue
            </h3>
            <p className="text-sm text-red-500/70 dark:text-red-400/70">
              {error || "Camera or microphone disconnected"}
            </p>
          </div>
        </div>

        {/* Device Status */}
        <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-black/5 dark:bg-white/5">
          {/* Camera */}
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-foreground-light-muted dark:text-foreground-dark-subtle" />
            {getStatusIcon(health.camera)}
            <span className="text-xs text-foreground-light-secondary dark:text-foreground-dark-secondary">
              {getStatusText(health.camera)}
            </span>
          </div>

          <div className="w-px h-4 bg-border-light dark:bg-border-dark" />

          {/* Microphone */}
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-foreground-light-muted dark:text-foreground-dark-subtle" />
            {getStatusIcon(health.microphone)}
            <span className="text-xs text-foreground-light-secondary dark:text-foreground-dark-secondary">
              {getStatusText(health.microphone)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {canRetry ? (
            <button
              onClick={onReconnect}
              disabled={isReconnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--brand-radius)] bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isReconnecting ? "Reconnecting..." : "Retry connection"}
            >
              <RefreshCw
                className={`w-4 h-4 ${isReconnecting ? "animate-spin" : ""}`}
              />
              {isReconnecting ? "Reconnecting..." : "Retry Connection"}
            </button>
          ) : (
            <p className="text-sm text-red-500">
              Unable to reconnect. Please refresh the page.
            </p>
          )}

          {reconnectAttempts > 0 && canRetry && (
            <span className="text-xs text-red-500/70">
              Attempt {reconnectAttempts}/{maxAttempts}
            </span>
          )}
        </div>

        {/* Help text */}
        <div className="mt-3 pt-3 border-t border-red-500/20">
          <p className="text-xs text-red-500/70 dark:text-red-400/70">
            <strong>Troubleshooting:</strong> Check that your camera and microphone
            are properly connected and not being used by another application.
          </p>
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// COMPACT VARIANT
// =============================================================================

export const CameraStatusIndicator = memo(function CameraStatusIndicator({
  health,
}: {
  health: DeviceHealth;
}) {
  const hasIssue =
    health.camera !== "connected" || health.microphone !== "connected";

  if (!hasIssue) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10">
        <div className="w-2 h-2 rounded-full bg-accent-green" />
        <span className="text-xs text-accent-green font-medium">Ready</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 animate-pulse"
      role="status"
      aria-label="Device connection issue"
    >
      <AlertTriangle className="w-3 h-3 text-red-500" />
      <span className="text-xs text-red-500 font-medium">
        {health.camera !== "connected" ? "Camera" : "Mic"} issue
      </span>
    </div>
  );
});
