"use client";

/**
 * VirtualBackgroundPicker Component
 *
 * Allows users to select virtual background mode and customize settings.
 * Supports blur, solid colors, and custom images.
 *
 * @author Shine Studio
 */

import { memo, useCallback } from "react";
import { Sparkles, Circle, ImageIcon, X } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

type VirtualBackgroundMode = "none" | "blur" | "color" | "image";

interface VirtualBackgroundPickerProps {
  /** Current background mode */
  mode: VirtualBackgroundMode;
  /** Callback when mode changes */
  onModeChange: (mode: VirtualBackgroundMode) => void;
  /** Current background color (when mode is "color") */
  color: string;
  /** Callback when color changes */
  onColorChange: (color: string) => void;
  /** Current background image URL (when mode is "image") */
  imageUrl: string | null;
  /** Callback when image changes */
  onImageChange: (url: string | null) => void;
  /** Whether picker is disabled */
  disabled?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Preset background colors */
const PRESET_COLORS = [
  "#1a1a1e", // Dark gray (default)
  "#0f172a", // Slate
  "#1e3a5f", // Navy
  "#1a4d3e", // Forest
  "#4a1942", // Plum
  "#3d2914", // Brown
  "#f5f5f4", // Light gray
  "#fef3c7", // Cream
];

/** Preset background images */
const PRESET_IMAGES = [
  { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80", label: "Office" },
  { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1920&q=80", label: "Modern" },
  { url: "https://images.unsplash.com/photo-1505409628601-edc9af17fce6?w=1920&q=80", label: "Nature" },
  { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=80", label: "Abstract" },
];

// =============================================================================
// COMPONENT
// =============================================================================

export const VirtualBackgroundPicker = memo(function VirtualBackgroundPicker({
  mode,
  onModeChange,
  color,
  onColorChange,
  imageUrl,
  onImageChange,
  disabled = false,
}: VirtualBackgroundPickerProps) {
  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        onImageChange(url);
        onModeChange("image");
      }
    },
    [onImageChange, onModeChange]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-3">
      {/* Mode Selection */}
      <div className="text-[11px] font-semibold tracking-wide text-foreground-light-muted dark:text-foreground-dark-faint uppercase">
        Virtual Background
      </div>

      <div className="grid grid-cols-4 gap-2">
        {/* None */}
        <button
          onClick={() => onModeChange("none")}
          disabled={disabled}
          className={`
            flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all
            ${mode === "none"
              ? "border-[var(--brand-primary)] bg-[rgba(143,132,194,0.1)]"
              : "border-border-light dark:border-border-dark hover:border-border-light-strong dark:hover:border-border-dark-hover"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <X className="w-5 h-5 text-foreground-light-muted dark:text-foreground-dark-subtle" />
          <span className="text-[10px] text-foreground-light-secondary dark:text-foreground-dark-secondary">
            None
          </span>
        </button>

        {/* Blur */}
        <button
          onClick={() => onModeChange("blur")}
          disabled={disabled}
          className={`
            flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all
            ${mode === "blur"
              ? "border-[var(--brand-primary)] bg-[rgba(143,132,194,0.1)]"
              : "border-border-light dark:border-border-dark hover:border-border-light-strong dark:hover:border-border-dark-hover"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <Sparkles className="w-5 h-5 text-foreground-light-muted dark:text-foreground-dark-subtle" />
          <span className="text-[10px] text-foreground-light-secondary dark:text-foreground-dark-secondary">
            Blur
          </span>
        </button>

        {/* Color */}
        <button
          onClick={() => onModeChange("color")}
          disabled={disabled}
          className={`
            flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all
            ${mode === "color"
              ? "border-[var(--brand-primary)] bg-[rgba(143,132,194,0.1)]"
              : "border-border-light dark:border-border-dark hover:border-border-light-strong dark:hover:border-border-dark-hover"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <Circle
            className="w-5 h-5"
            style={{ color, fill: color }}
          />
          <span className="text-[10px] text-foreground-light-secondary dark:text-foreground-dark-secondary">
            Color
          </span>
        </button>

        {/* Image */}
        <button
          onClick={() => onModeChange("image")}
          disabled={disabled}
          className={`
            flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all
            ${mode === "image"
              ? "border-[var(--brand-primary)] bg-[rgba(143,132,194,0.1)]"
              : "border-border-light dark:border-border-dark hover:border-border-light-strong dark:hover:border-border-dark-hover"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <ImageIcon className="w-5 h-5 text-foreground-light-muted dark:text-foreground-dark-subtle" />
          <span className="text-[10px] text-foreground-light-secondary dark:text-foreground-dark-secondary">
            Image
          </span>
        </button>
      </div>

      {/* Color Presets (when color mode is selected) */}
      {mode === "color" && (
        <div className="space-y-2">
          <div className="text-[10px] text-foreground-light-muted dark:text-foreground-dark-faint">
            Choose color
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                onClick={() => onColorChange(presetColor)}
                disabled={disabled}
                className={`
                  w-8 h-8 rounded-lg border-2 transition-all
                  ${color === presetColor
                    ? "border-[var(--brand-primary)] scale-110"
                    : "border-transparent hover:scale-105"
                  }
                `}
                style={{ backgroundColor: presetColor }}
                title={presetColor}
              />
            ))}
            {/* Custom color input */}
            <label className="relative w-8 h-8 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark hover:border-border-light-strong dark:hover:border-border-dark-hover cursor-pointer overflow-hidden">
              <input
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={disabled}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-foreground-light-muted dark:text-foreground-dark-subtle">+</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Image Selection (when image mode is selected) */}
      {mode === "image" && (
        <div className="space-y-2">
          <div className="text-[10px] text-foreground-light-muted dark:text-foreground-dark-faint">
            Choose image
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_IMAGES.map((preset) => (
              <button
                key={preset.url}
                onClick={() => onImageChange(preset.url)}
                disabled={disabled}
                className={`
                  relative h-16 rounded-lg overflow-hidden border-2 transition-all
                  ${imageUrl === preset.url
                    ? "border-[var(--brand-primary)]"
                    : "border-transparent hover:border-border-light-strong dark:hover:border-border-dark-hover"
                  }
                `}
              >
                <img
                  src={preset.url}
                  alt={preset.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-1 left-2 text-[10px] text-white font-medium">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>

          {/* Custom upload */}
          <label className="flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-border-light dark:border-border-dark hover:border-border-light-strong dark:hover:border-border-dark-hover cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled}
            />
            <ImageIcon className="w-4 h-4 text-foreground-light-muted dark:text-foreground-dark-subtle" />
            <span className="text-xs text-foreground-light-secondary dark:text-foreground-dark-secondary">
              Upload custom image
            </span>
          </label>
        </div>
      )}
    </div>
  );
});
