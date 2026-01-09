/**
 * useAudioLevel Hook
 *
 * Real-time audio level monitoring using Web Audio API.
 * Provides normalized audio levels for visualization.
 *
 * @author Shine Studio
 */

import { useState, useRef, useEffect, useCallback } from "react";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Number of frequency bins for analysis */
const FFT_SIZE = 256;

/** Smoothing factor for level changes (0-1, higher = smoother) */
const SMOOTHING_FACTOR = 0.8;

/** Update interval for audio level (ms) */
const UPDATE_INTERVAL_MS = 50;

// =============================================================================
// TYPES
// =============================================================================

export interface UseAudioLevelResult {
  /** Current audio level (0-1) */
  level: number;
  /** Peak audio level since last reset (0-1) */
  peakLevel: number;
  /** Whether audio is currently clipping */
  isClipping: boolean;
  /** Reset peak level */
  resetPeak: () => void;
  /** Whether audio analysis is active */
  isActive: boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useAudioLevel(
  stream: MediaStream | null,
  enabled: boolean = true
): UseAudioLevelResult {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [level, setLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const [isClipping, setIsClipping] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const smoothedLevelRef = useRef(0);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const resetPeak = useCallback(() => {
    setPeakLevel(0);
  }, []);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!stream || !enabled) {
      setIsActive(false);
      return;
    }

    // Check if stream has audio tracks
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setIsActive(false);
      return;
    }

    let mounted = true;

    const initializeAudio = async () => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create analyser node
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = SMOOTHING_FACTOR;
        analyserRef.current = analyser;

        // Create source from stream
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        // Create data array for frequency data
        const buffer = new ArrayBuffer(analyser.frequencyBinCount);
        dataArrayRef.current = new Uint8Array(buffer);

        if (mounted) {
          setIsActive(true);
        }

        // Start analysis loop
        const analyze = () => {
          if (!mounted || !analyserRef.current || !dataArrayRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArrayRef.current);

          // Calculate RMS (root mean square) for more accurate level
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            const value = dataArrayRef.current[i] / 255;
            sum += value * value;
          }
          const rms = Math.sqrt(sum / dataArrayRef.current.length);

          // Smooth the level
          smoothedLevelRef.current =
            smoothedLevelRef.current * 0.7 + rms * 0.3;

          // Normalize to 0-1 range (RMS rarely exceeds 0.5)
          const normalizedLevel = Math.min(smoothedLevelRef.current * 2, 1);

          if (mounted) {
            setLevel(normalizedLevel);
            setPeakLevel(prev => Math.max(prev, normalizedLevel));
            setIsClipping(normalizedLevel > 0.95);
          }

          animationFrameRef.current = requestAnimationFrame(analyze);
        };

        analyze();
      } catch (error) {
        console.warn("Failed to initialize audio analysis:", error);
        if (mounted) {
          setIsActive(false);
        }
      }
    };

    initializeAudio();

    // Cleanup
    return () => {
      mounted = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      analyserRef.current = null;
      dataArrayRef.current = null;
      smoothedLevelRef.current = 0;
    };
  }, [stream, enabled]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    level,
    peakLevel,
    isClipping,
    resetPeak,
    isActive,
  };
}
