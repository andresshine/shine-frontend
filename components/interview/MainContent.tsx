"use client";

/**
 * MainContent Component
 *
 * The primary content area for the interview experience. Orchestrates the video
 * feed, recording controls, question display, and visual effects like rim lighting
 * and background blur.
 *
 * Features:
 * - Live camera feed with background blur processing
 * - Recording controls with countdown animation
 * - Glasses mode for users who want to hide self-view
 * - Rim light effect for professional eye lighting (dark mode only)
 * - Resolution guidance for low-quality camera feeds
 * - Answer evaluation integration
 *
 * @author Shine Studio
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { CurrentQuestion } from "./CurrentQuestion";
import { VideoContainer } from "./VideoContainer";
import { RecordingControls } from "./RecordingControls";
import { CameraPermissionError } from "./CameraPermissionError";
import { useVideoRecorder } from "@/lib/hooks/useVideoRecorder";
import { useMediaDevices } from "@/lib/hooks/useMediaDevices";
import { useAnswerEvaluation } from "@/lib/hooks/useAnswerEvaluation";
import { useBackgroundBlur } from "@/lib/hooks/useBackgroundBlur";
import { useInterview } from "@/lib/hooks/useInterview";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import {
  playCountdownBeep,
  playRecordingStartSound,
} from "@/lib/utils/countdownAudio";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Premium easing curve for smooth, cinematic animations */
const CINEMATIC_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

/** Duration for rim light fade transitions */
const RIM_LIGHT_TRANSITION_MS = 800;

/** Duration for layout transitions (glasses mode, etc.) */
const LAYOUT_TRANSITION_MS = 700;

/** Countdown interval in milliseconds */
const COUNTDOWN_INTERVAL_MS = 1000;

/** Starting value for recording countdown */
const COUNTDOWN_START = 3;

/** Default blur intensity in pixels */
const DEFAULT_BLUR_AMOUNT = 5;

/** Minimum resolution height before showing guidance */
const MIN_RESOLUTION_HEIGHT = 720;

// =============================================================================
// TYPES
// =============================================================================

interface MainContentProps {
  /** Callback to toggle brand customization panel */
  onBrandPanelToggle?: () => void;
  /** Callback to toggle questions sidebar */
  onQuestionsToggle?: () => void;
  /** Whether questions sidebar is expanded */
  isQuestionsExpanded?: boolean;
  /** Whether rim light effect is enabled */
  isRimLightEnabled?: boolean;
  /** Callback to toggle rim light on/off */
  onToggleRimLight?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MainContent({
  onBrandPanelToggle,
  onQuestionsToggle,
  isQuestionsExpanded,
  isRimLightEnabled,
  onToggleRimLight,
}: MainContentProps) {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------

  const videoRecorder = useVideoRecorder();
  const mediaDevices = useMediaDevices();
  const answerEvaluation = useAnswerEvaluation();
  const { state: interviewState } = useInterview();
  const { theme } = useTheme();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** Glasses mode hides self-view to reduce glare for glasses wearers */
  const [isGlassesMode, setIsGlassesMode] = useState(false);

  /** Raw camera stream before blur processing */
  const rawStreamRef = useRef<MediaStream | null>(null);
  const [rawStream, setRawStream] = useState<MediaStream | null>(null);

  /** Blur intensity in pixels (range: 5-30) */
  const [blurAmount, setBlurAmount] = useState(DEFAULT_BLUR_AMOUNT);

  /** Actual camera resolution for quality guidance */
  const [actualVideoResolution, setActualVideoResolution] = useState<{
    width: number;
    height: number;
  } | null>(null);

  /** Whether to show low resolution warning */
  const [showResolutionGuidance, setShowResolutionGuidance] = useState(false);

  /** Countdown value for recording start animation (3, 2, 1, or null) */
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------

  /** Rim light activates when recording + enabled + dark mode */
  const showRimLight =
    interviewState.isRecording && isRimLightEnabled && theme === "dark";

  /** Enhanced rim light in glasses mode (max brightness since user can't see screen) */
  const isEnhancedRimLight = showRimLight && isGlassesMode;

  /** Center content vertically when glasses mode is active */
  const shouldCenterContent = isGlassesMode;

  // ---------------------------------------------------------------------------
  // Background Blur Processing
  // ---------------------------------------------------------------------------

  const backgroundBlur = useBackgroundBlur(rawStream, blurAmount);

  // ---------------------------------------------------------------------------
  // Screen Wake Lock (prevents screen from sleeping during recording)
  // ---------------------------------------------------------------------------

  useWakeLock({ enabled: videoRecorder.state.isRecording || countdown !== null });

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  /**
   * Start the cinematic countdown sequence before recording
   * Counts down from 3 to 1 with audio feedback, then calls the completion callback
   */
  const startCountdown = useCallback((onComplete: () => void) => {
    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setCountdown(COUNTDOWN_START);
    playCountdownBeep(false); // Play beep for initial "3"

    let count = COUNTDOWN_START;

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playCountdownBeep(count === 1); // Higher pitch for "1"
      } else {
        // Countdown complete - cleanup and trigger recording
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        playRecordingStartSound(); // Play "recording started" sound
        onComplete();
      }
    }, COUNTDOWN_INTERVAL_MS);
  }, []);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /** Cleanup countdown interval on unmount */
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  /** Reset glasses mode when recording stops */
  useEffect(() => {
    if (!interviewState.isRecording) {
      setIsGlassesMode(false);
    }
  }, [interviewState.isRecording]);

  /**
   * Initialize camera stream on mount and when devices change
   *
   * Strategy:
   * 1. Try 1080p exact resolution first for best quality
   * 2. Fall back to 720p if 1080p is not supported
   * 3. Show guidance banner if resolution is below 720p
   *
   * Note: isRecording is NOT in dependencies - we keep the raw stream alive
   * during recording because background blur needs it to process frames
   */
  useEffect(() => {
    async function initCamera() {
      let stream: MediaStream | null = null;

      try {
        // Stop existing stream if any
        if (rawStreamRef.current) {
          rawStreamRef.current.getTracks().forEach((track) => track.stop());
          rawStreamRef.current = null;
          setRawStream(null);
        }

        // Audio constraints with noise reduction
        const audioConstraints = mediaDevices.selectedAudioDevice
          ? {
              deviceId: { exact: mediaDevices.selectedAudioDevice },
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            };

        // Attempt 1: Request 1080p resolution
        const constraints1080p: MediaStreamConstraints = {
          video: mediaDevices.selectedVideoDevice
            ? {
                deviceId: { exact: mediaDevices.selectedVideoDevice },
                width: { exact: 1920 },
                height: { exact: 1080 },
                aspectRatio: { exact: 16 / 9 },
              }
            : {
                width: { exact: 1920 },
                height: { exact: 1080 },
                aspectRatio: { exact: 16 / 9 },
                facingMode: "user",
              },
          audio: audioConstraints,
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints1080p);
          console.log("🎥 Obtained 1080p stream");
        } catch (error) {
          if (error instanceof OverconstrainedError) {
            console.warn("🎥 1080p unavailable, falling back to 720p");

            // Attempt 2: Fall back to 720p
            const constraints720p: MediaStreamConstraints = {
              video: mediaDevices.selectedVideoDevice
                ? {
                    deviceId: { exact: mediaDevices.selectedVideoDevice },
                    width: { exact: 1280 },
                    height: { exact: 720 },
                    aspectRatio: { exact: 16 / 9 },
                  }
                : {
                    width: { exact: 1280 },
                    height: { exact: 720 },
                    aspectRatio: { exact: 16 / 9 },
                    facingMode: "user",
                  },
              audio: audioConstraints,
            };

            try {
              stream = await navigator.mediaDevices.getUserMedia(constraints720p);
              console.log("🎥 Obtained 720p stream");
            } catch (error720) {
              console.warn("🎥 720p unavailable, using best available");

              // Attempt 3: Use ideal constraints (accepts any resolution)
              const constraintsFallback: MediaStreamConstraints = {
                video: mediaDevices.selectedVideoDevice
                  ? {
                      deviceId: { exact: mediaDevices.selectedVideoDevice },
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                    }
                  : {
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                      facingMode: "user",
                    },
                audio: audioConstraints,
              };

              stream = await navigator.mediaDevices.getUserMedia(constraintsFallback);
              console.log("🎥 Obtained fallback stream");
            }
          } else {
            throw error;
          }
        }

        // Store stream reference
        rawStreamRef.current = stream;
        setRawStream(stream);

        // Get actual resolution from video track
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();

        // Set content hint for Chrome to prevent internal downscaling
        if (videoTrack.contentHint !== undefined) {
          videoTrack.contentHint = "detail";
        }

        console.log(`🎥 Camera: ${videoTrack.label} @ ${settings.width}x${settings.height}`);

        // Update resolution state and show guidance if below 720p
        setActualVideoResolution({
          width: settings.width || 0,
          height: settings.height || 0,
        });
        setShowResolutionGuidance(
          (settings.height ?? 0) < MIN_RESOLUTION_HEIGHT
        );
      } catch (error) {
        console.error("Camera initialization error:", error);

        // Clean up on error
        setActualVideoResolution(null);
        setShowResolutionGuidance(false);
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        rawStreamRef.current = null;
        setRawStream(null);
      }
    }

    // Only initialize if we have camera permissions
    if (mediaDevices.hasPermissions) {
      initCamera();
    }

    // Cleanup on unmount or device change
    return () => {
      if (rawStreamRef.current) {
        rawStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [
    mediaDevices.selectedAudioDevice,
    mediaDevices.selectedVideoDevice,
    mediaDevices.hasPermissions,
  ]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main
      className={`w-full max-w-6xl 2xl:max-w-7xl flex flex-col relative p-8 ${
        shouldCenterContent ? "h-auto my-auto" : "h-full max-h-full"
      }`}
      role="main"
      style={{
        // Negative margins reserve space for rim light glow (prevents layout shift)
        marginLeft: "-32px",
        marginRight: "-32px",
        marginTop: shouldCenterContent ? "auto" : "-32px",
        marginBottom: shouldCenterContent ? "auto" : "-32px",
        borderRadius: "var(--brand-radius, 12px)",

        // Rim light: Warm white glow to create professional eye catchlights
        // Enhanced mode when glasses mode active (user can't see screen)
        boxShadow: isEnhancedRimLight
          ? `0 0 80px 30px rgba(255, 255, 255, 1),
             0 0 120px 60px rgba(255, 255, 255, 0.95),
             0 0 180px 100px rgba(255, 253, 245, 0.85),
             0 0 260px 150px rgba(255, 250, 235, 0.7),
             0 0 400px 220px rgba(255, 245, 220, 0.5)`
          : showRimLight
            ? `0 0 40px 15px rgba(255, 255, 255, 1),
               0 0 80px 30px rgba(255, 253, 240, 0.9),
               0 0 120px 50px rgba(255, 250, 230, 0.7),
               0 0 180px 80px rgba(255, 245, 220, 0.5),
               0 0 300px 120px rgba(255, 240, 210, 0.3)`
            : "none",

        // Cinematic transitions for all animated properties
        transition: `box-shadow ${RIM_LIGHT_TRANSITION_MS}ms ${CINEMATIC_EASE},
                     margin ${LAYOUT_TRANSITION_MS}ms ${CINEMATIC_EASE},
                     height ${LAYOUT_TRANSITION_MS}ms ${CINEMATIC_EASE},
                     max-height ${LAYOUT_TRANSITION_MS}ms ${CINEMATIC_EASE}`,
      }}
    >
      {/* ================================================================= */}
      {/* RESOLUTION GUIDANCE BANNER                                       */}
      {/* Shown when camera provides below 720p quality                    */}
      {/* ================================================================= */}
      {showResolutionGuidance && actualVideoResolution && (
        <div
          className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500
                     text-yellow-800 dark:text-yellow-200 p-4 mx-4 md:mx-8 mb-4 rounded-md"
          role="alert"
        >
          <p className="font-bold">
            Low Resolution Detected ({actualVideoResolution.width}x
            {actualVideoResolution.height})
          </p>
          <p className="text-sm mt-1">
            Your camera is providing lower resolution than ideal. For best
            quality:
          </p>
          <ul className="list-disc list-inside text-sm mt-2">
            <li>Switch to a different camera if available</li>
            <li>Try a different browser (Safari often works better on macOS)</li>
            <li>Check your OS camera privacy settings</li>
          </ul>
          <button
            onClick={() => setShowResolutionGuidance(false)}
            className="mt-3 text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* CURRENT QUESTION                                                 */}
      {/* Positioned near camera for natural eye contact                   */}
      {/* ================================================================= */}
      <CurrentQuestion answerEvaluation={answerEvaluation} />

      {/* ================================================================= */}
      {/* VIDEO & CONTROLS CONTAINER                                       */}
      {/* ================================================================= */}

      {/* Show permission error if camera access denied */}
      {!mediaDevices.hasPermissions ? (
        <div className="flex-1 flex items-center justify-center">
          <CameraPermissionError
            onRetry={() => {
              // Refresh the page to re-trigger permission prompt
              window.location.reload();
            }}
          />
        </div>
      ) : (
      <div
        className={`flex flex-col min-h-0 ${
          isGlassesMode ? "flex-none" : "flex-1"
        }`}
        style={{
          transition: `all ${LAYOUT_TRANSITION_MS}ms ${CINEMATIC_EASE}`,
        }}
      >
        {/* Video Container - shrinks in glasses mode */}
        <div
          className={`min-h-0 flex flex-col relative ${
            isGlassesMode ? "flex-none" : "flex-1"
          }`}
          style={{
            transition: `all ${LAYOUT_TRANSITION_MS}ms ${CINEMATIC_EASE}`,
          }}
        >
          {/* Loading overlay while MediaPipe initializes */}
          {backgroundBlur.isLoading && rawStream && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-[var(--brand-radius)]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(20,20,23,0.85) 100%)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="flex flex-col items-center gap-4">
                {/* Animated loading ring */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-white/10" />
                  <div
                    className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent animate-spin"
                    style={{
                      borderTopColor: "var(--brand-primary, #8F84C2)",
                      animationDuration: "1s",
                    }}
                  />
                  <Loader2
                    className="absolute inset-0 m-auto w-6 h-6 text-white/60 animate-pulse"
                    style={{ animationDuration: "1.5s" }}
                  />
                </div>

                {/* Loading text */}
                <div className="text-center">
                  <p className="text-white font-medium">Setting up your camera</p>
                  <p className="text-white/60 text-sm mt-1">
                    Initializing video effects...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Live Video Feed */}
          <VideoContainer
            stream={
              videoRecorder.state.recordingStream ||
              backgroundBlur.processedStream ||
              rawStream
            }
            previewUrl={videoRecorder.state.previewUrl}
            isRecording={videoRecorder.state.isRecording}
            isBlurEnabled={backgroundBlur.isBlurEnabled}
            onToggleBlur={backgroundBlur.toggleBlur}
            showBlurToggle={
              !!backgroundBlur.processedStream &&
              !videoRecorder.state.previewUrl
            }
            blurAmount={blurAmount}
            onBlurAmountChange={setBlurAmount}
            isProperlyFramed={backgroundBlur.isProperlyFramed}
            countdown={countdown}
            isGlassesMode={isGlassesMode}
            onGlassesModeChange={setIsGlassesMode}
          />
        </div>

        {/* =============================================================== */}
        {/* RECORDING CONTROLS                                              */}
        {/* =============================================================== */}
        <div className="pt-4 flex-shrink-0">
          <RecordingControls
            videoRecorder={videoRecorder}
            mediaDevices={mediaDevices}
            answerEvaluation={answerEvaluation}
            previewStream={backgroundBlur.processedStream || rawStream}
            onBrandPanelToggle={onBrandPanelToggle}
            onQuestionsToggle={onQuestionsToggle}
            isQuestionsExpanded={isQuestionsExpanded}
            isRimLightEnabled={isRimLightEnabled}
            onToggleRimLight={onToggleRimLight}
            onStartCountdown={startCountdown}
            isCountingDown={countdown !== null}
            isSkinSmoothingEnabled={backgroundBlur.isSkinSmoothingEnabled}
            onToggleSkinSmoothing={backgroundBlur.toggleSkinSmoothing}
          />
        </div>
      </div>
      )}
    </main>
  );
}
