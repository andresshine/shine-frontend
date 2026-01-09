"use client";

/**
 * RecordingControls Component
 *
 * Controls for video recording with real-time speech evaluation, device selection,
 * and appearance settings. Provides a polished recording experience with cinematic
 * countdown and progress feedback.
 *
 * Features:
 * - Recording start/stop with cinematic countdown
 * - Real-time answer evaluation during recording
 * - Device selection (camera, microphone)
 * - Appearance settings (theme, rim light, skin smoothing)
 * - Questions list toggle
 * - Brand customization panel access
 * - Redo previous question functionality
 *
 * @author Shine Studio
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Mic,
  Video,
  RotateCcw,
  Check,
  Settings,
  Sun,
  Moon,
  Palette,
  ListChecks,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useInterview } from "@/lib/hooks/useInterview";
import { UseVideoRecorderResult } from "@/lib/hooks/useVideoRecorder";
import { UseMediaDevicesResult } from "@/lib/hooks/useMediaDevices";
import { UseAnswerEvaluationResult } from "@/lib/hooks/useAnswerEvaluation";
import { createRecordingEntry } from "@/lib/api/client";
import { useBrandButton } from "@/lib/utils/brandButton";
import { useTheme } from "@/components/providers/ThemeProvider";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Minimum recording duration before allowing stop (seconds) */
const MIN_RECORDING_DURATION_SEC = 30;

/** Delay before starting Mux polling (ms) */
const MUX_POLL_INITIAL_DELAY_MS = 5000;

/** Animation duration for dropdown transitions (ms) */
const DROPDOWN_ANIMATION_MS = 200;

/** Interval between Mux poll attempts (ms) */
const MUX_POLL_INTERVAL_MS = 6000;

/** Maximum Mux polling attempts */
const MUX_POLL_MAX_ATTEMPTS = 20;

// =============================================================================
// TYPES
// =============================================================================

interface RecordingControlsProps {
  /** Video recorder hook instance */
  videoRecorder: UseVideoRecorderResult;
  /** Media devices hook instance */
  mediaDevices: UseMediaDevicesResult;
  /** Answer evaluation hook instance */
  answerEvaluation: UseAnswerEvaluationResult;
  /** Processed video stream for recording */
  previewStream: MediaStream | null;
  /** Callback to toggle brand panel */
  onBrandPanelToggle?: () => void;
  /** Callback to toggle questions sidebar */
  onQuestionsToggle?: () => void;
  /** Whether questions sidebar is expanded */
  isQuestionsExpanded?: boolean;
  /** Whether rim light effect is enabled */
  isRimLightEnabled?: boolean;
  /** Callback to toggle rim light */
  onToggleRimLight?: () => void;
  /** Callback to start countdown before recording */
  onStartCountdown?: (onComplete: () => void) => void;
  /** Whether countdown is in progress */
  isCountingDown?: boolean;
  /** Whether skin smoothing is enabled */
  isSkinSmoothingEnabled?: boolean;
  /** Callback to toggle skin smoothing */
  onToggleSkinSmoothing?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RecordingControls({
  videoRecorder,
  mediaDevices,
  answerEvaluation,
  previewStream,
  onBrandPanelToggle,
  onQuestionsToggle,
  isQuestionsExpanded,
  isRimLightEnabled,
  onToggleRimLight,
  onStartCountdown,
  isCountingDown,
  isSkinSmoothingEnabled,
  onToggleSkinSmoothing,
}: RecordingControlsProps) {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------

  const interview = useInterview();
  const { state: interviewState, redoQuestion, approveAnswer } = interview;
  const {
    currentQuestionIndex,
    canRedoPrevious,
    session,
    evaluationStatus,
    hasConsent,
  } = interviewState;
  const brandButton = useBrandButton();
  const { theme, toggleTheme } = useTheme();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** Whether settings dropdown is visible */
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  /** Whether dropdown should be rendered (for exit animation) */
  const [isDropdownMounted, setIsDropdownMounted] = useState(false);

  /** Timestamp when recording started (for duration tracking) */
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);

  /** Elapsed recording time in seconds (for progress ring) */
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------

  const canRedo = currentQuestionIndex > 0 && canRedoPrevious;
  const isRecording = videoRecorder.state.isRecording;
  const isUploading = videoRecorder.state.isUploading;
  const canStopRecording = answerEvaluation.evaluation?.isComplete || false;

  /** Progress toward being able to stop (0-1) */
  const recordingProgress = Math.min(elapsedTime / MIN_RECORDING_DURATION_SEC, 1);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  /** Get primary button styling from brand settings */
  const getButtonBackground = useCallback(() => {
    return brandButton.getPrimaryStyle();
  }, [brandButton]);

  /**
   * Start recording immediately (called after countdown completes)
   * Initializes video recording and speech evaluation
   */
  const startRecordingNow = useCallback(async () => {
    setRecordingStartTime(Date.now());
    const currentQuestion = session.questions[currentQuestionIndex];

    console.log("🎬 Starting recording with real-time evaluation");

    // Start video recording with processed stream (includes blur/effects)
    await videoRecorder.startRecording(
      mediaDevices.selectedAudioDevice || undefined,
      mediaDevices.selectedVideoDevice || undefined,
      previewStream
    );

    // Start speech recognition for answer evaluation
    answerEvaluation.startListening(
      currentQuestion.text,
      currentQuestion.intent || undefined
    );

    // Update interview state
    interview.startRecording();
  }, [
    session.questions,
    currentQuestionIndex,
    videoRecorder,
    mediaDevices.selectedAudioDevice,
    mediaDevices.selectedVideoDevice,
    previewStream,
    answerEvaluation,
    interview,
  ]);

  /**
   * Poll Mux for upload processing status (runs in background)
   * Updates recording in database when video is ready
   */
  const pollMuxUploadBackground = useCallback(
    async (uploadId: string, recordingId: string) => {
      console.log("📤 Starting background poll for Mux upload:", uploadId);

      let attempts = 0;

      const poll = async () => {
        try {
          const response = await fetch("/api/mux/poll-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uploadId, recordingId }),
          });

          const data = await response.json();

          if (data.status === "ready") {
            console.log("✅ Video processed successfully:", uploadId);
            if (data.transcriptionError) {
              console.warn("⚠️ Transcription failed:", data.transcriptionError);
            } else {
              console.log("✅ Transcription completed");
            }
            return; // Done - video ready in database
          } else if (data.status === "error") {
            console.error("❌ Video processing failed:", uploadId);
            return; // Done - error recorded
          } else if (attempts < MUX_POLL_MAX_ATTEMPTS) {
            attempts++;
            setTimeout(poll, MUX_POLL_INTERVAL_MS);
          } else {
            console.log("⏱️ Stopped polling after max attempts:", uploadId);
          }
        } catch (error) {
          console.error("Error polling Mux:", error);
        }
      };

      // Start polling after initial delay
      setTimeout(poll, MUX_POLL_INITIAL_DELAY_MS);
    },
    []
  );

  /**
   * Handle recording start/stop toggle
   * Manages evaluation, upload, and question advancement
   */
  const handleRecordingToggle = useCallback(async () => {
    if (isRecording) {
      // Calculate recording duration
      const recordingDuration = (Date.now() - recordingStartTime) / 1000;

      // Prevent stopping if answer incomplete and recording is short
      if (
        !canStopRecording &&
        recordingDuration < MIN_RECORDING_DURATION_SEC
      ) {
        console.log("⏳ Answer not yet complete, keep recording");
        return;
      }

      // Stop evaluation listening
      answerEvaluation.stopListening();

      // Stop recording and get video blob
      const blob = await videoRecorder.stopRecording();

      if (blob) {
        const currentQuestion = session.questions[currentQuestionIndex];
        const confidence = answerEvaluation.evaluation?.confidence || 75;

        // Clear preview immediately for next question
        videoRecorder.clearPreview();

        // Advance to next question (non-blocking)
        approveAnswer(confidence);

        // Upload in background
        const uploadId = await videoRecorder.uploadRecording(blob);

        if (uploadId) {
          // Create recording entry in database
          const recordingId = await createRecordingEntry(
            session.session_id,
            currentQuestion.id,
            currentQuestionIndex
          );

          // Start background polling for Mux processing
          if (recordingId) {
            pollMuxUploadBackground(uploadId, recordingId);
          }
        }
      }

      // Reset evaluation for next question
      answerEvaluation.resetEvaluation();
    } else {
      // Starting recording - use countdown if available
      if (onStartCountdown) {
        onStartCountdown(startRecordingNow);
      } else {
        await startRecordingNow();
      }
    }
  }, [
    isRecording,
    recordingStartTime,
    canStopRecording,
    answerEvaluation,
    videoRecorder,
    session.questions,
    session.session_id,
    currentQuestionIndex,
    approveAnswer,
    pollMuxUploadBackground,
    onStartCountdown,
    startRecordingNow,
  ]);

  /** Start over on current question - discard recording and restart */
  const startOver = useCallback(async () => {
    if (!isRecording) return;

    // Stop evaluation listening
    answerEvaluation.stopListening();

    // Stop recording but discard the result (don't upload)
    await videoRecorder.stopRecording();

    // Clear any preview
    videoRecorder.clearPreview();

    // Reset evaluation for fresh start
    answerEvaluation.resetEvaluation();

    // Reset elapsed time
    setElapsedTime(0);
    setRecordingStartTime(0);

    // Automatically start countdown and begin recording again
    if (onStartCountdown) {
      onStartCountdown(startRecordingNow);
    } else {
      startRecordingNow();
    }
  }, [isRecording, answerEvaluation, videoRecorder, onStartCountdown, startRecordingNow]);

  /** Close settings dropdown with exit animation */
  const closeSettings = useCallback(() => {
    setShowSettingsDropdown(false);
    // Wait for animation to complete before unmounting
    setTimeout(() => {
      setIsDropdownMounted(false);
    }, DROPDOWN_ANIMATION_MS);
  }, []);

  /** Open settings dropdown with enter animation */
  const openSettings = useCallback(() => {
    setIsDropdownMounted(true);
    // Small delay to ensure mount happens before animation starts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShowSettingsDropdown(true);
      });
    });
  }, []);

  /** Toggle settings dropdown */
  const toggleSettings = useCallback(() => {
    if (showSettingsDropdown) {
      closeSettings();
    } else {
      openSettings();
    }
  }, [showSettingsDropdown, closeSettings, openSettings]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /** Track elapsed recording time for progress ring */
  useEffect(() => {
    if (isRecording && !canStopRecording) {
      // Start tracking elapsed time
      setElapsedTime(0);
      elapsedTimerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 0.1);
      }, 100);
    } else {
      // Stop tracking
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      if (!isRecording) {
        setElapsedTime(0);
      }
    }

    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, [isRecording, canStopRecording]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="recording-controls flex flex-col gap-3">
      {/* ================================================================= */}
      {/* CONTROLS ROW - Compact layout with centered primary action       */}
      {/* ================================================================= */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-3 items-center justify-center">
        {/* =============================================================== */}
        {/* LEFT SIDE - Settings & Questions Toggle                        */}
        {/* =============================================================== */}
        <div className="relative order-3 md:order-1 w-full md:w-auto">
          <div className="flex items-center gap-2">
            {/* Questions Toggle Button */}
            {onQuestionsToggle && (
              <button
                onClick={onQuestionsToggle}
                className={`flex-1 md:flex-none flex items-center justify-center
                           min-w-[44px] min-h-[44px] p-3
                           rounded-[var(--brand-radius)] border transition-colors ${
                             isQuestionsExpanded
                               ? ""
                               : "bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark hover:border-border-light-strong dark:hover:border-border-dark-hover text-foreground-light-secondary dark:text-foreground-dark-secondary"
                           }`}
                style={
                  isQuestionsExpanded
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                        borderColor:
                          "color-mix(in srgb, var(--brand-primary) 30%, transparent)",
                        color: "var(--brand-primary)",
                      }
                    : undefined
                }
                aria-label="Toggle questions list"
              >
                <ListChecks className="w-5 h-5" />
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={toggleSettings}
              className="flex-1 md:flex-none flex items-center justify-center
                         min-w-[44px] min-h-[44px] p-3
                         rounded-[var(--brand-radius)] bg-card-light dark:bg-card-dark
                         border border-border-light dark:border-border-dark
                         hover:border-border-light-strong dark:hover:border-border-dark-hover
                         text-foreground-light-secondary dark:text-foreground-dark-secondary
                         transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* ============================================================= */}
          {/* SETTINGS DROPDOWN                                             */}
          {/* ============================================================= */}
          {isDropdownMounted && (
            <>
              {/* Backdrop for outside clicks */}
              <div
                className="fixed inset-0 z-[40]"
                onClick={closeSettings}
                aria-hidden="true"
                style={{
                  opacity: showSettingsDropdown ? 1 : 0,
                  transition: `opacity ${DROPDOWN_ANIMATION_MS}ms ease-out`,
                  backgroundColor: "transparent",
                }}
              />

              {/* Dropdown Panel */}
              <div
                className="absolute bottom-full right-0 mb-2 w-full md:w-auto md:min-w-[280px]
                           rounded-[var(--brand-radius)] p-2 z-[50]"
                style={{
                  background: "var(--settings-bg, #FFFFFF)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow:
                    "0 8px 32px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(143, 132, 194, 0.15)",
                  opacity: showSettingsDropdown ? 1 : 0,
                  transform: showSettingsDropdown
                    ? "translateY(0) scale(1)"
                    : "translateY(8px) scale(0.95)",
                  transformOrigin: "bottom center",
                  transition: `opacity ${DROPDOWN_ANIMATION_MS}ms ease-out, transform ${DROPDOWN_ANIMATION_MS}ms ease-out`,
                }}
              >
                <style>{`
                  .dark { --settings-bg: #0A0A0C; }
                  .light { --settings-bg: #FFFFFF; }
                `}</style>

                {/* ----------------------------------------------------- */}
                {/* MICROPHONE SELECTION                                  */}
                {/* ----------------------------------------------------- */}
                {mediaDevices.audioDevices.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold tracking-wide text-foreground-light-muted dark:text-foreground-dark-faint px-3 py-2 uppercase">
                      Microphone
                    </div>
                    {mediaDevices.audioDevices.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() => {
                          mediaDevices.selectAudioDevice(device.deviceId);
                          closeSettings();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                   hover:bg-background-light-subtle dark:hover:bg-[rgba(255,255,255,0.05)]
                                   text-left transition-colors"
                      >
                        <Mic className="w-4 h-4 text-foreground-light-muted dark:text-foreground-dark-subtle flex-shrink-0" />
                        <span className="flex-1 text-sm text-foreground-light dark:text-foreground-dark truncate">
                          {device.label ||
                            `Microphone ${device.deviceId.slice(0, 8)}`}
                        </span>
                        {device.deviceId === mediaDevices.selectedAudioDevice && (
                          <Check
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: "var(--brand-primary)" }}
                          />
                        )}
                      </button>
                    ))}
                  </>
                )}

                {/* ----------------------------------------------------- */}
                {/* CAMERA SELECTION                                      */}
                {/* ----------------------------------------------------- */}
                {mediaDevices.videoDevices.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold tracking-wide text-foreground-light-muted dark:text-foreground-dark-faint px-3 py-2 uppercase mt-2">
                      Camera
                    </div>
                    {mediaDevices.videoDevices.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() => {
                          mediaDevices.selectVideoDevice(device.deviceId);
                          closeSettings();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                   hover:bg-background-light-subtle dark:hover:bg-[rgba(255,255,255,0.05)]
                                   text-left transition-colors"
                      >
                        <Video className="w-4 h-4 text-foreground-light-muted dark:text-foreground-dark-subtle flex-shrink-0" />
                        <span className="flex-1 text-sm text-foreground-light dark:text-foreground-dark truncate">
                          {device.label ||
                            `Camera ${device.deviceId.slice(0, 8)}`}
                        </span>
                        {device.deviceId === mediaDevices.selectedVideoDevice && (
                          <Check
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: "var(--brand-primary)" }}
                          />
                        )}
                      </button>
                    ))}
                  </>
                )}

                {/* Divider */}
                <div className="my-2 border-t border-border-light dark:border-[rgba(255,255,255,0.06)]" />

                {/* ----------------------------------------------------- */}
                {/* APPEARANCE SETTINGS                                   */}
                {/* ----------------------------------------------------- */}

                {/* Theme Toggle */}
                <button
                  onClick={() => {
                    toggleTheme();
                    closeSettings();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                             hover:bg-background-light-subtle dark:hover:bg-[rgba(255,255,255,0.05)]
                             text-left transition-colors"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-foreground-light-muted dark:text-foreground-dark-subtle flex-shrink-0" />
                  ) : (
                    <Moon className="w-4 h-4 text-foreground-light-muted dark:text-foreground-dark-subtle flex-shrink-0" />
                  )}
                  <span className="flex-1 text-sm text-foreground-light dark:text-foreground-dark">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </button>

                {/* Rim Light Toggle (dark mode only) */}
                {onToggleRimLight && theme === "dark" && (
                  <button
                    onClick={() => {
                      onToggleRimLight();
                      closeSettings();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg
                               hover:bg-background-light-subtle dark:hover:bg-[rgba(255,255,255,0.05)]
                               text-left transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-foreground-light-muted dark:text-foreground-dark-subtle flex-shrink-0" />
                    <span className="flex-1 text-sm text-foreground-light dark:text-foreground-dark">
                      Rim Light
                    </span>
                    {isRimLightEnabled && (
                      <Check
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "var(--brand-primary)" }}
                      />
                    )}
                  </button>
                )}

                {/* Skin Smoothing / Touch Up Toggle */}
                {onToggleSkinSmoothing && (
                  <button
                    onClick={() => {
                      onToggleSkinSmoothing();
                      closeSettings();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg
                               hover:bg-background-light-subtle dark:hover:bg-[rgba(255,255,255,0.05)]
                               text-left transition-colors"
                  >
                    <Wand2 className="w-4 h-4 text-foreground-light-muted dark:text-foreground-dark-subtle flex-shrink-0" />
                    <span className="flex-1 text-sm text-foreground-light dark:text-foreground-dark">
                      Touch Up Appearance
                    </span>
                    {isSkinSmoothingEnabled && (
                      <Check
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "var(--brand-primary)" }}
                      />
                    )}
                  </button>
                )}

                {/* Brand Settings */}
                {onBrandPanelToggle && (
                  <button
                    onClick={() => {
                      onBrandPanelToggle();
                      closeSettings();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg
                               hover:bg-background-light-subtle dark:hover:bg-[rgba(255,255,255,0.05)]
                               text-left transition-colors"
                  >
                    <Palette className="w-4 h-4 text-foreground-light-muted dark:text-foreground-dark-subtle flex-shrink-0" />
                    <span className="flex-1 text-sm text-foreground-light dark:text-foreground-dark">
                      Brand Settings
                    </span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* =============================================================== */}
        {/* CENTER - Recording Button                                       */}
        {/* =============================================================== */}
        <button
          onClick={handleRecordingToggle}
          disabled={
            !hasConsent ||
            isUploading ||
            isCountingDown ||
            (isRecording &&
              !canStopRecording &&
              Date.now() - recordingStartTime < MIN_RECORDING_DURATION_SEC * 1000)
          }
          className="w-full md:w-auto order-1 md:order-2 flex items-center justify-center
                     gap-2 px-6 py-3 min-h-[44px]
                     rounded-[var(--brand-radius)] text-white font-semibold
                     transition-all duration-300 hover:scale-[1.02]
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: getButtonBackground(),
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 4px 16px rgba(143, 132, 194, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Recording State Indicator with Progress Ring */}
          {isUploading || isCountingDown ? (
            <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording && !canStopRecording ? (
            // Progress ring showing time until able to stop
            <div className="relative w-5 h-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
                {/* Background ring */}
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                />
                {/* Progress ring */}
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${recordingProgress * 62.83} 62.83`}
                  style={{ transition: "stroke-dasharray 0.1s ease-out" }}
                />
              </svg>
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-sm" />
              </div>
            </div>
          ) : (
            <div
              className={`w-2.5 h-2.5 bg-white ${
                isRecording ? "rounded-sm" : "rounded-full"
              }`}
            />
          )}

          {/* Button Text */}
          <span className="text-sm font-medium">
            {isUploading
              ? `Saving... ${videoRecorder.state.uploadProgress}%`
              : isCountingDown
                ? "Get Ready..."
                : isRecording
                  ? canStopRecording
                    ? "Submit Answer"
                    : `Keep going... ${Math.ceil(MIN_RECORDING_DURATION_SEC - elapsedTime)}s`
                  : evaluationStatus === "follow_up"
                    ? "Record Follow-Up"
                    : "Start Recording"}
          </span>
        </button>

        {/* =============================================================== */}
        {/* RIGHT SIDE - Redo/Start Over Button                            */}
        {/* =============================================================== */}
        <button
          onClick={isRecording ? startOver : redoQuestion}
          disabled={!isRecording && !canRedo}
          className="w-full md:w-auto order-2 md:order-3 flex items-center justify-center gap-2
                     px-5 py-3 min-h-[44px]
                     rounded-[var(--brand-radius)] bg-card-light dark:bg-card-dark
                     border border-border-light dark:border-border-dark
                     hover:border-border-light-strong dark:hover:border-border-dark-hover
                     text-foreground-light-secondary dark:text-foreground-dark-secondary
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={isRecording ? "Start over on current question" : "Re-do previous question"}
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isRecording ? "Start Over" : "Re-do Previous"}
          </span>
        </button>
      </div>
    </div>
  );
}
