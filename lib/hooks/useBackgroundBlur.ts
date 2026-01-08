/**
 * useBackgroundBlur Hook
 * Real-time background blur using MediaPipe Selfie Segmentation
 * Processes webcam stream to blur background while keeping person sharp
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// Declare global type for MediaPipe
declare global {
  interface Window {
    SelfieSegmentation: any;
  }
}

/**
 * Load MediaPipe SelfieSegmentation via script tag
 * MediaPipe uses global exports (IIFE pattern), not ES modules
 */
async function loadSelfieSegmentation(): Promise<any> {
  // Check if already loaded
  if (window.SelfieSegmentation) {
    return window.SelfieSegmentation;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
    script.async = true;

    script.onload = () => {
      if (window.SelfieSegmentation) {
        console.log("✅ MediaPipe SelfieSegmentation loaded via script tag");
        resolve(window.SelfieSegmentation);
      } else {
        reject(new Error("SelfieSegmentation not found on window after script load"));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load MediaPipe SelfieSegmentation script"));
    };

    document.head.appendChild(script);
  });
}

export interface UseBackgroundBlurResult {
  processedStream: MediaStream | null;
  isBlurEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  toggleBlur: () => void;
  setBlurEnabled: (enabled: boolean) => void;
}

interface SelfieSegmentation {
  setOptions: (options: { modelSelection: number; selfieMode: boolean }) => void;
  onResults: (callback: (results: SegmentationResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
}

interface SegmentationResults {
  segmentationMask: CanvasImageSource; // Can be HTMLImageElement, HTMLCanvasElement, ImageBitmap, etc.
  image: CanvasImageSource;
}

/**
 * Convert hex color to rgba string
 * @param hex - Hex color string (e.g., "#8F84C2" or "8F84C2")
 * @param alpha - Opacity value between 0 and 1
 * @returns RGBA string (e.g., "rgba(143, 132, 194, 0.25)")
 */
function hexToRgba(hex: string, alpha: number): string {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Parse hex values
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);

  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Fallback for invalid hex
  return `rgba(0, 0, 0, ${alpha})`;
}

export function useBackgroundBlur(
  videoStream: MediaStream | null,
  blurAmount: number = 15,
  tintHex?: string
): UseBackgroundBlurResult {
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  const [isBlurEnabled, setIsBlurEnabled] = useState(true); // Enabled by default
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the tint RGBA string so we don't recalculate on every frame
  const tintRgba = useMemo(() => {
    if (!tintHex) {
      return "rgba(0, 0, 0, 0.75)"; // Fallback: black tint
    }
    return hexToRgba(tintHex, 0.75); // 75% opacity for branded glass effect
  }, [tintHex]);

  // Refs for MediaPipe and canvas
  const segmentationRef = useRef<SelfieSegmentation | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);
  const isBlurEnabledRef = useRef(isBlurEnabled);
  const tintRgbaRef = useRef(tintRgba);

  // Keep refs in sync with state/memoized values
  useEffect(() => {
    isBlurEnabledRef.current = isBlurEnabled;
  }, [isBlurEnabled]);

  useEffect(() => {
    tintRgbaRef.current = tintRgba;
  }, [tintRgba]);

  // Initialize MediaPipe and processing pipeline
  useEffect(() => {
    if (!videoStream) {
      setProcessedStream(null);
      return;
    }

    let mounted = true;
    let localCanvas: HTMLCanvasElement | null = null;
    let localVideo: HTMLVideoElement | null = null;

    const initializeBlur = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load MediaPipe via script tag (it uses global exports)
        const SelfieSegmentation = await loadSelfieSegmentation();

        if (!SelfieSegmentation) {
          throw new Error("Failed to load SelfieSegmentation from MediaPipe");
        }

        if (!mounted) return;

        // Get video dimensions from the stream
        const videoTrack = videoStream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const width = settings.width || 1920;
        const height = settings.height || 1080;

        console.log(`🎭 Initializing background blur: ${width}x${height}`);

        // Create hidden video element to receive the stream
        localVideo = document.createElement("video");
        localVideo.srcObject = videoStream;
        localVideo.autoplay = true;
        localVideo.playsInline = true;
        localVideo.muted = true;
        localVideo.width = width;
        localVideo.height = height;
        videoRef.current = localVideo;

        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          localVideo!.onloadedmetadata = () => {
            localVideo!.play().then(resolve);
          };
        });

        if (!mounted) return;

        // Create canvas for compositing
        localCanvas = document.createElement("canvas");
        localCanvas.width = width;
        localCanvas.height = height;
        canvasRef.current = localCanvas;

        const ctx = localCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          throw new Error("Failed to get canvas 2D context");
        }
        ctxRef.current = ctx;

        // Initialize MediaPipe Selfie Segmentation
        const segmentation = new SelfieSegmentation({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });

        segmentation.setOptions({
          modelSelection: 1, // 1 = landscape model (better for webcams)
          selfieMode: true,
        });

        // Set up results callback (using any to match MediaPipe's flexible result type)
        segmentation.onResults((results: any) => {
          if (!mounted || !ctxRef.current || !canvasRef.current) return;

          const ctx = ctxRef.current;
          const canvas = canvasRef.current;

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (isBlurEnabledRef.current) {
            // ===== BLUR ENABLED: Composite sharp person over tinted blurred background =====

            // Step 1: Draw the blurred background
            ctx.filter = `blur(${blurAmount}px)`;
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            ctx.filter = "none";

            // Step 2: Apply brand color tint over the blurred background
            ctx.fillStyle = tintRgbaRef.current;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Step 3: Cut out the person area from the tinted blur using destination-out
            ctx.globalCompositeOperation = "destination-out";
            ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

            // Step 4: Draw the sharp person into the cut-out area
            ctx.globalCompositeOperation = "destination-over";
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            // Reset composite operation
            ctx.globalCompositeOperation = "source-over";
          } else {
            // ===== BLUR DISABLED: Just draw the original video =====
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          }
        });

        segmentationRef.current = segmentation;

        // Create output stream from canvas at 30fps
        const outputStream = localCanvas.captureStream(30);

        // Add audio tracks from original stream
        const audioTracks = videoStream.getAudioTracks();
        audioTracks.forEach((track) => {
          outputStream.addTrack(track);
        });

        if (!mounted) return;

        setProcessedStream(outputStream);
        setIsLoading(false);

        console.log("✅ Background blur initialized successfully");

        // Start processing loop
        const processFrame = async () => {
          if (!mounted || !segmentationRef.current || !videoRef.current) return;

          // Prevent concurrent processing
          if (isProcessingRef.current) {
            animationFrameRef.current = requestAnimationFrame(processFrame);
            return;
          }

          isProcessingRef.current = true;

          try {
            await segmentationRef.current.send({ image: videoRef.current });
          } catch (err) {
            // Ignore send errors during shutdown
          }

          isProcessingRef.current = false;

          if (mounted) {
            animationFrameRef.current = requestAnimationFrame(processFrame);
          }
        };

        // Start the processing loop
        processFrame();

      } catch (err) {
        console.error("❌ Failed to initialize background blur:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize background blur");
          setIsLoading(false);
          // Fallback: return original stream if blur fails
          setProcessedStream(videoStream);
        }
      }
    };

    initializeBlur();

    // Cleanup
    return () => {
      mounted = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (segmentationRef.current) {
        try {
          segmentationRef.current.close();
        } catch (e) {
          // Ignore cleanup errors
        }
        segmentationRef.current = null;
      }

      if (localVideo) {
        localVideo.pause();
        localVideo.srcObject = null;
      }

      videoRef.current = null;
      canvasRef.current = null;
      ctxRef.current = null;

      console.log("🧹 Background blur cleaned up");
    };
  }, [videoStream, blurAmount]);

  const toggleBlur = useCallback(() => {
    setIsBlurEnabled((prev) => !prev);
  }, []);

  const setBlurEnabledCallback = useCallback((enabled: boolean) => {
    setIsBlurEnabled(enabled);
  }, []);

  return {
    processedStream,
    isBlurEnabled,
    isLoading,
    error,
    toggleBlur,
    setBlurEnabled: setBlurEnabledCallback,
  };
}
