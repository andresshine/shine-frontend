/**
 * Countdown Audio Utility
 *
 * Generates subtle audio beeps for countdown feedback using the Web Audio API.
 * Useful for users in glasses mode who can't see the screen.
 *
 * @author Shine Studio
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Base frequency for countdown beeps (Hz) */
const BASE_FREQUENCY = 880; // A5 note

/** Higher frequency for final beep (Hz) */
const FINAL_FREQUENCY = 1320; // E6 note

/** Duration of each beep (seconds) */
const BEEP_DURATION = 0.1;

/** Volume level (0-1) */
const VOLUME = 0.15;

// =============================================================================
// AUDIO CONTEXT
// =============================================================================

let audioContext: AudioContext | null = null;

/**
 * Get or create the AudioContext (lazy initialization)
 * Must be called after user interaction due to browser autoplay policies
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    } catch {
      console.warn("Web Audio API not supported");
      return null;
    }
  }

  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Play a countdown beep
 * @param isFinal - If true, plays a higher pitch for the final countdown
 */
export function playCountdownBeep(isFinal: boolean = false): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Create oscillator for tone generation
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Configure oscillator
    oscillator.type = "sine";
    oscillator.frequency.value = isFinal ? FINAL_FREQUENCY : BASE_FREQUENCY;

    // Configure gain (volume) with fade out
    gainNode.gain.setValueAtTime(VOLUME, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + BEEP_DURATION
    );

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Play beep
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + BEEP_DURATION);
  } catch (error) {
    console.warn("Failed to play countdown beep:", error);
  }
}

/**
 * Play the "recording started" sound
 * Two quick ascending beeps to indicate recording has begun
 */
export function playRecordingStartSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // First beep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 660; // E5
    gain1.gain.setValueAtTime(VOLUME, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.08);

    // Second beep (higher, after short delay)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 880; // A5
    gain2.gain.setValueAtTime(VOLUME, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.2);
  } catch (error) {
    console.warn("Failed to play recording start sound:", error);
  }
}
