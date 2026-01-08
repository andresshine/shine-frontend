"use client";

/**
 * QuestionsList Component
 * Displays current question prominently and upcoming questions
 */

import { useInterview } from "@/lib/hooks/useInterview";
import { useBrandCustomization } from "@/lib/hooks/useBrandCustomization";
import { Question } from "@/lib/types/interview";

interface QuestionItemProps {
  question: Question;
  isActive: boolean;
  isRecording?: boolean;
}

function QuestionItem({ question, isActive }: QuestionItemProps) {
  return (
    <div
      className={`p-4 rounded-[var(--brand-radius)] transition-all ${
        isActive
          ? "bg-brand-primary/5 dark:bg-brand-primary/10 border-2 border-brand-primary/30"
          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      }`}
    >
      <p
        className={`font-normal text-sm text-gray-900 dark:text-white ${
          !isActive && "opacity-60"
        }`}
      >
        {question.text}
      </p>
    </div>
  );
}

export function QuestionsList() {
  const { state } = useInterview();
  const [customization] = useBrandCustomization();
  const { questions } = state.session;
  const { currentQuestionIndex, isRecording } = state;

  // Current question
  const currentQuestion = questions[currentQuestionIndex];

  // Next 2 questions only
  const upcomingQuestions = questions.slice(
    currentQuestionIndex + 1,
    currentQuestionIndex + 3
  );

  return (
    <div className="relative flex-1 px-8 overflow-hidden">
      {/* Current Question */}
      {currentQuestion && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            {/* Recording Indicator */}
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                isRecording ? "animate-pulse" : ""
              }`}
              style={{
                backgroundColor: isRecording
                  ? customization.secondaryColor  // Red when recording
                  : "#22c55e",                    // Green when idle
              }}
            />
            <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              Current Question
            </p>
          </div>
          <QuestionItem
            question={currentQuestion}
            isActive={true}
          />
        </div>
      )}

      {/* Up Next */}
      {upcomingQuestions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            Up Next
          </p>
          <div className="flex flex-col gap-3">
            {upcomingQuestions.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                isActive={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
