"use client";

/**
 * VideoContainer Component
 *
 * Displays the live camera feed with cinematic overlays and controls.
 * Supports multiple viewing modes including glasses mode (hidden preview)
 * for users who want to reduce glare from their screen.
 *
 * Features:
 * - Live video feed with aspect ratio preservation
 * - Cinematic countdown overlay (3, 2, 1)
 * - Face framing guide for optimal positioning
 * - Glasses mode for hiding self-view
 * - Background blur controls
 * - Recording indicator
 *
 * @author Shine Studio
 */

import { useRef, useEffect, memo, useCallback, useState } from "react";
import { Eye, EyeOff, Video } from "lucide-react";
import { FaceGuide } from "./FaceGuide";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Smooth ease-out curve for natural deceleration */
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Smooth ease-in-out for balanced animations */
const EASE_IN_OUT = "cubic-bezier(0.45, 0, 0.15, 1)";

/** Animation duration for layout transitions */
const LAYOUT_TRANSITION_MS = 600;

/** Animation duration for opacity transitions */
const OPACITY_TRANSITION_MS = 500;

/** Animation duration for video fold/unfold - slow and elegant */
const FOLD_TRANSITION_MS = 800;

/** Debounce delay for blur slider (ms) */
const BLUR_SLIDER_DEBOUNCE_MS = 150;

// =============================================================================
// TYPES
// =============================================================================

interface VideoContainerProps {
  /** MediaStream from camera (processed or raw) */
  stream?: MediaStream | null;
  /** URL for playback preview after recording */
  previewUrl?: string | null;
  /** Whether actively recording */
  isRecording?: boolean;
  /** Whether background blur is enabled */
  isBlurEnabled?: boolean;
  /** Callback to toggle blur on/off */
  onToggleBlur?: () => void;
  /** Whether to show blur toggle controls */
  showBlurToggle?: boolean;
  /** Blur intensity in pixels (5-30) */
  blurAmount?: number;
  /** Callback when blur amount changes */
  onBlurAmountChange?: (amount: number) => void;
  /** Whether user is properly framed in camera */
  isProperlyFramed?: boolean;
  /** Countdown value (3, 2, 1, or null) */
  countdown?: number | null;
  /** Whether glasses mode (hidden preview) is active */
  isGlassesMode?: boolean;
  /** Callback when glasses mode changes */
  onGlassesModeChange?: (enabled: boolean) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const VideoContainer = memo(function VideoContainer({
  stream,
  previewUrl,
  isRecording = false,
  isBlurEnabled = false,
  onToggleBlur,
  showBlurToggle = false,
  blurAmount = 15,
  onBlurAmountChange,
  isProperlyFramed = false,
  countdown = null,
  isGlassesMode = false,
  onGlassesModeChange,
}: VideoContainerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const blurDebounceRef = useRef<NodeJS.Timeout | null>(null);

  /** Local blur value for instant slider feedback */
  const [localBlurAmount, setLocalBlurAmount] = useState(blurAmount);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  /** Toggle glasses mode on/off */
  const handleGlassesModeToggle = useCallback(
    (enabled: boolean) => {
      onGlassesModeChange?.(enabled);
    },
    [onGlassesModeChange]
  );

  /** Handle blur amount slider change with debouncing */
  const handleBlurAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);

      // Update local state immediately for responsive slider
      setLocalBlurAmount(value);

      // Debounce the actual update to parent
      if (blurDebounceRef.current) {
        clearTimeout(blurDebounceRef.current);
      }

      blurDebounceRef.current = setTimeout(() => {
        onBlurAmountChange?.(value);
      }, BLUR_SLIDER_DEBOUNCE_MS);
    },
    [onBlurAmountChange]
  );

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /** Sync local blur amount with prop when it changes externally */
  useEffect(() => {
    setLocalBlurAmount(blurAmount);
  }, [blurAmount]);

  /** Cleanup debounce timer on unmount */
  useEffect(() => {
    return () => {
      if (blurDebounceRef.current) {
        clearTimeout(blurDebounceRef.current);
      }
    };
  }, []);

  /** Attach MediaStream to video element when stream changes */
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------

  const showFaceGuide =
    !isRecording &&
    countdown === null &&
    !previewUrl &&
    !isProperlyFramed &&
    !isGlassesMode;

  const showVideoControls =
    (showBlurToggle || isRecording || !previewUrl) && !isGlassesMode;

  const showGlassesModeOverlay = isGlassesMode && !previewUrl;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={`min-h-0 flex items-center justify-center w-full ${
        isGlassesMode ? "flex-none" : "flex-1"
      }`}
      style={{
        transition: `flex ${LAYOUT_TRANSITION_MS}ms ${EASE_IN_OUT}`,
      }}
    >
      {/* Video Frame Container */}
      <div
        className="w-full rounded-[var(--brand-radius)] overflow-hidden relative border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]"
        style={{
          height: isGlassesMode ? "72px" : undefined,
          aspectRatio: isGlassesMode ? undefined : "16/9",
          minHeight: isGlassesMode ? "72px" : "200px",
          maxHeight: isGlassesMode ? "72px" : "100%",
          boxShadow: isGlassesMode
            ? "0 2px 8px rgba(0, 0, 0, 0.08)"
            : "0 8px 32px rgba(0, 0, 0, 0.15)",
          transition: `height ${FOLD_TRANSITION_MS}ms ${EASE_OUT},
                       min-height ${FOLD_TRANSITION_MS}ms ${EASE_OUT},
                       max-height ${FOLD_TRANSITION_MS}ms ${EASE_OUT},
                       box-shadow ${FOLD_TRANSITION_MS}ms ${EASE_IN_OUT}`,
        }}
      >
        {/* ================================================================= */}
        {/* VIDEO FEED                                                        */}
        {/* ================================================================= */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!previewUrl}
          src={previewUrl || undefined}
          className="absolute inset-0 w-full h-full object-cover bg-black"
        />

        {/* ================================================================= */}
        {/* CINEMATIC OVERLAYS                                                */}
        {/* ================================================================= */}

        {/* Vignette - subtle darkening at edges for cinema feel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, transparent 50%, rgba(0,0,0,0.15) 100%)",
            mixBlendMode: "multiply",
          }}
        />

        {/* Film grain texture overlay */}
        <div className="film-grain" />

        {/* ================================================================= */}
        {/* COUNTDOWN OVERLAY (Normal Mode)                                   */}
        {/* ================================================================= */}
        {countdown !== null && !isGlassesMode && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center animate-backdrop-in"
            style={{
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            {/* Animated countdown number */}
            <div
              key={countdown}
              className="animate-countdown"
              style={{
                fontSize: "clamp(80px, 20vw, 160px)",
                fontWeight: 800,
                color: "#EAB36C",
                textShadow:
                  "0 0 60px rgba(234, 179, 108, 0.5), 0 4px 20px rgba(0, 0, 0, 0.3)",
                fontFamily: "var(--brand-font-family)",
                lineHeight: 1,
              }}
            >
              {countdown}
            </div>

            {/* Status text */}
            <p
              className="mt-4 text-white/70 text-lg font-medium tracking-wide uppercase"
              style={{ letterSpacing: "0.2em" }}
            >
              {countdown === 3
                ? "Get Ready"
                : countdown === 1
                ? "Recording..."
                : ""}
            </p>
          </div>
        )}

        {/* ================================================================= */}
        {/* FACE GUIDE                                                        */}
        {/* ================================================================= */}
        {showFaceGuide && <FaceGuide />}

        {/* ================================================================= */}
        {/* GLASSES MODE OVERLAY                                              */}
        {/* Hides self-view to reduce glare for glasses wearers               */}
        {/* ================================================================= */}
        <div
          className={`
            absolute inset-0 z-[25] flex items-center justify-center
            gap-4 sm:gap-8 px-4 sm:px-8
            bg-[#F5F3EF] dark:bg-black
            ${showGlassesModeOverlay ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
          style={{
            transition: `opacity ${OPACITY_TRANSITION_MS}ms ${EASE_OUT}`,
          }}
        >
          {/* Gradient background (dark mode only) */}
          <div
            className="absolute inset-0 opacity-0 dark:opacity-30 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(143, 132, 194, 0.3) 0%, transparent 70%)",
            }}
          />

          {/* Countdown (Glasses Mode) */}
          {countdown !== null && (
            <>
              <div
                key={countdown}
                className="animate-countdown text-foreground-light dark:text-white"
                style={{
                  fontSize: "clamp(48px, 10vw, 72px)",
                  fontWeight: 800,
                  fontFamily: "var(--brand-font-family)",
                  lineHeight: 1,
                }}
              >
                {countdown}
              </div>
              <p className="text-foreground-light-muted dark:text-white/60 text-base font-medium">
                {countdown === 3
                  ? "Get Ready"
                  : countdown === 1
                  ? "Recording..."
                  : ""}
              </p>
            </>
          )}

          {/* Recording Indicator (Glasses Mode) */}
          {isRecording && countdown === null && (
            <>
              <div
                className="flex items-center gap-3 opacity-100"
                style={{
                  transition: `all 600ms ${EASE_OUT} 100ms`,
                }}
              >
                <div className="w-3 h-3 rounded-full bg-red-500 animate-recording-pulse" />
                <span className="text-foreground-light dark:text-white/90 text-base font-medium">
                  Recording
                </span>
              </div>
              <div
                className="w-px h-8 bg-black/10 dark:bg-white/20"
                style={{
                  transition: `all 500ms ${EASE_OUT} 150ms`,
                }}
              />
            </>
          )}

          {/* Status Message (Glasses Mode) */}
          {countdown === null && (
            <div
              className="flex items-center gap-3 text-foreground-light-muted dark:text-white/60"
              style={{
                transition: `all 600ms ${EASE_OUT} 200ms`,
              }}
            >
              <Video className="w-6 h-6 opacity-60" />
              <p className="text-sm">
                {isRecording ? "Self-view hidden for glasses" : "Preview hidden"}
              </p>
            </div>
          )}

          {/* Show Preview Button (Glasses Mode) */}
          {countdown === null && (
            <button
              onClick={() => handleGlassesModeToggle(false)}
              className="flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-foreground-light dark:text-white/80 text-sm font-medium"
              style={{
                transition: `all 600ms ${EASE_OUT} 250ms, background-color 200ms ease`,
              }}
            >
              <Eye className="w-5 h-5" />
              Show preview
            </button>
          )}
        </div>

        {/* ================================================================= */}
        {/* RECORDING INDICATOR (Normal Mode)                                 */}
        {/* ================================================================= */}
        {isRecording && !isGlassesMode && (
          <div className="absolute top-4 left-4 xl:top-6 xl:left-6 2xl:top-8 2xl:left-8 z-20 flex items-center gap-2.5 xl:gap-3 2xl:gap-4 px-3 py-2 xl:px-4 xl:py-2.5 2xl:px-5 2xl:py-3 rounded-[var(--brand-radius)] bg-black/60 backdrop-blur-sm">
            <div className="w-2.5 h-2.5 xl:w-3 xl:h-3 2xl:w-4 2xl:h-4 rounded-full bg-red-500 animate-recording-pulse" />
            <span className="text-sm xl:text-base 2xl:text-lg font-medium text-white">
              Recording
            </span>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIDEO CONTROLS                                                    */}
        {/* ================================================================= */}
        {showVideoControls && (
          <div className="absolute top-4 right-4 xl:top-6 xl:right-6 2xl:top-8 2xl:right-8 z-20 flex items-center gap-2 xl:gap-3">
            {/* Blur Intensity Slider */}
            {showBlurToggle && isBlurEnabled && onBlurAmountChange && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-black/60 backdrop-blur-sm">
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={localBlurAmount}
                  onChange={handleBlurAmountChange}
                  className="w-20 h-1 bg-[#E7E4DF] dark:bg-[rgba(255,255,255,0.2)] rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: "var(--brand-primary)" }}
                  title={`Blur intensity: ${localBlurAmount}px`}
                />
              </div>
            )}

            {/* Blur Toggle Button */}
            {showBlurToggle && (
              <button
                onClick={onToggleBlur}
                className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white/60 dark:bg-black/60 backdrop-blur-sm transition-all hover:bg-white/80 dark:hover:bg-black/80"
                title={
                  isBlurEnabled
                    ? "Disable background blur"
                    : "Enable background blur"
                }
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-foreground-light dark:text-white"
                >
                  <path
                    d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={isBlurEnabled ? "currentColor" : "none"}
                  />
                </svg>
              </button>
            )}

            {/* Hide Preview Button (Enter Glasses Mode) */}
            {!previewUrl && (
              <button
                onClick={() => handleGlassesModeToggle(true)}
                className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white/60 dark:bg-black/60 backdrop-blur-sm transition-all hover:bg-white/80 dark:hover:bg-black/80"
                title="Hide self-view (reduces glare in glasses)"
              >
                <EyeOff className="w-5 h-5 text-foreground-light dark:text-white" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
