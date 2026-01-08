"use client";

/**
 * SidebarActions Component
 * Contains theme toggle and redo button in sidebar footer
 */

import { Moon, Sun, RotateCcw } from "lucide-react";
import { useTheme } from "@/lib/hooks/useTheme";
import { useInterview } from "@/lib/hooks/useInterview";

export function SidebarActions() {
  const { mode, toggleTheme } = useTheme();
  const { state, redoQuestion } = useInterview();

  const canRedo = state.currentQuestionIndex > 0 && state.canRedoPrevious;

  return (
    <div className="p-8 pt-4 border-t border-border-light dark:border-gold/10">
      <div className="flex gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle light/dark mode"
        >
          {mode === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Redo Question Button */}
        <button
          onClick={redoQuestion}
          disabled={!canRedo}
          className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
          aria-label="Re-do previous question"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-medium">Re-do Question</span>
        </button>
      </div>
    </div>
  );
}
