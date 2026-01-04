"use client";

/**
 * QuestionDisplay Component
 * Displays current question with intent/context bullets
 */

import { useInterview } from "@/lib/hooks/useInterview";

export function QuestionDisplay() {
  const { state } = useInterview();
  const currentQuestion =
    state.session.questions[state.currentQuestionIndex];

  return (
    <div className="flex-1 overflow-y-auto md:overflow-y-visible px-4 md:px-8 py-4">
      <div className="mb-4 md:mb-6">
        {/* Question Title */}
        <h1 className="text-xl md:text-3xl font-medium text-gray-900 dark:text-white mb-2 md:mb-4">
          {currentQuestion.text}
        </h1>
      </div>
    </div>
  );
}
