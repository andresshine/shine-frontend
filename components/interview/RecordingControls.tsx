"use client";

/**
 * RecordingControls Component
 * Recording button, device controls, and real-time evaluation feedback
 */

import { useState } from "react";
import { Mic, Video, ChevronDown, RotateCcw, Check } from "lucide-react";
import { useInterview } from "@/lib/hooks/useInterview";
import { UseVideoRecorderResult } from "@/lib/hooks/useVideoRecorder";
import { UseMediaDevicesResult } from "@/lib/hooks/useMediaDevices";
import { UseAnswerEvaluationResult } from "@/lib/hooks/useAnswerEvaluation";
import { createRecordingEntry } from "@/lib/api/client";
import { useBrandButton } from "@/lib/utils/brandButton";

interface RecordingControlsProps {
  videoRecorder: UseVideoRecorderResult;
  mediaDevices: UseMediaDevicesResult;
  answerEvaluation: UseAnswerEvaluationResult;
  previewStream: MediaStream | null;
}

export function RecordingControls({ videoRecorder, mediaDevices, answerEvaluation, previewStream }: RecordingControlsProps) {
  const interview = useInterview();
  const { state: interviewState, redoQuestion, approveAnswer } = interview;
  const { currentQuestionIndex, canRedoPrevious, session, evaluationStatus, hasConsent } = interviewState;
  const brandButton = useBrandButton();
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [showVideoDropdown, setShowVideoDropdown] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);

  const canRedo = currentQuestionIndex > 0 && canRedoPrevious;
  const isRecording = videoRecorder.state.isRecording;
  const isUploading = videoRecorder.state.isUploading;

  // Determine if user can stop recording
  const canStopRecording = answerEvaluation.evaluation?.isComplete || false;

  // Get button background based on state
  const getButtonBackground = () => {
    if (isRecording) {
      return canStopRecording
        ? brandButton.getSecondaryStyle()  // Recording (can stop) - Secondary color
        : brandButton.getTertiaryStyle();  // Waiting (keep going) - Tertiary color
    } else {
      return brandButton.getPrimaryStyle();  // Idle - Primary color
    }
  };

  const handleRecordingToggle = async () => {
    if (isRecording) {
      // Only allow stopping if answer is complete (or override after long recording)
      const recordingDuration = (Date.now() - recordingStartTime) / 1000;

      if (!canStopRecording && recordingDuration < 30) {
        // Don't allow stopping yet - answer not complete and recording is short
        console.log('⏳ Answer not yet complete, keep recording');
        return;
      }

      // Stop evaluation listening
      answerEvaluation.stopListening();

      // Stop recording
      const blob = await videoRecorder.stopRecording();

      if (blob) {
        // Upload to Mux
        const currentQuestion = session.questions[currentQuestionIndex];

        // Use the real-time evaluation confidence, or default
        const confidence = answerEvaluation.evaluation?.confidence || 75;

        // Clear preview IMMEDIATELY so FaceGuide shows for next question
        videoRecorder.clearPreview();

        // Immediately advance to next question (non-blocking)
        approveAnswer(confidence);

        // Upload and polling happen in background
        const uploadId = await videoRecorder.uploadRecording(blob);

        if (uploadId) {
          // Save recording to database (don't pass uploadId as mux_asset_id - poll-upload will set real asset ID)
          const recordingId = await createRecordingEntry(
            session.session_id,
            currentQuestion.id,
            currentQuestionIndex
          );

          // Poll Mux for processing in background (no UI blocking)
          if (recordingId) {
            pollMuxUploadBackground(uploadId, recordingId);
          }
        }
      }

      // Reset evaluation for next question
      answerEvaluation.resetEvaluation();

    } else {
      // Start recording
      setRecordingStartTime(Date.now());
      const currentQuestion = session.questions[currentQuestionIndex];

      console.log('🎬 Starting recording with real-time evaluation');

      // Start video recording with the processed stream (includes background blur)
      await videoRecorder.startRecording(
        mediaDevices.selectedAudioDevice || undefined,
        mediaDevices.selectedVideoDevice || undefined,
        previewStream // Pass the processed stream for recording
      );

      // Start speech recognition for evaluation
      answerEvaluation.startListening(
        currentQuestion.text,
        currentQuestion.intent || undefined
      );

      // Update interview state
      interview.startRecording();
    }
  };

  // Poll Mux upload status in background (non-blocking)
  const pollMuxUploadBackground = async (uploadId: string, recordingId: string) => {
    console.log("📤 Starting background poll for Mux upload:", uploadId);

    const maxAttempts = 20;
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
            console.error("⚠️ Transcription failed:", data.transcriptionError);
          } else {
            console.log("✅ Transcription completed successfully");
          }
          return; // Done - video is ready in database
        } else if (data.status === "error") {
          console.error("❌ Video processing failed:", uploadId);
          return; // Done - error recorded in database
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 6000); // Poll again in 6 seconds
        } else {
          console.log("⏱️ Stopped polling after max attempts:", uploadId);
        }
      } catch (error) {
        console.error("Error polling Mux:", error);
      }
    };

    // Start polling after 5 seconds
    setTimeout(poll, 5000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Row */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center">
        {/* Device Controls */}
        <div className="relative order-3 md:order-1 w-full md:w-auto">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Microphone Selector */}
            <button
              onClick={() => {
                setShowAudioDropdown(!showAudioDropdown);
                setShowVideoDropdown(false);
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-4 md:px-5 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gold/30 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-white transition-colors"
              aria-label="Select microphone"
            >
              <Mic className="w-4 h-4 md:w-5 md:h-5" />
              <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Camera Selector */}
            <button
              onClick={() => {
                setShowVideoDropdown(!showVideoDropdown);
                setShowAudioDropdown(false);
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-4 md:px-5 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gold/30 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-white transition-colors"
              aria-label="Select camera"
            >
              <Video className="w-4 h-4 md:w-5 md:h-5" />
              <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Audio Device Dropdown */}
          {showAudioDropdown && mediaDevices.audioDevices.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-full md:w-auto md:min-w-[280px] bg-white dark:bg-gray-800 rounded-[var(--brand-radius)] shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-10">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
                Microphone
              </div>
              {mediaDevices.audioDevices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => {
                    mediaDevices.selectAudioDevice(device.deviceId);
                    setShowAudioDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  <Mic className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
                    {device.label}
                  </span>
                  {device.deviceId === mediaDevices.selectedAudioDevice && (
                    <Check className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Video Device Dropdown */}
          {showVideoDropdown && mediaDevices.videoDevices.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-full md:w-auto md:min-w-[280px] bg-white dark:bg-gray-800 rounded-[var(--brand-radius)] shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-10">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
                Camera
              </div>
              {mediaDevices.videoDevices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => {
                    mediaDevices.selectVideoDevice(device.deviceId);
                    setShowVideoDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
                    {device.label}
                  </span>
                  {device.deviceId === mediaDevices.selectedVideoDevice && (
                    <Check className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recording Button */}
        <button
          onClick={handleRecordingToggle}
          disabled={!hasConsent || isUploading || (isRecording && !canStopRecording && (Date.now() - recordingStartTime) < 30000)}
          className="w-full md:flex-1 order-1 md:order-2 flex items-center justify-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 rounded-[var(--brand-radius)] text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: getButtonBackground() }}
        >
          {/* Recording Indicator */}
          {isUploading ? (
            <div className="w-2.5 md:w-3 h-2.5 md:h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <div
              className={`w-2.5 md:w-3 h-2.5 md:h-3 bg-white ${
                isRecording ? "rounded-sm" : "rounded-full"
              }`}
            />
          )}

          {/* Button Text */}
          <span className="text-sm md:text-base font-medium">
            {isUploading
              ? `Uploading... ${videoRecorder.state.uploadProgress}%`
              : isRecording
              ? canStopRecording
                ? "Stop Recording"
                : "Keep going..."
              : evaluationStatus === 'follow_up'
              ? "Record Follow-Up"
              : "Start Recording"}
          </span>
        </button>

        {/* Mobile Redo Button */}
        <button
          onClick={redoQuestion}
          disabled={!canRedo}
          className="md:hidden w-full order-2 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gold/30 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Re-do previous question"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-medium">Re-do Question</span>
        </button>
      </div>
    </div>
  );
}
