"use client";

/**
 * QuestionsList Component
 * Displays current and upcoming questions with active/inactive states
 */

import { useInterview } from "@/lib/hooks/useInterview";
import { Question } from "@/lib/types/interview";

interface QuestionItemProps {
  question: Question;
  number: number;
  isActive: boolean;
}

function QuestionItem({ question, number, isActive }: QuestionItemProps) {
  return (
    <div
      className={`p-4 rounded-[var(--brand-radius)] transition-all ${
        isActive
          ? "bg-brand-primary/5 dark:bg-brand-primary/10"
          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <p
        className={`font-normal text-gray-900 dark:text-white ${
          !isActive && "opacity-50"
        }`}
      >
        <span className="inline">{number}.</span> {question.text}
      </p>
    </div>
  );
}

export function QuestionsList() {
  const { state } = useInterview();
  const { questions } = state.session;
  const { currentQuestionIndex } = state;

  // Show 4 questions at a time (current + next 3)
  const visibleQuestions = questions.slice(
    currentQuestionIndex,
    currentQuestionIndex + 4
  );

  const remainingCount = questions.length - currentQuestionIndex;
  const showOverlay = currentQuestionIndex + 4 < questions.length;

  return (
    <div className="relative flex-1 px-8 overflow-hidden">
      <div className="flex flex-col gap-4">
        {visibleQuestions.map((question, relativeIndex) => {
          const actualIndex = currentQuestionIndex + relativeIndex;
          const isActive = relativeIndex === 0;

          return (
            <QuestionItem
              key={question.id}
              question={question}
              number={actualIndex + 1}
              isActive={isActive}
            />
          );
        })}
      </div>

      {/* Questions Remaining Text */}
      {showOverlay && (
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none">
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {remainingCount} questions remaining...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
