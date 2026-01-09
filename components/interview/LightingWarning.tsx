"use client";

/**
 * LightingWarning Component
 *
 * Displays warnings about poor lighting conditions detected during recording.
 * Shows different messages for too dark, too bright, or low contrast lighting.
 *
 * @author Shine Studio
 */

import { memo } from "react";
import { Sun, Moon, Contrast } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

type LightingQuality = "good" | "too_dark" | "too_bright" | "low_contrast";

interface LightingWarningProps {
  /** Current lighting quality assessment */
  lightingQuality: LightingQuality;
  /** Whether to show the warning */
  show?: boolean;
  /** Compact mode for smaller display */
  compact?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LIGHTING_MESSAGES: Record<
  Exclude<LightingQuality, "good">,
  { icon: typeof Sun; title: string; tip: string; color: string }
> = {
  too_dark: {
    icon: Moon,
    title: "Low light detected",
    tip: "Try moving to a brighter area or adding a light source",
    color: "text-amber-400",
  },
  too_bright: {
    icon: Sun,
    title: "Too much light",
    tip: "Try reducing direct light or moving away from windows",
    color: "text-amber-400",
  },
  low_contrast: {
    icon: Contrast,
    title: "Flat lighting",
    tip: "Try positioning a light source to one side for depth",
    color: "text-amber-400",
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export const LightingWarning = memo(function LightingWarning({
  lightingQuality,
  show = true,
  compact = false,
}: LightingWarningProps) {
  // Don't show if lighting is good or hidden
  if (!show || lightingQuality === "good") return null;

  const config = LIGHTING_MESSAGES[lightingQuality];
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20"
        title={config.tip}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className="text-xs font-medium text-amber-400">
          {config.title}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-[var(--brand-radius)] bg-amber-500/10 border border-amber-500/20">
      <div className="flex-shrink-0 p-2 rounded-lg bg-amber-500/10">
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-400">{config.title}</p>
        <p className="text-xs text-amber-400/70 mt-0.5">{config.tip}</p>
      </div>
    </div>
  );
});

// =============================================================================
// INDICATOR VARIANT (for video overlay)
// =============================================================================

export const LightingIndicator = memo(function LightingIndicator({
  lightingQuality,
}: {
  lightingQuality: LightingQuality;
}) {
  if (lightingQuality === "good") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10">
        <div className="w-2 h-2 rounded-full bg-accent-green" />
        <span className="text-xs text-accent-green font-medium">Good light</span>
      </div>
    );
  }

  const config = LIGHTING_MESSAGES[lightingQuality];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 animate-pulse">
      <Icon className={`w-3 h-3 ${config.color}`} />
      <span className="text-xs text-amber-400 font-medium">{config.title}</span>
    </div>
  );
});
