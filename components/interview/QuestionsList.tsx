"use client";

/**
 * QuestionsList Component
 * Displays upcoming questions with numbers and completed questions with durations
 * (Current question is now displayed separately in CurrentQuestion component)
 */

import { Check } from "lucide-react";
import { useInterview } from "@/lib/hooks/useInterview";

export function QuestionsList() {
  const { state } = useInterview();
  const { questions } = state.session;
  const { currentQuestionIndex } = state;

  // Upcoming questions (all remaining after current)
  const upcomingQuestions = questions.slice(currentQuestionIndex + 1);

  // Completed questions (before current)
  const completedQuestionsList = questions.slice(0, currentQuestionIndex);

  return (
    <div className="flex flex-col gap-4">
      {/* Up Next Section - Cinematic styling */}
      {upcomingQuestions.length > 0 && (
        <div className="rounded-[var(--brand-radius)] p-6 bg-[#F5F3EF] dark:bg-[rgba(255,255,255,0.02)] border border-[#E7E4DF] dark:border-[rgba(255,255,255,0.06)]">
          <p className="text-xs font-bold text-foreground-light dark:text-foreground-dark-faint uppercase tracking-wide mb-5 opacity-70">
            Up Next
          </p>
          <div className="flex flex-col gap-4">
            {upcomingQuestions.map((question, index) => {
              const questionNumber = currentQuestionIndex + 2 + index;
              return (
                <div
                  key={question.id}
                  className="flex items-center gap-3.5 group cursor-default"
                >
                  {/* Question Number */}
                  <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold leading-none text-center text-foreground-light dark:text-foreground-dark-subtle bg-[#E7E4DF] dark:bg-[rgba(255,255,255,0.08)]">
                    {questionNumber}
                  </span>
                  {/* Question Text */}
                  <p className="flex-1 text-base font-medium text-foreground-light dark:text-foreground-dark-muted leading-snug opacity-90">
                    {question.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Section - Cinematic styling */}
      {completedQuestionsList.length > 0 && (
        <div className="rounded-[var(--brand-radius)] p-6 bg-[#F5F3EF] dark:bg-[rgba(255,255,255,0.02)] border border-[#E7E4DF] dark:border-[rgba(255,255,255,0.06)]">
          <p className="text-xs font-bold text-foreground-light dark:text-foreground-dark-faint uppercase tracking-wide mb-5 opacity-70">
            Completed
          </p>
          <div className="flex flex-col gap-4">
            {completedQuestionsList.map((question) => (
              <div
                key={question.id}
                className="flex items-center gap-3.5"
              >
                {/* Checkmark */}
                <span
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' }}
                >
                  <Check className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                </span>
                {/* Question Text */}
                <p className="flex-1 text-base text-foreground-light-muted dark:text-foreground-dark-subtle leading-snug line-through opacity-70">
                  {question.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
