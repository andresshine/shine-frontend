"use client";

/**
 * ThemeProvider
 * Provides theme context (light/dark mode) with localStorage persistence
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeMode, ThemeContextType } from "@/lib/types/theme";

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

/**
 * Hook to access theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return {
    theme: context.mode,
    setTheme: context.setMode,
    toggleTheme: context.toggleTheme,
  };
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount (default to dark if no preference saved)
  useEffect(() => {
    setMounted(true);

    const saved = localStorage.getItem("themeMode");
    if (saved === "light" || saved === "dark") {
      setModeState(saved);
    }
    // Default is already dark, no need to check system preference
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(mode);

    // Save to localStorage
    localStorage.setItem("themeMode", mode);
  }, [mode, mounted]);

  const toggleTheme = () => {
    setModeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
