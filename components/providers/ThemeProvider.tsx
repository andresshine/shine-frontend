"use client";

/**
 * ThemeProvider
 * Provides theme context (light/dark mode) with localStorage persistence
 */

import React, { createContext, useEffect, useState } from "react";
import { ThemeMode, ThemeContextType } from "@/lib/types/theme";

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);

    const saved = localStorage.getItem("themeMode");
    if (saved === "light" || saved === "dark") {
      setModeState(saved);
    } else {
      // Check system preference
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        setModeState("dark");
      }
    }
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
