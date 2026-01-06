"use client";

/**
 * MainContent Component
 * Main content area with progress, question, video, and controls
 */

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
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

  // State to track actual video resolution and show guidance
  const [actualVideoResolution, setActualVideoResolution] = useState<{ width: number; height: number } | null>(null);
  const [showResolutionGuidance, setShowResolutionGuidance] = useState(false);

  // Initialize camera on mount and when devices change
  useEffect(() => {
    async function initCamera() {
      // Skip if currently recording (recording stream handles camera)
      if (videoRecorder.state.isRecording) {
        return;
      }

      let stream: MediaStream | null = null; // Declare outside try block so catch can access it

      try {
        // Stop existing stream if any
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

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

        // Attempt 1: Try 1080p exact resolution for preview
        const constraints1080p: MediaStreamConstraints = {
          video: mediaDevices.selectedVideoDevice
            ? {
                deviceId: { exact: mediaDevices.selectedVideoDevice },
                width: { exact: 1920 }, // Force 1080p width
                height: { exact: 1080 }, // Force 1080p height
                aspectRatio: { exact: 16 / 9 }, // Force 16:9 aspect ratio
              }
            : {
                width: { exact: 1920 }, // Force 1080p width
                height: { exact: 1080 }, // Force 1080p height
                aspectRatio: { exact: 16 / 9 }, // Force 16:9 aspect ratio
                facingMode: "user",
              },
          audio: audioConstraints,
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints1080p);
          console.log("🎥 Successfully obtained 1080p exact stream for preview.");
        } catch (error) {
          if (error instanceof OverconstrainedError) {
            console.warn("🎥 Failed to get 1080p exact stream for preview, attempting 720p exact as fallback:", error);
            // Attempt 2: Fallback to 720p exact resolution for preview
            const constraints720p: MediaStreamConstraints = {
              video: mediaDevices.selectedVideoDevice
                ? {
                    deviceId: { exact: mediaDevices.selectedVideoDevice },
                    width: { exact: 1280 }, // Force 720p width
                    height: { exact: 720 }, // Force 720p height
                    aspectRatio: { exact: 16 / 9 }, // Force 16:9 aspect ratio
                  }
                : {
                    width: { exact: 1280 }, // Force 720p width
                    height: { exact: 720 }, // Force 720p height
                    aspectRatio: { exact: 16 / 9 }, // Force 16:9 aspect ratio
                    facingMode: "user",
                  },
              audio: audioConstraints,
            };
            stream = await navigator.mediaDevices.getUserMedia(constraints720p);
            console.log("🎥 Successfully obtained 720p exact stream for preview as fallback.");
          } else {
            // Not an OverconstrainedError, re-throw to be caught by the outer catch
            throw error;
          }
        }

        // If we reached here, a stream was successfully obtained (either 1080p or 720p)
        streamRef.current = stream;

        // Log stream info, actual resolution obtained for preview, and applied constraints
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const appliedConstraints = videoTrack.getConstraints();

        // Task 3: Disable Chrome's Internal Downscaling
        if (videoTrack.contentHint !== undefined) {
          videoTrack.contentHint = 'detail';
          console.log('🎥 Preview contentHint set to "detail".');
        }

        console.log(`🎥 Preview: ${videoTrack.label} - ${settings.width}x${settings.height}`);
        console.log('🎥 Preview Applied Constraints:', appliedConstraints);

        // Update state with actual resolution
        setActualVideoResolution({ width: settings.width || 0, height: settings.height || 0 });

        // Show guidance if resolution is significantly lower than 720p (e.g., 640x480)
        // This check will now primarily catch cases where even 720p exact failed or was not supported.
        if (settings.height && settings.height < 720) {
          setShowResolutionGuidance(true);
        } else {
          setShowResolutionGuidance(false);
        }

      } catch (error) {
        console.error("Error accessing camera for preview:", error);
        // Also reset resolution and hide guidance on error
        setActualVideoResolution(null);
        setShowResolutionGuidance(false);
        // Stop all tracks if an error occurred after stream was obtained but before setState
        if (stream) { // Use the local 'stream' variable here
          stream.getTracks().forEach((track) => track.stop());
        }
        streamRef.current = null; // Ensure streamRef is cleared on error
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

      {/* Resolution Guidance Banner */}
      {showResolutionGuidance && actualVideoResolution && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 mx-4 md:mx-8 mb-4 rounded-md" role="alert">
          <p className="font-bold">Low Resolution Detected ({actualVideoResolution.width}x{actualVideoResolution.height})</p>
          <p className="text-sm mt-1">
            Your camera is currently providing a lower resolution than ideal. For best quality, please try:
          </p>
          <ul className="list-disc list-inside text-sm mt-2">
            <li>Switching to a different camera if available (use the camera icon below).</li>
            <li>Using a different web browser (e.g., Safari often provides higher resolutions on macOS).</li>
            <li>Checking your operating system's camera privacy or settings.</li>
          </ul>
          <button
            onClick={() => setShowResolutionGuidance(false)}
            className="mt-3 text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Question Display Area */}
      <QuestionDisplay />

      {/* Real-time Feedback Area - Shown below question during recording */}
      {videoRecorder.state.isRecording && (
        <div className="px-4 md:px-8 pb-4 -mt-2">
          <div className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            {/* Feedback message */}
            {answerEvaluation.evaluation?.isComplete ? (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Great answer! You can stop recording when ready.
              </p>
            ) : answerEvaluation.evaluation?.followUp ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                💡 {answerEvaluation.evaluation.followUp}
              </p>
            ) : answerEvaluation.transcript.length > 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Keep going...
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Start speaking to answer the question
              </p>
            )}

            {/* Transcript preview (optional, can be hidden) */}
            {answerEvaluation.transcript && (
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 line-clamp-2 italic">
                &quot;{answerEvaluation.transcript.slice(-150)}...&quot;
              </p>
            )}
          </div>
        </div>
      )}

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
