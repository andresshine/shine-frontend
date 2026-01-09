"use client";

/**
 * CameraPermissionError Component
 *
 * Shows helpful instructions when camera/microphone access is denied.
 * Provides platform-specific guidance for enabling permissions.
 */

import { memo, useMemo } from "react";
import { Camera, Mic, RefreshCw, Settings, AlertCircle } from "lucide-react";

interface CameraPermissionErrorProps {
  /** Callback to retry permission request */
  onRetry?: () => void;
}

export const CameraPermissionError = memo(function CameraPermissionError({
  onRetry,
}: CameraPermissionErrorProps) {
  // Detect platform for specific instructions
  const platform = useMemo(() => {
    if (typeof navigator === "undefined") return "unknown";

    const ua = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    if (/macintosh|mac os x/.test(ua)) return "mac";
    if (/windows/.test(ua)) return "windows";

    return "unknown";
  }, []);

  // Detect browser
  const browser = useMemo(() => {
    if (typeof navigator === "undefined") return "unknown";

    const ua = navigator.userAgent.toLowerCase();

    if (/chrome/.test(ua) && !/edg/.test(ua)) return "chrome";
    if (/safari/.test(ua) && !/chrome/.test(ua)) return "safari";
    if (/firefox/.test(ua)) return "firefox";
    if (/edg/.test(ua)) return "edge";

    return "unknown";
  }, []);

  const getInstructions = () => {
    // iOS Safari
    if (platform === "ios") {
      return {
        title: "Camera access required",
        steps: [
          "Open Settings app on your device",
          "Scroll down and tap Safari (or your browser)",
          "Tap 'Camera' and select 'Allow'",
          "Tap 'Microphone' and select 'Allow'",
          "Return here and tap 'Try Again'",
        ],
        note: "You may need to refresh the page after changing settings.",
      };
    }

    // Android
    if (platform === "android") {
      return {
        title: "Camera access required",
        steps: [
          "Tap the lock/info icon in the address bar",
          "Tap 'Permissions' or 'Site settings'",
          "Enable Camera and Microphone",
          "Tap 'Try Again' below",
        ],
        note: "If that doesn't work, check your device Settings > Apps > Browser > Permissions.",
      };
    }

    // macOS Safari
    if (platform === "mac" && browser === "safari") {
      return {
        title: "Camera access required",
        steps: [
          "Click Safari in the menu bar",
          "Select 'Settings for This Website...'",
          "Set Camera and Microphone to 'Allow'",
          "Refresh the page",
        ],
        note: "You can also check System Settings > Privacy & Security > Camera/Microphone.",
      };
    }

    // macOS Chrome
    if (platform === "mac" && browser === "chrome") {
      return {
        title: "Camera access required",
        steps: [
          "Click the camera icon in the address bar",
          "Select 'Always allow' for camera and microphone",
          "Click 'Done' and refresh the page",
        ],
        note: "Also check System Settings > Privacy & Security > Camera/Microphone to ensure Chrome has access.",
      };
    }

    // Windows
    if (platform === "windows") {
      return {
        title: "Camera access required",
        steps: [
          "Click the camera/lock icon in the address bar",
          "Allow access to Camera and Microphone",
          "Refresh the page",
        ],
        note: "Also check Windows Settings > Privacy > Camera/Microphone to ensure your browser has access.",
      };
    }

    // Generic fallback
    return {
      title: "Camera access required",
      steps: [
        "Click the camera or lock icon in your browser's address bar",
        "Allow access to Camera and Microphone",
        "Refresh the page and try again",
      ],
      note: "You may also need to check your device's privacy settings.",
    };
  };

  const instructions = getInstructions();

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center max-w-md mx-auto">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Camera className="w-10 h-10 text-red-500 dark:text-red-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-foreground-light dark:text-foreground-dark mb-2">
        {instructions.title}
      </h2>

      {/* Description */}
      <p className="text-foreground-light-secondary dark:text-foreground-dark-muted mb-6">
        To record your video testimonial, we need access to your camera and microphone.
      </p>

      {/* Steps */}
      <div className="w-full text-left bg-card-light dark:bg-card-dark rounded-[var(--brand-radius)] p-4 mb-4">
        <p className="text-sm font-medium text-foreground-light dark:text-foreground-dark mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          How to enable access:
        </p>
        <ol className="space-y-2">
          {instructions.steps.map((step, index) => (
            <li
              key={index}
              className="text-sm text-foreground-light-secondary dark:text-foreground-dark-muted flex gap-3"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {instructions.note && (
          <p className="mt-3 text-xs text-foreground-light-muted dark:text-foreground-dark-faint italic">
            {instructions.note}
          </p>
        )}
      </div>

      {/* Permission icons */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-background-light-subtle dark:bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
            <Camera className="w-6 h-6 text-foreground-light-muted dark:text-foreground-dark-subtle" />
          </div>
          <span className="text-xs text-foreground-light-muted dark:text-foreground-dark-faint">
            Camera
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-background-light-subtle dark:bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
            <Mic className="w-6 h-6 text-foreground-light-muted dark:text-foreground-dark-subtle" />
          </div>
          <span className="text-xs text-foreground-light-muted dark:text-foreground-dark-faint">
            Microphone
          </span>
        </div>
      </div>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px]
                     rounded-[var(--brand-radius)] text-white font-semibold
                     transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, var(--brand-primary) 0%, #7269a8 100%)",
            boxShadow: "0 4px 16px rgba(143, 132, 194, 0.25)",
          }}
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>
      )}
    </div>
  );
});
