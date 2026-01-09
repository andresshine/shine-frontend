/**
 * useMediaDevices Hook
 * Manages enumeration and selection of audio/video input devices
 */

import { useState, useEffect, useCallback } from "react";

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface UseMediaDevicesResult {
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedAudioDevice: string | null;
  selectedVideoDevice: string | null;
  selectAudioDevice: (deviceId: string) => void;
  selectVideoDevice: (deviceId: string) => void;
  refreshDevices: () => Promise<void>;
  hasPermissions: boolean;
}

export function useMediaDevices(): UseMediaDevicesResult {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | null>(null);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);

  /**
   * Enumerate all available media devices
   */
  const enumerateDevices = useCallback(async () => {
    try {
      // Request permissions first to get device labels
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

      // IMPORTANT: Immediately stop all tracks to release the camera
      // This allows Chrome to enumerate ALL available cameras, not just the one in use
      permissionStream.getTracks().forEach(track => track.stop());

      setHasPermissions(true);

      const devices = await navigator.mediaDevices.enumerateDevices();

      // Filter out "default" devices to avoid duplicates
      // Browsers report both "default" and the actual device separately
      const audioInputs = devices
        .filter((device) => device.kind === "audioinput" && device.deviceId !== "default")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
        }));

      const videoInputs = devices
        .filter((device) => device.kind === "videoinput" && device.deviceId !== "default")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
        }));

      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);

      // Auto-select first device if none selected
      if (!selectedAudioDevice && audioInputs.length > 0) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
      if (!selectedVideoDevice && videoInputs.length > 0) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
    } catch (error) {
      console.error("Error enumerating devices:", error);
      setHasPermissions(false);
    }
  }, [selectedAudioDevice, selectedVideoDevice]);

  /**
   * Refresh device list
   */
  const refreshDevices = useCallback(async () => {
    await enumerateDevices();
  }, [enumerateDevices]);

  /**
   * Select audio input device
   */
  const selectAudioDevice = useCallback((deviceId: string) => {
    setSelectedAudioDevice(deviceId);
  }, []);

  /**
   * Select video input device
   */
  const selectVideoDevice = useCallback((deviceId: string) => {
    setSelectedVideoDevice(deviceId);
  }, []);

  // Enumerate devices on mount
  useEffect(() => {
    enumerateDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [enumerateDevices]);

  return {
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    selectAudioDevice,
    selectVideoDevice,
    refreshDevices,
    hasPermissions,
  };
}
