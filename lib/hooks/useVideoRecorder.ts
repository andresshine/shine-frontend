/**
 * useVideoRecorder Hook
 * Handles webcam video recording with MediaRecorder and Mux upload
 */

import { useState, useRef, useCallback } from "react";
import { uploadVideoToMux, UploadProgress } from "@/lib/mux/uploader";

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isUploading: boolean;
  recordingDuration: number;
  uploadProgress: number;
  error: string | null;
  previewUrl: string | null;
  recordingStream: MediaStream | null;
}

export interface UseVideoRecorderResult {
  state: RecordingState;
  startRecording: (
    audioDeviceId?: string,
    videoDeviceId?: string
  ) => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  uploadRecording: (blob: Blob) => Promise<string | null>;
  clearPreview: () => void;
}

export function useVideoRecorder(): UseVideoRecorderResult {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    isUploading: false,
    recordingDuration: 0,
    uploadProgress: 0,
    error: null,
    previewUrl: null,
    recordingStream: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  /**
   * Start recording from webcam
   */
  const startRecording = useCallback(async (
    audioDeviceId?: string,
    videoDeviceId?: string
  ) => {
    let stream: MediaStream | null = null; // Initialize stream to null
    let obtainedResolution: '1080p' | '720p' = '1080p'; // Track actual resolution obtained

    try {
      const audioConstraints = audioDeviceId
        ? {
            deviceId: { exact: audioDeviceId },
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          }
        : {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          };

      // Attempt 1: Try 1080p exact resolution
      const constraints1080p: MediaStreamConstraints = {
        video: videoDeviceId
          ? {
              deviceId: { exact: videoDeviceId },
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
        console.log("📹 Successfully obtained 1080p exact stream for recording.");
      } catch (error) {
        if (error instanceof OverconstrainedError) {
          console.warn("📹 Failed to get 1080p exact stream, attempting 720p exact as fallback:", error);
          // Attempt 2: Fallback to 720p exact resolution
          const constraints720p: MediaStreamConstraints = {
            video: videoDeviceId
              ? {
                  deviceId: { exact: videoDeviceId },
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
          obtainedResolution = '720p';
          console.log("📹 Successfully obtained 720p exact stream for recording as fallback.");
        } else {
          // Not an OverconstrainedError, re-throw to be caught by the outer catch
          throw error;
        }
      }

      // If we reached here, a stream was successfully obtained (either 1080p or 720p)
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const videoSettings = videoTrack.getSettings();
      const videoAppliedConstraints = videoTrack.getConstraints();

      // Task 3: Disable Chrome's Internal Downscaling
      if (videoTrack.contentHint !== undefined) {
        videoTrack.contentHint = 'detail';
        console.log('📹 Video contentHint set to "detail".');
      }

      console.log(`📹 Camera: ${videoTrack.label} - ${videoSettings.width}x${videoSettings.height}`);
      console.log('📹 Camera Applied Constraints:', videoAppliedConstraints);


      // Determine best supported mime type
      let mimeType = "video/webm";
      const mimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=h264,opus",
        "video/webm",
      ];

      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log("🎬 Using mimeType:", type);
          break;
        }
      }

      // Shine Premium Bitrate Strategy: Dynamic bitrate based on resolution
      const videoBitsPerSecond = obtainedResolution === '1080p' ? 8_000_000 : 6_000_000;
      console.log(`🎬 Shine Premium: Using ${videoBitsPerSecond / 1_000_000} Mbps for ${obtainedResolution}`);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();

      // Start timer
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          recordingDuration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        error: null,
        recordingStream: stream,
      }));

    } catch (error) {
      console.error("Error starting recording:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to access camera/microphone. Please check permissions. " + (error as Error).message,
      }));
      // Stop all tracks if an error occurred after stream was obtained but before setState
      if (stream) { // Use the local 'stream' variable here
        stream.getTracks().forEach((track) => track.stop());
      }
      streamRef.current = null; // Ensure streamRef is cleared on error
    }
  }, []);

  /**
   * Stop recording and return the blob
   */
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      // Handle stop event
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        setState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          previewUrl: url,
          recordingStream: null,
        }));

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, []);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;

    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      setState((prev) => ({ ...prev, isPaused: true }));

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;

    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      setState((prev) => ({ ...prev, isPaused: false }));

      // Restart timer
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          recordingDuration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);
    }
  }, []);

  /**
   * Upload recording to Mux
   */
  const uploadRecording = useCallback(async (blob: Blob): Promise<string | null> => {
    setState((prev) => ({ ...prev, isUploading: true, uploadProgress: 0 }));

    try {
      const result = await uploadVideoToMux(blob, (progress: UploadProgress) => {
        setState((prev) => ({
          ...prev,
          uploadProgress: progress.percentage,
        }));
      });

      setState((prev) => ({ ...prev, isUploading: false }));

      if (result.success) {
        return result.assetId || null;
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || "Upload failed",
        }));
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: "Upload failed",
      }));
      return null;
    }
  }, []);

  /**
   * Clear preview URL
   */
  const clearPreview = useCallback(() => {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
    setState((prev) => ({
      ...prev,
      previewUrl: null,
      recordingDuration: 0,
      uploadProgress: 0,
      recordingStream: null,
    }));
  }, [state.previewUrl]);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    uploadRecording,
    clearPreview,
  };
}
