"use client";

/**
 * MainContent Component
 * Main content area with progress, question, video, and controls
 */

import { useEffect, useRef } from "react";
import { ProgressBar } from "./ProgressBar";
import { QuestionDisplay } from "./QuestionDisplay";
import { VideoContainer } from "./VideoContainer";
import { RecordingControls } from "./RecordingControls";
import { useVideoRecorder } from "@/lib/hooks/useVideoRecorder";
import { useMediaDevices } from "@/lib/hooks/useMediaDevices";
import { useInterview } from "@/lib/hooks/useInterview";
import { useAnswerEvaluation } from "@/lib/hooks/useAnswerEvaluation";

export function MainContent() {
  const videoRecorder = useVideoRecorder();
  const mediaDevices = useMediaDevices();
  const interview = useInterview();
  const answerEvaluation = useAnswerEvaluation();
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera on mount and when devices change
  useEffect(() => {
    async function initCamera() {
      // Skip if currently recording (recording stream handles camera)
      if (videoRecorder.state.isRecording) {
        return;
      }

      try {
        // Stop existing stream if any
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Simple, reliable constraints matching recording
        const constraints: MediaStreamConstraints = {
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
          audio: mediaDevices.selectedAudioDevice
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
              },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        console.log(`🎥 Preview: ${videoTrack.label} - ${settings.width}x${settings.height}`);
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    }

    // Only initialize if we have permissions
    if (mediaDevices.hasPermissions) {
      initCamera();
    }

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaDevices.selectedAudioDevice, mediaDevices.selectedVideoDevice, mediaDevices.hasPermissions, videoRecorder.state.isRecording]);

  return (
    <main
      className="w-full md:w-2/3 flex flex-col"
      role="main"
    >
      {/* Top Progress Bar */}
      <ProgressBar />

      {/* Question Display Area */}
      <QuestionDisplay />

      {/* Video and Controls Container */}
      <div className="px-4 md:px-8 pb-4 md:pb-8 flex-1 flex flex-col min-h-0">
        {/* Video Container - flex to allow shrinking */}
        <div className="flex-1 min-h-0 flex flex-col">
          <VideoContainer
            stream={videoRecorder.state.recordingStream || streamRef.current}
            previewUrl={videoRecorder.state.previewUrl}
            isRecording={videoRecorder.state.isRecording}
          />
        </div>

        {/* Recording Controls with Evaluation */}
        <RecordingControls
          videoRecorder={videoRecorder}
          mediaDevices={mediaDevices}
          answerEvaluation={answerEvaluation}
          previewStream={streamRef.current}
        />
      </div>
    </main>
  );
}
