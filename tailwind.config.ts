import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // === LIGHT MODE COLORS (Warm Cream Clarity) ===
        background: {
          light: "#FFFFFF",                    // Pure white - app canvas
          "light-cream": "var(--card-bg-warm, #FAF9F6)",   // Primary warm cream
          "light-subtle": "var(--surface-hover, #FAF9F6)", // Barely-there warm (hover)
          dark: "#000000",                     // True black - cinematic canvas
        },
        foreground: {
          light: "rgb(18, 18, 20)",            // Near-black for headlines, main content
          "light-secondary": "rgb(87, 83, 78)", // Darker warm gray for better contrast
          "light-muted": "rgb(120, 113, 108)", // Warm gray for placeholders, timestamps
          dark: "rgba(255, 255, 255, 0.96)",   // 96% white for headings
          "dark-secondary": "rgba(255, 255, 255, 0.70)", // 70% white for metadata
          "dark-muted": "rgba(255, 255, 255, 0.60)",     // 60% white for descriptions
          "dark-subtle": "rgba(255, 255, 255, 0.50)",    // 50% white for placeholders
          "dark-faint": "rgba(255, 255, 255, 0.40)",     // 40% white for subtle labels
        },
        // === SURFACE COLORS (Warm only - no cool grays) ===
        card: {
          light: "#FFFFFF",                    // Pure white cards
          dark: "rgba(255, 255, 255, 0.03)",   // Very subtle surface (dark mode)
        },
        surface: {
          elevated: "rgba(255, 255, 255, 0.05)", // Slightly more visible (dark mode)
          "light-subtle": "var(--surface-subtle, #F5F3EF)", // Warm subtle surface
          "light-warm": "var(--card-bg-warm, #FAF9F6)",     // Primary warm surface
          "light-hover": "var(--surface-hover, #FAF9F6)",   // Warm hover state
        },
        // === BORDER COLORS ===
        border: {
          // Light mode borders
          light: "rgba(0, 0, 0, 0.12)",        // Standard card outlines
          "light-strong": "rgba(0, 0, 0, 0.08)", // Emphasized separators
          "light-subtle": "rgba(0, 0, 0, 0.06)", // Very light dividers
          // Dark mode borders (whisper-level)
          dark: "rgba(255, 255, 255, 0.06)",      // 6% white - barely visible
          "dark-hover": "rgba(255, 255, 255, 0.10)", // 10% white - gentle emphasis
          "dark-strong": "rgba(255, 255, 255, 0.08)", // 8% white - dividers
        },
        input: {
          light: "var(--card-bg-warm, #FAF9F6)", // Warm cream for inputs
          dark: "#1A1A1E",
        },
        muted: {
          DEFAULT: "var(--card-bg-warm, #FAF9F6)", // Warm cream (not cool gray)
          dark: "#1A1A1E",
          foreground: {
            light: "rgb(120, 113, 108)",       // Warm gray
            dark: "rgba(255, 255, 255, 0.60)",
          },
        },
        // === ACCENT COLORS (Cinematic Palette) ===
        accent: {
          lavender: "#8F84C2",         // Primary buttons, active states, progress
          gold: "#EAB36C",             // Shine gold - tips, premium highlights
          green: "#7BBF9A",            // Success states, growth metrics
          rose: "#FB7185",             // Secondary accent (legacy support)
        },
        // Brand colors (dynamic via CSS variables)
        brand: {
          primary: "var(--brand-primary, #8F84C2)",
          secondary: "var(--brand-secondary, #FB7185)",
          tertiary: "var(--brand-tertiary, #B8860B)",
        },
        // Legacy support
        gold: "#B8860B",
      },
      fontFamily: {
        sans: ["var(--brand-font-family, 'IBM Plex Sans')", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.02em",  // For question titles
        tight: "-0.01em",
        normal: "0",
        wide: "0.1em",       // For uppercase labels
      },
      fontSize: {
        xs: "0.75rem",    // 12px
        sm: "0.875rem",   // 14px
        base: "1rem",     // 16px
        lg: "1.125rem",   // 18px
        xl: "1.25rem",    // 20px
        "2xl": "1.5rem",  // 24px
        "3xl": "1.875rem", // 30px
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      spacing: {
        1: "0.25rem",   // 4px
        2: "0.5rem",    // 8px
        3: "0.75rem",   // 12px
        4: "1rem",      // 16px
        5: "1.25rem",   // 20px
        6: "1.5rem",    // 24px
        8: "2rem",      // 32px
        10: "2.5rem",   // 40px
        12: "3rem",     // 48px
      },
      borderRadius: {
        sm: "0.25rem",   // 4px
        DEFAULT: "0.5rem",    // 8px
        md: "0.5rem",    // 8px
        lg: "0.75rem",   // 12px
        xl: "1rem",      // 16px
        "2xl": "1.5rem", // 24px
        full: "9999px",
      },
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "200ms",
        slow: "300ms",
      },
      boxShadow: {
        // Light mode dual-layer shadows (tight inner + soft outer)
        sm: "0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02)",
        DEFAULT: "0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02)",
        md: "0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.02)",
        lg: "0 4px 6px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.02)",
        xl: "0 8px 12px rgba(0, 0, 0, 0.04), 0 16px 24px rgba(0, 0, 0, 0.02)",
        // No shadows in dark mode - use borders and gradients instead
        none: "none",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0" },
          "50%": { opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
