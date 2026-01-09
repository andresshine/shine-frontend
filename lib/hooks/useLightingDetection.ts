/**
 * useLightingDetection Hook
 * Samples video stream to detect low-light conditions
 * Uses 1x1 canvas sampling to calculate average luminance
 */

import { useState, useEffect, useRef } from "react";

interface UseLightingDetectionResult {
  isLowLight: boolean;
  luminance: number; // 0-255 for debugging
}

// Threshold below which we consider "low light" (0-255 scale)
const LOW_LIGHT_THRESHOLD = 50;

// How often to sample the video (ms)
const SAMPLE_INTERVAL = 1000;

export function useLightingDetection(
  videoStream: MediaStream | null
): UseLightingDetectionResult {
  const [isLowLight, setIsLowLight] = useState(false);
  const [luminance, setLuminance] = useState(128); // Default to mid-range

  // Refs for sampling canvas and video element
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!videoStream) {
      setIsLowLight(false);
      setLuminance(128);
      return;
    }

    // Create hidden video element to receive the stream
    const video = document.createElement("video");
    video.srcObject = videoStream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    videoRef.current = video;

    // Create 1x1 canvas for sampling
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Wait for video to be ready
    video.onloadedmetadata = () => {
      video.play();

      // Start sampling interval
      intervalRef.current = setInterval(() => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        // Draw current frame scaled down to 1x1 pixel (average color)
        ctx.drawImage(videoRef.current, 0, 0, 1, 1);

        // Get the pixel data
        const imageData = ctx.getImageData(0, 0, 1, 1);
        const [r, g, b] = imageData.data;

        // Calculate luminance using standard formula (perceived brightness)
        // Y = 0.299*R + 0.587*G + 0.114*B
        const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

        setLuminance(luma);
        setIsLowLight(luma < LOW_LIGHT_THRESHOLD);
      }, SAMPLE_INTERVAL);
    };

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }
      canvasRef.current = null;
    };
  }, [videoStream]);

  return { isLowLight, luminance };
}
