/**
 * Theme Type Definitions
 * Defines the structure for theme management (light/dark mode)
 */

export type ThemeMode = "light" | "dark";

export interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}
