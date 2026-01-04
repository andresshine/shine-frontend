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
        // Light mode colors
        background: {
          light: "#FAF9F7",
          dark: "#0A0A0C",
        },
        foreground: {
          light: "#030213",
          dark: "#ffffff",
        },
        card: {
          light: "#ffffff",
          dark: "#141417",
        },
        border: {
          light: "rgba(0, 0, 0, 0.1)",
          dark: "#2a2a2d",
        },
        input: {
          light: "#f3f3f5",
          dark: "#1a1a1d",
        },
        muted: {
          DEFAULT: "#ececf0",
          dark: "#2a2a2d",
          foreground: {
            light: "#717182",
            dark: "#9ca3af",
          },
        },
        // Brand colors
        brand: {
          primary: "var(--brand-primary, #8F84C2)",
          secondary: "var(--brand-secondary, #FB7185)",
          tertiary: "var(--brand-tertiary, #D19648)",
        },
        // Additional semantic colors
        gold: "#D19648",
      },
      fontFamily: {
        sans: ["var(--brand-font-family, 'Inter')", "sans-serif"],
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
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
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
