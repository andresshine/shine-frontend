/**
 * Accessibility Utilities
 *
 * Utilities and helpers for ADA compliance and WCAG conformance.
 * Provides screen reader announcements, focus management, and more.
 *
 * @author Shine Studio
 */

// =============================================================================
// LIVE REGION ANNOUNCEMENTS
// =============================================================================

let announcerElement: HTMLElement | null = null;

/**
 * Initialize the screen reader announcer element
 * Creates a visually hidden live region for announcements
 */
function getAnnouncer(): HTMLElement {
  if (announcerElement) return announcerElement;

  announcerElement = document.createElement("div");
  announcerElement.setAttribute("aria-live", "polite");
  announcerElement.setAttribute("aria-atomic", "true");
  announcerElement.setAttribute("role", "status");
  announcerElement.className = "sr-only";
  announcerElement.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(announcerElement);

  return announcerElement;
}

/**
 * Announce a message to screen readers
 * @param message - The message to announce
 * @param priority - "polite" waits for silence, "assertive" interrupts
 */
export function announce(
  message: string,
  priority: "polite" | "assertive" = "polite"
): void {
  const announcer = getAnnouncer();
  announcer.setAttribute("aria-live", priority);

  // Clear and set message (triggers announcement)
  announcer.textContent = "";
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

/**
 * Announce recording state changes
 */
export function announceRecordingState(
  state: "countdown" | "started" | "stopped" | "uploading" | "complete",
  countdown?: number
): void {
  const messages: Record<string, string> = {
    countdown: `Recording starting in ${countdown} seconds`,
    started: "Recording started. Speak your answer now.",
    stopped: "Recording stopped.",
    uploading: "Uploading your recording, please wait.",
    complete: "Recording saved successfully. Moving to next question.",
  };

  announce(messages[state] || "", state === "countdown" ? "assertive" : "polite");
}

/**
 * Announce question changes
 */
export function announceQuestionChange(
  questionNumber: number,
  totalQuestions: number,
  questionText: string
): void {
  announce(
    `Question ${questionNumber} of ${totalQuestions}. ${questionText}`,
    "polite"
  );
}

// =============================================================================
// FOCUS MANAGEMENT
// =============================================================================

/**
 * Trap focus within a container (for modals/dialogs)
 * Returns a cleanup function to restore normal focus
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener("keydown", handleKeyDown);

  // Focus first element
  firstElement?.focus();

  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Return focus to a previous element (for modal close)
 */
export function returnFocus(previousElement: HTMLElement | null): void {
  if (previousElement && typeof previousElement.focus === "function") {
    previousElement.focus();
  }
}

// =============================================================================
// REDUCED MOTION
// =============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get animation duration based on reduced motion preference
 * @param normalDuration - Duration in ms when motion is allowed
 * @param reducedDuration - Duration in ms when motion is reduced (default: 0)
 */
export function getAnimationDuration(
  normalDuration: number,
  reducedDuration: number = 0
): number {
  return prefersReducedMotion() ? reducedDuration : normalDuration;
}

// =============================================================================
// COLOR CONTRAST
// =============================================================================

/**
 * Calculate relative luminance of a color
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standard
 * @param ratio - Contrast ratio
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 */
export function meetsWcagAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast meets WCAG AAA standard
 */
export function meetsWcagAAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

// =============================================================================
// ARIA HELPERS
// =============================================================================

/**
 * Generate a unique ID for ARIA associations
 */
let idCounter = 0;
export function generateAriaId(prefix: string = "aria"): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Create ARIA description object for complex components
 */
export function createAriaDescription(
  label: string,
  description?: string,
  hint?: string
): {
  "aria-label": string;
  "aria-describedby"?: string;
} {
  const result: { "aria-label": string; "aria-describedby"?: string } = {
    "aria-label": label,
  };

  if (description || hint) {
    const descId = generateAriaId("desc");
    result["aria-describedby"] = descId;
  }

  return result;
}

// =============================================================================
// KEYBOARD UTILITIES
// =============================================================================

/**
 * Check if event is an activation key (Enter or Space)
 */
export function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " ";
}

/**
 * Handle keyboard activation for custom interactive elements
 */
export function handleKeyboardActivation(
  event: React.KeyboardEvent,
  callback: () => void
): void {
  if (isActivationKey(event)) {
    event.preventDefault();
    callback();
  }
}
