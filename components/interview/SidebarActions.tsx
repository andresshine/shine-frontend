"use client";

/**
 * SidebarActions Component
 * Contains redo button in sidebar footer
 */

import { RotateCcw } from "lucide-react";
import { useInterview } from "@/lib/hooks/useInterview";

export function SidebarActions() {
  const { state, redoQuestion } = useInterview();

  const canRedo = state.currentQuestionIndex > 0 && state.canRedoPrevious;

  return (
    <div className="p-6">
      {/* Redo Question Button */}
      <button
        onClick={redoQuestion}
        disabled={!canRedo}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-[var(--brand-radius)] bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark hover:border-border-light-strong dark:hover:border-border-dark-hover text-foreground-light-secondary dark:text-foreground-dark-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border-light dark:disabled:hover:border-border-dark"
        aria-label="Re-do previous question"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="text-sm font-medium">Re-do Question</span>
      </button>
    </div>
  );
}
