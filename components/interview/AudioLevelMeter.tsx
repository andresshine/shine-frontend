"use client";

/**
 * AudioLevelMeter Component
 *
 * Visual audio level meter showing real-time microphone input levels.
 * Displays a bar that animates based on audio input with clipping indicator.
 *
 * @author Shine Studio
 */

import { memo } from "react";
import { useAudioLevel } from "@/lib/hooks/useAudioLevel";

// =============================================================================
// TYPES
// =============================================================================

interface AudioLevelMeterProps {
  /** MediaStream to monitor */
  stream: MediaStream | null;
  /** Whether to show the meter */
  show?: boolean;
  /** Orientation of the meter */
  orientation?: "horizontal" | "vertical";
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

// =============================================================================
// COMPONENT
// =============================================================================

export const AudioLevelMeter = memo(function AudioLevelMeter({
  stream,
  show = true,
  orientation = "horizontal",
  size = "md",
}: AudioLevelMeterProps) {
  const { level, isClipping, isActive } = useAudioLevel(stream, show);

  if (!show || !isActive) return null;

  // Size configurations
  const sizes = {
    sm: { height: 4, width: 48, segments: 8 },
    md: { height: 6, width: 64, segments: 10 },
    lg: { height: 8, width: 80, segments: 12 },
  };

  const config = sizes[size];
  const isVertical = orientation === "vertical";

  // Calculate active segments
  const activeSegments = Math.round(level * config.segments);

  // Generate segment colors (green -> yellow -> red)
  const getSegmentColor = (index: number, isActive: boolean) => {
    if (!isActive) return "bg-white/10 dark:bg-white/5";

    const position = index / config.segments;
    if (position < 0.6) {
      return "bg-accent-green"; // Green for safe levels
    } else if (position < 0.85) {
      return "bg-yellow-400"; // Yellow for moderate
    } else {
      return "bg-red-500"; // Red for high/clipping
    }
  };

  return (
    <div
      className={`flex items-center gap-0.5 ${
        isVertical ? "flex-col-reverse" : "flex-row"
      }`}
      style={{
        width: isVertical ? config.height : config.width,
        height: isVertical ? config.width : config.height,
      }}
      title={`Audio level: ${Math.round(level * 100)}%${isClipping ? " (Clipping!)" : ""}`}
    >
      {Array.from({ length: config.segments }).map((_, index) => (
        <div
          key={index}
          className={`
            flex-1 rounded-[1px] transition-colors duration-75
            ${getSegmentColor(index, index < activeSegments)}
          `}
          style={{
            minWidth: isVertical ? "100%" : 2,
            minHeight: isVertical ? 2 : "100%",
          }}
        />
      ))}

      {/* Clipping indicator */}
      {isClipping && (
        <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </div>
  );
});

// =============================================================================
// SIMPLE BAR VARIANT
// =============================================================================

export const AudioLevelBar = memo(function AudioLevelBar({
  stream,
  show = true,
}: {
  stream: MediaStream | null;
  show?: boolean;
}) {
  const { level, isClipping, isActive } = useAudioLevel(stream, show);

  if (!show || !isActive) return null;

  // Color based on level
  const barColor = isClipping
    ? "bg-red-500"
    : level > 0.7
      ? "bg-yellow-400"
      : "bg-accent-green";

  return (
    <div className="relative w-full h-1.5 bg-white/10 dark:bg-white/5 rounded-full overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 ${barColor} rounded-full transition-all duration-75`}
        style={{ width: `${level * 100}%` }}
      />
    </div>
  );
});
