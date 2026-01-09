/**
 * useCameraHealth Hook
 *
 * Monitors camera/microphone connection health and provides
 * graceful recovery options when devices disconnect.
 *
 * @author Shine Studio
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { announce } from "@/lib/utils/accessibility";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Interval for health checks (ms) */
const HEALTH_CHECK_INTERVAL_MS = 2000;

/** Timeout before considering device as disconnected (ms) */
const DISCONNECT_TIMEOUT_MS = 5000;

/** Maximum reconnection attempts */
const MAX_RECONNECT_ATTEMPTS = 3;

// =============================================================================
// TYPES
// =============================================================================

export type DeviceStatus = "connected" | "disconnected" | "reconnecting" | "error";

export interface DeviceHealth {
  camera: DeviceStatus;
  microphone: DeviceStatus;
}

export interface UseCameraHealthResult {
  /** Current health status of devices */
  health: DeviceHealth;
  /** Whether any device is disconnected */
  hasIssue: boolean;
  /** Error message if any */
  error: string | null;
  /** Attempt to reconnect devices */
  reconnect: () => Promise<boolean>;
  /** Whether reconnection is in progress */
  isReconnecting: boolean;
  /** Number of reconnection attempts made */
  reconnectAttempts: number;
}

// =============================================================================
// HOOK
// =============================================================================

export function useCameraHealth(
  stream: MediaStream | null,
  onReconnect?: () => Promise<MediaStream | null>
): UseCameraHealthResult {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [health, setHealth] = useState<DeviceHealth>({
    camera: "connected",
    microphone: "connected",
  });
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  const streamRef = useRef(stream);
  const lastVideoFrameTimeRef = useRef<number>(Date.now());
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep stream ref updated
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  /**
   * Check if video track is producing frames
   */
  const checkVideoHealth = useCallback((): DeviceStatus => {
    if (!streamRef.current) return "disconnected";

    const videoTracks = streamRef.current.getVideoTracks();
    if (videoTracks.length === 0) return "disconnected";

    const videoTrack = videoTracks[0];

    // Check track state
    if (videoTrack.readyState === "ended") return "disconnected";
    if (!videoTrack.enabled) return "disconnected";
    if (videoTrack.muted) return "disconnected";

    return "connected";
  }, []);

  /**
   * Check if audio track is active
   */
  const checkAudioHealth = useCallback((): DeviceStatus => {
    if (!streamRef.current) return "disconnected";

    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return "disconnected";

    const audioTrack = audioTracks[0];

    // Check track state
    if (audioTrack.readyState === "ended") return "disconnected";
    if (!audioTrack.enabled) return "disconnected";

    return "connected";
  }, []);

  /**
   * Attempt to reconnect devices
   */
  const reconnect = useCallback(async (): Promise<boolean> => {
    if (!onReconnect || isReconnecting) return false;

    setIsReconnecting(true);
    setReconnectAttempts((prev) => prev + 1);
    announce("Attempting to reconnect camera and microphone", "polite");

    try {
      setHealth({
        camera: "reconnecting",
        microphone: "reconnecting",
      });

      const newStream = await onReconnect();

      if (newStream) {
        setHealth({
          camera: "connected",
          microphone: "connected",
        });
        setError(null);
        setReconnectAttempts(0);
        announce("Camera and microphone reconnected successfully", "polite");
        return true;
      } else {
        throw new Error("Failed to get new stream");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reconnection failed";
      setError(message);
      setHealth({
        camera: "error",
        microphone: "error",
      });
      announce(`Failed to reconnect: ${message}`, "assertive");
      return false;
    } finally {
      setIsReconnecting(false);
    }
  }, [onReconnect, isReconnecting]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  /**
   * Monitor device health
   */
  useEffect(() => {
    if (!stream) {
      setHealth({
        camera: "disconnected",
        microphone: "disconnected",
      });
      return;
    }

    // Set up track event listeners
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    const handleTrackEnded = (trackType: "camera" | "microphone") => {
      setHealth((prev) => ({
        ...prev,
        [trackType]: "disconnected",
      }));

      const message =
        trackType === "camera"
          ? "Camera disconnected. Please check your camera connection."
          : "Microphone disconnected. Please check your microphone connection.";

      setError(message);
      announce(message, "assertive");
    };

    const handleTrackMuted = (trackType: "camera" | "microphone") => {
      setHealth((prev) => ({
        ...prev,
        [trackType]: "disconnected",
      }));
    };

    const handleTrackUnmuted = (trackType: "camera" | "microphone") => {
      setHealth((prev) => ({
        ...prev,
        [trackType]: "connected",
      }));
    };

    // Add listeners to video tracks
    videoTracks.forEach((track) => {
      track.addEventListener("ended", () => handleTrackEnded("camera"));
      track.addEventListener("mute", () => handleTrackMuted("camera"));
      track.addEventListener("unmute", () => handleTrackUnmuted("camera"));
    });

    // Add listeners to audio tracks
    audioTracks.forEach((track) => {
      track.addEventListener("ended", () => handleTrackEnded("microphone"));
      track.addEventListener("mute", () => handleTrackMuted("microphone"));
      track.addEventListener("unmute", () => handleTrackUnmuted("microphone"));
    });

    // Periodic health check
    healthCheckIntervalRef.current = setInterval(() => {
      const cameraHealth = checkVideoHealth();
      const micHealth = checkAudioHealth();

      setHealth((prev) => {
        // Only update if changed
        if (prev.camera !== cameraHealth || prev.microphone !== micHealth) {
          return {
            camera: cameraHealth,
            microphone: micHealth,
          };
        }
        return prev;
      });
    }, HEALTH_CHECK_INTERVAL_MS);

    // Initial check
    setHealth({
      camera: checkVideoHealth(),
      microphone: checkAudioHealth(),
    });

    // Cleanup
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }

      videoTracks.forEach((track) => {
        track.removeEventListener("ended", () => handleTrackEnded("camera"));
        track.removeEventListener("mute", () => handleTrackMuted("camera"));
        track.removeEventListener("unmute", () => handleTrackUnmuted("camera"));
      });

      audioTracks.forEach((track) => {
        track.removeEventListener("ended", () => handleTrackEnded("microphone"));
        track.removeEventListener("mute", () => handleTrackMuted("microphone"));
        track.removeEventListener("unmute", () => handleTrackUnmuted("microphone"));
      });
    };
  }, [stream, checkVideoHealth, checkAudioHealth]);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------

  const hasIssue =
    health.camera !== "connected" || health.microphone !== "connected";

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    health,
    hasIssue,
    error,
    reconnect,
    isReconnecting,
    reconnectAttempts,
  };
}
