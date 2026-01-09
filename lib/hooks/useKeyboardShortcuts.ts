/**
 * useKeyboardShortcuts Hook
 *
 * Provides keyboard shortcuts for interview recording controls.
 * Handles Space for start/stop, Escape for cancel, and other shortcuts.
 *
 * @author Shine Studio
 */

import { useEffect, useCallback, useRef } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface KeyboardShortcutsConfig {
  /** Callback when Space is pressed (start/stop recording) */
  onToggleRecording?: () => void;
  /** Callback when Escape is pressed (cancel/close) */
  onEscape?: () => void;
  /** Callback when R is pressed (redo) */
  onRedo?: () => void;
  /** Callback when S is pressed (toggle settings) */
  onToggleSettings?: () => void;
  /** Callback when Q is pressed (toggle questions) */
  onToggleQuestions?: () => void;
  /** Callback when B is pressed (toggle blur) */
  onToggleBlur?: () => void;
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Whether recording is in progress (affects some shortcuts) */
  isRecording?: boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useKeyboardShortcuts({
  onToggleRecording,
  onEscape,
  onRedo,
  onToggleSettings,
  onToggleQuestions,
  onToggleBlur,
  enabled = true,
  isRecording = false,
}: KeyboardShortcutsConfig): void {
  // Track if user is typing in an input
  const isTypingRef = useRef(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        isTypingRef.current = true;
        return;
      }
      isTypingRef.current = false;

      // Handle shortcuts
      switch (event.code) {
        case "Space":
          // Space: Toggle recording
          if (onToggleRecording) {
            event.preventDefault();
            onToggleRecording();
          }
          break;

        case "Escape":
          // Escape: Cancel/close
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case "KeyR":
          // R: Redo previous question (only when not recording)
          if (onRedo && !isRecording && !event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            onRedo();
          }
          break;

        case "KeyS":
          // S: Toggle settings (only when not recording, not Cmd+S)
          if (onToggleSettings && !isRecording && !event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            onToggleSettings();
          }
          break;

        case "KeyQ":
          // Q: Toggle questions sidebar (only when not recording)
          if (onToggleQuestions && !isRecording && !event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            onToggleQuestions();
          }
          break;

        case "KeyB":
          // B: Toggle blur
          if (onToggleBlur && !event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            onToggleBlur();
          }
          break;

        default:
          break;
      }
    },
    [
      enabled,
      isRecording,
      onToggleRecording,
      onEscape,
      onRedo,
      onToggleSettings,
      onToggleQuestions,
      onToggleBlur,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

// =============================================================================
// SHORTCUT HINTS COMPONENT DATA
// =============================================================================

export const KEYBOARD_SHORTCUTS = [
  { key: "Space", description: "Start/Stop recording", icon: "⏺" },
  { key: "Esc", description: "Close dialogs", icon: "✕" },
  { key: "R", description: "Redo previous question", icon: "↺" },
  { key: "S", description: "Toggle settings", icon: "⚙" },
  { key: "Q", description: "Toggle questions", icon: "☰" },
  { key: "B", description: "Toggle blur", icon: "◐" },
] as const;
