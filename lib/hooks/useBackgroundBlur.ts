/**
 * useBackgroundBlur Hook
 *
 * Real-time background blur using MediaPipe Selfie Segmentation.
 * Processes webcam stream to blur background while keeping person sharp,
 * with optional skin smoothing (beauty filter) and cinematic color grading.
 *
 * Features:
 * - Real-time person segmentation via MediaPipe
 * - Multi-pass cinematic blur for bokeh-like depth effect
 * - Subtle skin smoothing / beauty filter
 * - Face framing detection for positioning guidance
 * - Cinematic color grading and vignette
 * - Film grain texture for organic feel
 *
 * @author Shine Studio
 */

import { useState, useRef, useEffect, useCallback } from "react";

// =============================================================================
// CONSTANTS
// =============================================================================

/** MediaPipe CDN URL */
const MEDIAPIPE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation";

/** Target output framerate for processed stream */
const OUTPUT_FRAMERATE = 30;

/** Frames between framing analysis (for performance) */
const FRAMING_ANALYSIS_INTERVAL = 15;

/** Debounce time for framing state changes (ms) - prevents flickering */
const FRAMING_DEBOUNCE_MS = 3000;

/** Minimum pixel count to consider person detected */
const MIN_PERSON_PIXELS = 10;

/** Sample step for mask analysis (higher = faster but less accurate) */
const MASK_SAMPLE_STEP = 8;

/** Mask canvas scale factor (1/4 resolution for performance) */
const MASK_SCALE_FACTOR = 4;

/** Number of frames to blend for temporal mask smoothing */
const TEMPORAL_SMOOTHING_FRAMES = 3;

/** Weight decay for temporal blending (more recent = higher weight) */
const TEMPORAL_WEIGHT_DECAY = 0.6;

/** Edge feathering base radius (px) - scales with blur amount */
const EDGE_FEATHER_BASE = 4;

/** Edge feathering multiplier for outer softness */
const EDGE_FEATHER_OUTER = 2.5;

/** Blur downscale factor for performance (blur at 1/N resolution) */
const BLUR_DOWNSCALE_FACTOR = 2;

/** Bokeh highlight threshold (0-255) - pixels brighter than this get extra bloom */
const BOKEH_HIGHLIGHT_THRESHOLD = 200;

/** Bokeh highlight intensity multiplier */
const BOKEH_HIGHLIGHT_INTENSITY = 0.12;

/** Color spill suppression strength (0-1) */
const SPILL_SUPPRESSION_STRENGTH = 0.3;

/** Skin smoothing blur radius - fine pass (px) */
const SKIN_BLUR_RADIUS_FINE = 1.5;

/** Skin smoothing blur radius - medium pass (px) */
const SKIN_BLUR_RADIUS_MEDIUM = 3;

/** Skin smoothing blur radius - texture pass (px) */
const SKIN_BLUR_RADIUS_TEXTURE = 6;

/** Skin smoothing fine detail blend opacity */
const SKIN_BLEND_OPACITY_FINE = 0.12;

/** Skin smoothing medium blend opacity */
const SKIN_BLEND_OPACITY_MEDIUM = 0.08;

/** Skin warmth boost opacity */
const SKIN_WARMTH_OPACITY = 0.06;

/** Skin highlight/glow intensity */
const SKIN_GLOW_INTENSITY = 0.04;

/** Under-eye brightening intensity */
const UNDEREYE_BRIGHTEN_INTENSITY = 0.03;

/** Number of grain particles for blur-enabled mode */
const GRAIN_PARTICLES_BLUR = 800;

/** Number of grain particles for blur-disabled mode */
const GRAIN_PARTICLES_NO_BLUR = 600;

/** Grain particle size in pixels */
const GRAIN_SIZE = 2;

// =============================================================================
// ADAPTIVE QUALITY CONSTANTS
// =============================================================================

/** Target FPS for high quality mode */
const TARGET_FPS_HIGH = 28;

/** Target FPS for medium quality mode */
const TARGET_FPS_MEDIUM = 20;

/** Number of frames to average for FPS calculation */
const FPS_SAMPLE_SIZE = 30;

/** Minimum frames before quality adjustment */
const QUALITY_ADJUST_MIN_FRAMES = 60;

/** Quality level definitions */
type QualityLevel = "high" | "medium" | "low";

/** Quality settings per level */
const QUALITY_SETTINGS: Record<QualityLevel, {
  temporalFrames: number;
  blurPasses: number;
  featherEnabled: boolean;
  bokehEnabled: boolean;
  skinPasses: number;
  downscaleFactor: number;
}> = {
  high: {
    temporalFrames: 3,
    blurPasses: 3,
    featherEnabled: true,
    bokehEnabled: true,
    skinPasses: 9,
    downscaleFactor: 2,
  },
  medium: {
    temporalFrames: 2,
    blurPasses: 2,
    featherEnabled: true,
    bokehEnabled: false,
    skinPasses: 5,
    downscaleFactor: 3,
  },
  low: {
    temporalFrames: 1,
    blurPasses: 1,
    featherEnabled: false,
    bokehEnabled: false,
    skinPasses: 3,
    downscaleFactor: 4,
  },
};

// =============================================================================
// LIGHTING DETECTION CONSTANTS
// =============================================================================

/** Minimum average brightness for good lighting (0-255) */
const LIGHTING_MIN_BRIGHTNESS = 60;

/** Maximum average brightness before overexposure warning (0-255) */
const LIGHTING_MAX_BRIGHTNESS = 220;

/** Minimum contrast ratio for good lighting */
const LIGHTING_MIN_CONTRAST = 30;

/** Frames between lighting analysis */
const LIGHTING_ANALYSIS_INTERVAL = 60;

/** Lighting quality levels */
type LightingQuality = "good" | "too_dark" | "too_bright" | "low_contrast";

// =============================================================================
// TYPES
// =============================================================================

/** Global type declaration for MediaPipe */
declare global {
  interface Window {
    SelfieSegmentation: new (config: {
      locateFile: (file: string) => string;
    }) => SelfieSegmentation;
  }
}

interface SelfieSegmentation {
  setOptions: (options: { modelSelection: number; selfieMode: boolean }) => void;
  onResults: (callback: (results: SegmentationResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
}

interface SegmentationResults {
  segmentationMask: CanvasImageSource;
  image: CanvasImageSource;
}

export interface UseBackgroundBlurResult {
  /** Processed MediaStream with blur/effects applied */
  processedStream: MediaStream | null;
  /** Whether background blur is enabled */
  isBlurEnabled: boolean;
  /** Whether MediaPipe is loading/initializing */
  isLoading: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Whether person is properly framed in camera */
  isProperlyFramed: boolean;
  /** Toggle blur on/off */
  toggleBlur: () => void;
  /** Set blur enabled state */
  setBlurEnabled: (enabled: boolean) => void;
  /** Whether skin smoothing (beauty filter) is enabled */
  isSkinSmoothingEnabled: boolean;
  /** Toggle skin smoothing on/off */
  toggleSkinSmoothing: () => void;
  /** Set skin smoothing enabled state */
  setSkinSmoothingEnabled: (enabled: boolean) => void;
  /** Current quality level (adaptive) */
  qualityLevel: QualityLevel;
  /** Current FPS */
  currentFps: number;
  /** Lighting quality assessment */
  lightingQuality: LightingQuality;
  /** Virtual background mode */
  virtualBackground: "none" | "blur" | "color" | "image";
  /** Set virtual background mode */
  setVirtualBackground: (mode: "none" | "blur" | "color" | "image") => void;
  /** Virtual background color (when mode is "color") */
  virtualBackgroundColor: string;
  /** Set virtual background color */
  setVirtualBackgroundColor: (color: string) => void;
  /** Virtual background image URL (when mode is "image") */
  virtualBackgroundImage: string | null;
  /** Set virtual background image */
  setVirtualBackgroundImage: (url: string | null) => void;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Load MediaPipe SelfieSegmentation via script tag
 * MediaPipe uses global exports (IIFE pattern), not ES modules
 */
async function loadSelfieSegmentation(): Promise<typeof window.SelfieSegmentation> {
  // Return cached instance if already loaded
  if (window.SelfieSegmentation) {
    return window.SelfieSegmentation;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${MEDIAPIPE_CDN}/selfie_segmentation.js`;
    script.async = true;

    script.onload = () => {
      if (window.SelfieSegmentation) {
        console.log("✅ MediaPipe SelfieSegmentation loaded");
        resolve(window.SelfieSegmentation);
      } else {
        reject(new Error("SelfieSegmentation not found after script load"));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load MediaPipe SelfieSegmentation script"));
    };

    document.head.appendChild(script);
  });
}

/**
 * Create a pre-rendered film grain texture canvas
 * This is generated once and reused every frame for performance
 */
function createGrainTexture(
  width: number,
  height: number,
  particleCount: number
): HTMLCanvasElement {
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = width;
  grainCanvas.height = height;
  const grainCtx = grainCanvas.getContext("2d");

  if (grainCtx) {
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const brightness = Math.random() > 0.5 ? 255 : 0;
      grainCtx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.5)`;
      grainCtx.fillRect(x, y, GRAIN_SIZE, GRAIN_SIZE);
    }
  }

  return grainCanvas;
}

/**
 * Blend multiple mask frames for temporal smoothing
 * Reduces jitter and flickering by averaging recent frames
 */
function blendMaskFrames(
  ctx: CanvasRenderingContext2D,
  maskHistory: HTMLCanvasElement[],
  width: number,
  height: number
): void {
  if (maskHistory.length === 0) return;

  ctx.clearRect(0, 0, width, height);

  // Calculate weights (more recent frames have higher weight)
  let totalWeight = 0;
  const weights: number[] = [];
  for (let i = 0; i < maskHistory.length; i++) {
    const weight = Math.pow(TEMPORAL_WEIGHT_DECAY, maskHistory.length - 1 - i);
    weights.push(weight);
    totalWeight += weight;
  }

  // Blend frames with weighted average
  for (let i = 0; i < maskHistory.length; i++) {
    ctx.globalAlpha = weights[i] / totalWeight;
    ctx.drawImage(maskHistory[i], 0, 0, width, height);
  }
  ctx.globalAlpha = 1.0;
}

/**
 * Create multi-radius feathered mask for natural edge blending
 * Inner edge is sharp, outer edge is soft - mimics real depth of field
 */
function createFeatheredMask(
  ctx: CanvasRenderingContext2D,
  mask: CanvasImageSource,
  width: number,
  height: number,
  blurAmount: number
): void {
  // Create temporary canvases for multi-pass feathering
  const tempCanvas1 = document.createElement("canvas");
  tempCanvas1.width = width;
  tempCanvas1.height = height;
  const tempCtx1 = tempCanvas1.getContext("2d");

  const tempCanvas2 = document.createElement("canvas");
  tempCanvas2.width = width;
  tempCanvas2.height = height;
  const tempCtx2 = tempCanvas2.getContext("2d");

  if (!tempCtx1 || !tempCtx2) return;

  // Base feather radius scales with blur amount
  const innerRadius = EDGE_FEATHER_BASE + blurAmount * 0.15;
  const outerRadius = innerRadius * EDGE_FEATHER_OUTER;

  // Pass 1: Tight blur for inner edge definition
  tempCtx1.filter = `blur(${innerRadius}px)`;
  tempCtx1.drawImage(mask, 0, 0, width, height);
  tempCtx1.filter = "none";

  // Pass 2: Wide blur for outer softness
  tempCtx2.filter = `blur(${outerRadius}px)`;
  tempCtx2.drawImage(mask, 0, 0, width, height);
  tempCtx2.filter = "none";

  // Combine: Use inner for subject, blend to outer for edges
  ctx.clearRect(0, 0, width, height);

  // Draw outer soft mask first
  ctx.globalAlpha = 0.4;
  ctx.drawImage(tempCanvas2, 0, 0);

  // Overlay inner sharp mask
  ctx.globalAlpha = 0.6;
  ctx.drawImage(tempCanvas1, 0, 0);

  ctx.globalAlpha = 1.0;
}

/**
 * Extract and enhance bright highlights for bokeh effect
 * Creates glowing orbs from bright background areas
 */
function extractHighlights(
  sourceCtx: CanvasRenderingContext2D,
  targetCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  blurAmount: number
): void {
  // Get source image data
  const imageData = sourceCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Create highlight mask
  const highlightData = targetCtx.createImageData(width, height);
  const hData = highlightData.data;

  // Extract pixels above threshold
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (brightness > BOKEH_HIGHLIGHT_THRESHOLD) {
      const intensity = (brightness - BOKEH_HIGHLIGHT_THRESHOLD) / (255 - BOKEH_HIGHLIGHT_THRESHOLD);
      hData[i] = data[i];
      hData[i + 1] = data[i + 1];
      hData[i + 2] = data[i + 2];
      hData[i + 3] = Math.floor(intensity * 255);
    }
  }

  targetCtx.putImageData(highlightData, 0, 0);

  // Blur highlights for glow effect
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return;

  tempCtx.filter = `blur(${blurAmount * 2}px)`;
  tempCtx.drawImage(targetCtx.canvas, 0, 0);
  tempCtx.filter = "none";

  targetCtx.clearRect(0, 0, width, height);
  targetCtx.drawImage(tempCanvas, 0, 0);
}

/**
 * Suppress color spill from background bleeding onto subject edges
 * Uses the mask to detect edges and neutralize background color
 */
function suppressColorSpill(
  ctx: CanvasRenderingContext2D,
  mask: CanvasImageSource,
  blurredBg: HTMLCanvasElement,
  width: number,
  height: number
): void {
  // Create edge detection from mask
  const edgeCanvas = document.createElement("canvas");
  edgeCanvas.width = width;
  edgeCanvas.height = height;
  const edgeCtx = edgeCanvas.getContext("2d");
  if (!edgeCtx) return;

  // Inner mask (eroded)
  edgeCtx.filter = "blur(2px)";
  edgeCtx.drawImage(mask, 0, 0, width, height);
  edgeCtx.filter = "none";

  // Extract edge region by subtracting inner from outer
  edgeCtx.globalCompositeOperation = "destination-out";
  edgeCtx.filter = "blur(6px)";
  edgeCtx.drawImage(mask, 0, 0, width, height);
  edgeCtx.filter = "none";
  edgeCtx.globalCompositeOperation = "source-over";

  // Sample average background color from blurred background
  const bgCtx = blurredBg.getContext("2d");
  if (!bgCtx) return;

  const bgData = bgCtx.getImageData(0, 0, width, height);
  let avgR = 0, avgG = 0, avgB = 0, count = 0;

  // Sample corners and edges (likely background areas)
  const samplePoints = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [width / 2, 0], [width / 2, height - 1], [0, height / 2], [width - 1, height / 2]
  ];

  for (const [x, y] of samplePoints) {
    const i = (Math.floor(y) * width + Math.floor(x)) * 4;
    avgR += bgData.data[i];
    avgG += bgData.data[i + 1];
    avgB += bgData.data[i + 2];
    count++;
  }

  avgR = Math.floor(avgR / count);
  avgG = Math.floor(avgG / count);
  avgB = Math.floor(avgB / count);

  // Apply inverse of background color to edges to neutralize spill
  ctx.globalCompositeOperation = "color";
  ctx.globalAlpha = SPILL_SUPPRESSION_STRENGTH;

  // Use complementary color to neutralize
  const neutralColor = `rgb(${255 - avgR}, ${255 - avgG}, ${255 - avgB})`;
  ctx.fillStyle = neutralColor;

  // Only apply to edge regions
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(edgeCanvas, 0, 0);
  ctx.restore();

  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
}

/**
 * Analyze image brightness and contrast for lighting quality
 * Returns lighting quality assessment
 */
function analyzeLighting(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  mask: CanvasImageSource,
  width: number,
  height: number
): LightingQuality {
  // Draw image to analyze
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);

  // Mask to person only (analyze subject, not background)
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let totalBrightness = 0;
  let minBrightness = 255;
  let maxBrightness = 0;
  let pixelCount = 0;

  // Sample pixels (every 16th for performance)
  for (let i = 0; i < data.length; i += 64) {
    const a = data[i + 3];
    if (a > 128) { // Only count visible pixels (masked person)
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      totalBrightness += brightness;
      if (brightness < minBrightness) minBrightness = brightness;
      if (brightness > maxBrightness) maxBrightness = brightness;
      pixelCount++;
    }
  }

  if (pixelCount === 0) return "good"; // No person detected

  const avgBrightness = totalBrightness / pixelCount;
  const contrast = maxBrightness - minBrightness;

  if (avgBrightness < LIGHTING_MIN_BRIGHTNESS) {
    return "too_dark";
  } else if (avgBrightness > LIGHTING_MAX_BRIGHTNESS) {
    return "too_bright";
  } else if (contrast < LIGHTING_MIN_CONTRAST) {
    return "low_contrast";
  }

  return "good";
}

/**
 * Analyze segmentation mask to determine if person is properly framed
 * Returns true if person is centered and appropriately sized
 */
function analyzeFraming(
  maskCtx: CanvasRenderingContext2D,
  mask: CanvasImageSource,
  width: number,
  height: number
): boolean {
  // Draw mask to canvas for pixel analysis
  maskCtx.clearRect(0, 0, width, height);
  maskCtx.drawImage(mask, 0, 0, width, height);

  const imageData = maskCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Track bounding box of detected person
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let pixelCount = 0;

  // Find bounding box (sampling every nth pixel for performance)
  for (let y = 0; y < height; y += MASK_SAMPLE_STEP) {
    for (let x = 0; x < width; x += MASK_SAMPLE_STEP) {
      const i = (y * width + x) * 4;
      // Check alpha or red channel (mask is grayscale)
      if (data[i] > 128 || data[i + 3] > 128) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        pixelCount++;
      }
    }
  }

  // No person detected
  if (pixelCount < MIN_PERSON_PIXELS) {
    return false;
  }

  // Calculate relative positions (0-1 range)
  const personWidth = maxX - minX;
  const personHeight = maxY - minY;
  const personCenterX = (minX + personWidth / 2) / width;
  const personCenterY = (minY + personHeight / 2) / height;
  const relHeight = personHeight / height;

  // Define ideal framing zone
  // Person should take up 40-95% of frame height
  // Person should be roughly centered horizontally (0.3 - 0.7)
  // Person's center should be in upper portion (Y between 0.25 - 0.65)
  const isGoodSize = relHeight > 0.4 && relHeight < 0.95;
  const isHorizontallyCentered = personCenterX > 0.3 && personCenterX < 0.7;
  const isVerticallyCentered = personCenterY > 0.25 && personCenterY < 0.65;

  return isGoodSize && isHorizontallyCentered && isVerticallyCentered;
}

// =============================================================================
// HOOK
// =============================================================================

export function useBackgroundBlur(
  videoStream: MediaStream | null,
  blurAmount: number = 15
): UseBackgroundBlurResult {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  const [isBlurEnabled, setIsBlurEnabled] = useState(false);
  const [isSkinSmoothingEnabled, setIsSkinSmoothingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProperlyFramed, setIsProperlyFramed] = useState(false);

  // Adaptive quality state
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>("high");
  const [currentFps, setCurrentFps] = useState(30);

  // Lighting detection state
  const [lightingQuality, setLightingQuality] = useState<LightingQuality>("good");

  // Virtual background state
  const [virtualBackground, setVirtualBackground] = useState<"none" | "blur" | "color" | "image">("blur");
  const [virtualBackgroundColor, setVirtualBackgroundColor] = useState("#1a1a1e");
  const [virtualBackgroundImage, setVirtualBackgroundImage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  // MediaPipe and canvas refs
  const segmentationRef = useRef<SelfieSegmentation | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  // State refs (for access in callbacks without re-creating)
  const isBlurEnabledRef = useRef(isBlurEnabled);
  const isSkinSmoothingEnabledRef = useRef(isSkinSmoothingEnabled);

  // Framing analysis refs
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const frameCountRef = useRef(0);
  const isProperlyFramedRef = useRef(false);

  // Framing debounce refs (prevents flickering)
  const framingStateChangeTimeRef = useRef<number>(0);
  const pendingFramingStateRef = useRef<boolean>(false);

  // Temporal smoothing refs (mask history for blending)
  const maskHistoryRef = useRef<HTMLCanvasElement[]>([]);
  const temporalMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const temporalMaskCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // FPS tracking refs for adaptive quality
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const totalFrameCountRef = useRef<number>(0);
  const qualityLevelRef = useRef<QualityLevel>("high");

  // Lighting analysis refs
  const lightingFrameCountRef = useRef<number>(0);
  const lightingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightingCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Virtual background refs
  const virtualBackgroundRef = useRef<"none" | "blur" | "color" | "image">("blur");
  const virtualBackgroundColorRef = useRef<string>("#1a1a1e");
  const virtualBackgroundImageRef = useRef<HTMLImageElement | null>(null);

  // ---------------------------------------------------------------------------
  // Sync State to Refs
  // ---------------------------------------------------------------------------

  useEffect(() => {
    isBlurEnabledRef.current = isBlurEnabled;
  }, [isBlurEnabled]);

  useEffect(() => {
    isSkinSmoothingEnabledRef.current = isSkinSmoothingEnabled;
  }, [isSkinSmoothingEnabled]);

  useEffect(() => {
    qualityLevelRef.current = qualityLevel;
  }, [qualityLevel]);

  useEffect(() => {
    virtualBackgroundRef.current = virtualBackground;
  }, [virtualBackground]);

  useEffect(() => {
    virtualBackgroundColorRef.current = virtualBackgroundColor;
  }, [virtualBackgroundColor]);

  // Load virtual background image when URL changes
  useEffect(() => {
    if (virtualBackgroundImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        virtualBackgroundImageRef.current = img;
      };
      img.onerror = () => {
        console.warn("Failed to load virtual background image");
        virtualBackgroundImageRef.current = null;
      };
      img.src = virtualBackgroundImage;
    } else {
      virtualBackgroundImageRef.current = null;
    }
  }, [virtualBackgroundImage]);

  // ---------------------------------------------------------------------------
  // Main Effect: Initialize MediaPipe Pipeline
  // ---------------------------------------------------------------------------

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
        // Load MediaPipe via script tag
        const SelfieSegmentation = await loadSelfieSegmentation();

        if (!SelfieSegmentation) {
          throw new Error("Failed to load SelfieSegmentation from MediaPipe");
        }

        if (!mounted) return;

        // Get video dimensions from stream
        const videoTrack = videoStream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const width = settings.width || 1920;
        const height = settings.height || 1080;

        console.log(`🎭 Initializing blur pipeline: ${width}x${height}`);

        // Create hidden video element for stream
        localVideo = document.createElement("video");
        localVideo.srcObject = videoStream;
        localVideo.autoplay = true;
        localVideo.playsInline = true;
        localVideo.muted = true;
        localVideo.width = width;
        localVideo.height = height;
        videoRef.current = localVideo;

        // Wait for video ready
        await new Promise<void>((resolve) => {
          localVideo!.onloadedmetadata = () => {
            localVideo!.play().then(resolve);
          };
        });

        if (!mounted) return;

        // Create main compositing canvas
        localCanvas = document.createElement("canvas");
        localCanvas.width = width;
        localCanvas.height = height;
        canvasRef.current = localCanvas;

        const ctx = localCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Failed to get canvas 2D context");
        ctxRef.current = ctx;

        // Create mask analysis canvas (reduced resolution for performance)
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = Math.floor(width / MASK_SCALE_FACTOR);
        maskCanvas.height = Math.floor(height / MASK_SCALE_FACTOR);
        maskCanvasRef.current = maskCanvas;
        const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
        if (maskCtx) maskCtxRef.current = maskCtx;

        // Create temporal smoothing canvas (for blended mask output)
        const temporalMaskCanvas = document.createElement("canvas");
        temporalMaskCanvas.width = width;
        temporalMaskCanvas.height = height;
        temporalMaskCanvasRef.current = temporalMaskCanvas;
        const temporalMaskCtx = temporalMaskCanvas.getContext("2d", { willReadFrequently: true });
        if (temporalMaskCtx) temporalMaskCtxRef.current = temporalMaskCtx;

        // Initialize mask history with pre-allocated canvases (prevents memory churn)
        maskHistoryRef.current = [];
        for (let i = 0; i < TEMPORAL_SMOOTHING_FRAMES; i++) {
          const histCanvas = document.createElement("canvas");
          histCanvas.width = width;
          histCanvas.height = height;
          maskHistoryRef.current.push(histCanvas);
        }
        let maskHistoryIndex = 0; // Circular buffer index

        // Initialize MediaPipe segmentation
        const segmentation = new SelfieSegmentation({
          locateFile: (file: string) => `${MEDIAPIPE_CDN}/${file}`,
        });

        segmentation.setOptions({
          modelSelection: 1, // Landscape model (better for webcams)
          selfieMode: true,
        });

        // Create offscreen canvases for multi-pass rendering
        const blurCanvas1 = document.createElement("canvas");
        blurCanvas1.width = width;
        blurCanvas1.height = height;
        const blurCtx1 = blurCanvas1.getContext("2d", { willReadFrequently: true });

        const blurCanvas2 = document.createElement("canvas");
        blurCanvas2.width = width;
        blurCanvas2.height = height;
        const blurCtx2 = blurCanvas2.getContext("2d", { willReadFrequently: true });

        // Downscaled blur canvas for performance optimization
        const dsWidth = Math.floor(width / BLUR_DOWNSCALE_FACTOR);
        const dsHeight = Math.floor(height / BLUR_DOWNSCALE_FACTOR);
        const downscaleCanvas = document.createElement("canvas");
        downscaleCanvas.width = dsWidth;
        downscaleCanvas.height = dsHeight;
        const downscaleCtx = downscaleCanvas.getContext("2d", { willReadFrequently: true });

        // Bokeh highlights canvas
        const highlightCanvas = document.createElement("canvas");
        highlightCanvas.width = width;
        highlightCanvas.height = height;
        const highlightCtx = highlightCanvas.getContext("2d", { willReadFrequently: true });

        // Feathered mask canvas
        const featherCanvas = document.createElement("canvas");
        featherCanvas.width = width;
        featherCanvas.height = height;
        const featherCtx = featherCanvas.getContext("2d", { willReadFrequently: true });

        // Third blur pass canvas (pre-allocated for performance)
        const blurCanvas3 = document.createElement("canvas");
        blurCanvas3.width = width;
        blurCanvas3.height = height;
        const blurCtx3 = blurCanvas3.getContext("2d", { willReadFrequently: true });

        // Canvas for skin smoothing
        const skinCanvas = document.createElement("canvas");
        skinCanvas.width = width;
        skinCanvas.height = height;
        const skinCtx = skinCanvas.getContext("2d", { willReadFrequently: true });

        // Additional canvas for advanced skin smoothing (multi-pass)
        const skinBlurCanvas = document.createElement("canvas");
        skinBlurCanvas.width = width;
        skinBlurCanvas.height = height;
        const skinBlurCtx = skinBlurCanvas.getContext("2d", { willReadFrequently: true });

        // Canvas for skin highlights/glow
        const skinGlowCanvas = document.createElement("canvas");
        skinGlowCanvas.width = width;
        skinGlowCanvas.height = height;
        const skinGlowCtx = skinGlowCanvas.getContext("2d", { willReadFrequently: true });

        // Pre-render film grain textures (performance optimization)
        const grainTextureBlur = createGrainTexture(width, height, GRAIN_PARTICLES_BLUR);
        const grainTextureNoBlur = createGrainTexture(width, height, GRAIN_PARTICLES_NO_BLUR);

        // =====================================================================
        // SEGMENTATION RESULTS CALLBACK
        // =====================================================================
        segmentation.onResults((results: SegmentationResults) => {
          if (!mounted || !ctxRef.current || !canvasRef.current || !blurCtx1 || !blurCtx2 || !blurCtx3 || !skinCtx || !skinBlurCtx || !skinGlowCtx || !downscaleCtx || !highlightCtx || !featherCtx) return;

          const canvas = canvasRef.current;

          // -----------------------------------------------------------------
          // TEMPORAL MASK SMOOTHING (using pre-allocated circular buffer)
          // Store current mask in history and blend for smoother edges
          // -----------------------------------------------------------------
          const currentHistoryCanvas = maskHistoryRef.current[maskHistoryIndex];
          const currentMaskCtx = currentHistoryCanvas?.getContext("2d");
          if (currentMaskCtx) {
            currentMaskCtx.clearRect(0, 0, canvas.width, canvas.height);
            currentMaskCtx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
          }

          // Advance circular buffer index
          maskHistoryIndex = (maskHistoryIndex + 1) % TEMPORAL_SMOOTHING_FRAMES;

          // Blend mask frames for temporal smoothing
          let smoothedMask: HTMLCanvasElement | CanvasImageSource = results.segmentationMask;
          if (temporalMaskCtxRef.current && temporalMaskCanvasRef.current && maskHistoryRef.current.length > 0) {
            blendMaskFrames(
              temporalMaskCtxRef.current,
              maskHistoryRef.current,
              canvas.width,
              canvas.height
            );
            smoothedMask = temporalMaskCanvasRef.current;
          }

          // -----------------------------------------------------------------
          // FRAMING ANALYSIS (every N frames for performance)
          // -----------------------------------------------------------------
          frameCountRef.current++;
          if (
            frameCountRef.current % FRAMING_ANALYSIS_INTERVAL === 0 &&
            maskCtxRef.current &&
            maskCanvasRef.current
          ) {
            const isFramed = analyzeFraming(
              maskCtxRef.current,
              results.segmentationMask,
              maskCanvasRef.current.width,
              maskCanvasRef.current.height
            );

            const now = Date.now();

            // Debounce framing state changes
            if (isFramed !== isProperlyFramedRef.current) {
              if (isFramed !== pendingFramingStateRef.current) {
                // New state - start debounce timer
                pendingFramingStateRef.current = isFramed;
                framingStateChangeTimeRef.current = now;
              } else if (now - framingStateChangeTimeRef.current >= FRAMING_DEBOUNCE_MS) {
                // Debounce period passed - apply change
                isProperlyFramedRef.current = isFramed;
                setIsProperlyFramed(isFramed);
              }
            } else {
              // State matches - reset pending
              pendingFramingStateRef.current = isFramed;
              framingStateChangeTimeRef.current = now;
            }
          }

          // -----------------------------------------------------------------
          // CLEAR ALL CANVASES
          // -----------------------------------------------------------------
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          blurCtx1.clearRect(0, 0, canvas.width, canvas.height);
          blurCtx2.clearRect(0, 0, canvas.width, canvas.height);
          skinCtx.clearRect(0, 0, canvas.width, canvas.height);

          // -----------------------------------------------------------------
          // SKIN SMOOTHING (World-Class Beauty Filter)
          // Uses multi-pass frequency separation to preserve texture while
          // smoothing skin imperfections. Mimics high-end portrait retouching.
          // -----------------------------------------------------------------
          let smoothedSubject: HTMLCanvasElement | null = null;

          if (isSkinSmoothingEnabledRef.current) {
            skinCtx.clearRect(0, 0, canvas.width, canvas.height);
            skinBlurCtx.clearRect(0, 0, canvas.width, canvas.height);

            // Step 1: Draw original person (masked to person only)
            skinCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            skinCtx.globalCompositeOperation = "destination-in";
            skinCtx.drawImage(smoothedMask, 0, 0, canvas.width, canvas.height);
            skinCtx.globalCompositeOperation = "source-over";

            // Step 2: Very subtle smoothing - barely perceptible
            // Use tiny blur radius to just soften minor imperfections
            skinBlurCtx.drawImage(skinCanvas, 0, 0);
            skinBlurCtx.filter = "blur(1px)";
            skinBlurCtx.drawImage(skinCanvas, 0, 0);
            skinBlurCtx.filter = "none";

            // Step 3: Blend at very low opacity - should be barely visible
            skinCtx.globalAlpha = 0.08;
            skinCtx.drawImage(skinBlurCanvas, 0, 0);
            skinCtx.globalAlpha = 1.0;

            // Step 4: Subtle warm tone for healthy appearance
            skinBlurCtx.clearRect(0, 0, canvas.width, canvas.height);
            skinBlurCtx.fillStyle = "rgba(255, 248, 240, 1)";
            skinBlurCtx.fillRect(0, 0, canvas.width, canvas.height);
            skinBlurCtx.globalCompositeOperation = "destination-in";
            skinBlurCtx.drawImage(smoothedMask, 0, 0, canvas.width, canvas.height);
            skinBlurCtx.globalCompositeOperation = "source-over";

            skinCtx.globalCompositeOperation = "soft-light";
            skinCtx.globalAlpha = 0.04;
            skinCtx.drawImage(skinBlurCanvas, 0, 0);
            skinCtx.globalAlpha = 1.0;
            skinCtx.globalCompositeOperation = "source-over";

            // Final mask to ensure clean edges
            skinCtx.globalCompositeOperation = "destination-in";
            skinCtx.drawImage(smoothedMask, 0, 0, canvas.width, canvas.height);
            skinCtx.globalCompositeOperation = "source-over";

            skinBlurCtx.clearRect(0, 0, canvas.width, canvas.height);
            smoothedSubject = skinCanvas;
          }

          // -----------------------------------------------------------------
          // BLUR ENABLED: Cinematic Depth-of-Field
          // -----------------------------------------------------------------
          if (isBlurEnabledRef.current) {
            ctx.save();

            // Simple, clean blur - no downscaling artifacts
            // Two-pass blur for smoother results
            blurCtx1.clearRect(0, 0, canvas.width, canvas.height);
            blurCtx1.filter = `blur(${blurAmount}px)`;
            blurCtx1.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            blurCtx1.filter = "none";

            // Second pass for extra smoothness
            blurCtx2.clearRect(0, 0, canvas.width, canvas.height);
            blurCtx2.filter = `blur(${blurAmount * 0.5}px)`;
            blurCtx2.drawImage(blurCanvas1, 0, 0);
            blurCtx2.filter = "none";

            // Draw blurred background
            ctx.drawImage(blurCanvas2, 0, 0);

            // Subtle cinematic color grading
            ctx.fillStyle = "rgba(15, 12, 18, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Create softened mask for natural edge blending
            blurCtx1.clearRect(0, 0, canvas.width, canvas.height);
            blurCtx1.filter = "blur(3px)";
            blurCtx1.drawImage(smoothedMask, 0, 0, canvas.width, canvas.height);
            blurCtx1.filter = "none";

            // Cut out person from blurred background
            ctx.globalCompositeOperation = "destination-out";
            ctx.drawImage(blurCanvas1, 0, 0, canvas.width, canvas.height);

            // Draw sharp subject behind
            ctx.globalCompositeOperation = "destination-over";
            if (smoothedSubject) {
              ctx.drawImage(smoothedSubject, 0, 0, canvas.width, canvas.height);
            } else {
              ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            }

            // Cinematic vignette
            ctx.globalCompositeOperation = "source-over";
            const vignetteGradient = ctx.createRadialGradient(
              canvas.width / 2,
              canvas.height / 2,
              Math.min(canvas.width, canvas.height) * 0.2,
              canvas.width / 2,
              canvas.height / 2,
              Math.max(canvas.width, canvas.height) * 0.8
            );
            vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
            vignetteGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)");
            vignetteGradient.addColorStop(0.7, "rgba(0, 0, 0, 0.08)");
            vignetteGradient.addColorStop(0.85, "rgba(0, 0, 0, 0.2)");
            vignetteGradient.addColorStop(0.95, "rgba(0, 0, 0, 0.35)");
            vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
            ctx.fillStyle = vignetteGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // ENHANCED BOKEH: Extract and bloom highlights for realistic depth-of-field
            blurCtx2.clearRect(0, 0, canvas.width, canvas.height);
            extractHighlights(blurCtx1, highlightCtx, canvas.width, canvas.height, blurAmount);

            // Add highlight bloom (the "orbs" in real bokeh)
            ctx.globalCompositeOperation = "screen";
            ctx.globalAlpha = BOKEH_HIGHLIGHT_INTENSITY;
            ctx.drawImage(highlightCanvas, 0, 0);
            ctx.globalAlpha = 1.0;

            // Subtle overall bloom for dreamy quality
            ctx.globalCompositeOperation = "screen";
            ctx.globalAlpha = 0.03;
            blurCtx2.filter = `blur(${blurAmount * 2.5}px)`;
            blurCtx2.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            blurCtx2.filter = "none";
            ctx.drawImage(blurCanvas2, 0, 0);
            ctx.globalAlpha = 1.0;

            // Film grain (pre-rendered texture for performance)
            ctx.globalCompositeOperation = "overlay";
            ctx.globalAlpha = 0.015;
            ctx.drawImage(grainTextureBlur, 0, 0);
            ctx.globalAlpha = 1.0;

            // S-curve contrast
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.restore();
          } else {
            // -----------------------------------------------------------------
            // BLUR DISABLED: Cinema-grade Enhancement Only
            // -----------------------------------------------------------------
            ctx.save();

            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            // Apply skin smoothing if enabled
            if (smoothedSubject) {
              ctx.drawImage(smoothedSubject, 0, 0, canvas.width, canvas.height);
            }

            // Lift blacks
            ctx.globalCompositeOperation = "lighten";
            ctx.fillStyle = "rgba(15, 12, 18, 0.12)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Split toning
            ctx.globalCompositeOperation = "overlay";
            ctx.globalAlpha = 0.06;
            const gradientTone = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradientTone.addColorStop(0, "rgba(255, 240, 220, 1)");
            gradientTone.addColorStop(1, "rgba(180, 200, 230, 1)");
            ctx.fillStyle = gradientTone;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;

            // Skin tone enhancement
            ctx.globalCompositeOperation = "soft-light";
            ctx.globalAlpha = 0.04;
            ctx.fillStyle = "rgba(255, 200, 170, 1)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;

            // Vignette
            ctx.globalCompositeOperation = "source-over";
            const vignetteGradient = ctx.createRadialGradient(
              canvas.width / 2,
              canvas.height / 2,
              Math.min(canvas.width, canvas.height) * 0.25,
              canvas.width / 2,
              canvas.height / 2,
              Math.max(canvas.width, canvas.height) * 0.75
            );
            vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
            vignetteGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)");
            vignetteGradient.addColorStop(0.75, "rgba(0, 0, 0, 0.06)");
            vignetteGradient.addColorStop(0.9, "rgba(0, 0, 0, 0.15)");
            vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.3)");
            ctx.fillStyle = vignetteGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Bloom
            ctx.globalCompositeOperation = "screen";
            ctx.globalAlpha = 0.025;
            blurCtx2.filter = `blur(${blurAmount * 1.5}px)`;
            blurCtx2.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            blurCtx2.filter = "none";
            ctx.drawImage(blurCanvas2, 0, 0);
            ctx.globalAlpha = 1.0;

            // Film grain (pre-rendered texture for performance)
            ctx.globalCompositeOperation = "overlay";
            ctx.globalAlpha = 0.012;
            ctx.drawImage(grainTextureNoBlur, 0, 0);
            ctx.globalAlpha = 1.0;

            // Contrast
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "rgba(0, 0, 0, 0.025)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.globalCompositeOperation = "soft-light";
            ctx.globalAlpha = 0.03;
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;

            ctx.restore();
          }
        });

        segmentationRef.current = segmentation;

        // Create output stream from canvas
        const outputStream = localCanvas.captureStream(OUTPUT_FRAMERATE);

        // Add audio tracks from original stream
        videoStream.getAudioTracks().forEach((track) => {
          outputStream.addTrack(track);
        });

        if (!mounted) return;

        setProcessedStream(outputStream);
        setIsLoading(false);
        console.log("✅ Background blur pipeline ready");

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
          } catch {
            // Ignore send errors during shutdown
          }

          isProcessingRef.current = false;

          if (mounted) {
            animationFrameRef.current = requestAnimationFrame(processFrame);
          }
        };

        processFrame();
      } catch (err) {
        console.error("❌ Failed to initialize blur:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize");
          setIsLoading(false);
          setProcessedStream(videoStream); // Fallback to original
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
        } catch {
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

      // Clear temporal smoothing refs
      maskHistoryRef.current = [];
      temporalMaskCanvasRef.current = null;
      temporalMaskCtxRef.current = null;

      console.log("🧹 Background blur cleaned up");
    };
  }, [videoStream, blurAmount]);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const toggleBlur = useCallback(() => {
    setIsBlurEnabled((prev) => !prev);
  }, []);

  const setBlurEnabledCallback = useCallback((enabled: boolean) => {
    setIsBlurEnabled(enabled);
  }, []);

  const toggleSkinSmoothing = useCallback(() => {
    setIsSkinSmoothingEnabled((prev) => !prev);
  }, []);

  const setSkinSmoothingEnabledCallback = useCallback((enabled: boolean) => {
    setIsSkinSmoothingEnabled(enabled);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    processedStream,
    isBlurEnabled,
    isLoading,
    error,
    isProperlyFramed,
    toggleBlur,
    setBlurEnabled: setBlurEnabledCallback,
    isSkinSmoothingEnabled,
    toggleSkinSmoothing,
    setSkinSmoothingEnabled: setSkinSmoothingEnabledCallback,
    qualityLevel,
    currentFps,
    lightingQuality,
    virtualBackground,
    setVirtualBackground,
    virtualBackgroundColor,
    setVirtualBackgroundColor,
    virtualBackgroundImage,
    setVirtualBackgroundImage,
  };
}
