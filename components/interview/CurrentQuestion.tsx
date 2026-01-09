"use client";

/**
 * CurrentQuestion Component
 *
 * Full-width display of the current question with category tag,
 * progress dots, and contextual tips/feedback during recording.
 *
 * Features:
 * - Category tag showing question type (Discovery, Problem, etc.)
 * - Progress dots showing question completion status
 * - Pre-recording tips with lightbulb icon
 * - Real-time recording feedback with consistent styling
 * - Transcript preview during recording
 *
 * @author Shine Studio
 */

import { memo } from "react";
import { Check, Lightbulb, Mic, MessageCircle } from "lucide-react";
import { useInterview } from "@/lib/hooks/useInterview";
import { UseAnswerEvaluationResult } from "@/lib/hooks/useAnswerEvaluation";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Map question intent to display category */
const INTENT_CATEGORY_MAP: Record<string, string> = {
  discovery: "Discovery",
  problem: "Problem",
  solution: "Solution",
  results: "Results",
  recommendation: "Recommendation",
  closing: "Closing",
};

// =============================================================================
// UTILITIES
// =============================================================================

/** Get display category from question intent */
function getCategoryFromIntent(intent?: string): string {
  if (!intent) return "Discovery";
  return INTENT_CATEGORY_MAP[intent.toLowerCase()] || intent;
}

// =============================================================================
// TYPES
// =============================================================================

interface CurrentQuestionProps {
  /** Answer evaluation hook instance - must be shared with RecordingControls */
  answerEvaluation: UseAnswerEvaluationResult;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const CurrentQuestion = memo(function CurrentQuestion({
  answerEvaluation,
}: CurrentQuestionProps) {
  const { state } = useInterview();
  const { questions } = state.session;
  const { currentQuestionIndex, completedQuestions, isRecording } = state;

  const currentQuestion = questions[currentQuestionIndex];
  const currentCategory = getCategoryFromIntent(currentQuestion?.intent);

  if (!currentQuestion) return null;

  const totalQuestions = questions.length;

  return (
    <div className="w-full py-2 lg:py-3 xl:py-4 flex-shrink-0">
      <div className="bg-card-light dark:bg-card-dark rounded-[var(--brand-radius)] p-4 lg:p-5 xl:p-6 2xl:p-8 border border-border-light dark:border-border-dark card-top-light">
        {/* Category Tag + Question Progress Row */}
        <div className="flex items-center justify-between mb-3 lg:mb-4 xl:mb-5 2xl:mb-6">
          {/* Neutral category chip - works with any brand */}
          <span className="inline-block px-2.5 py-1 lg:px-3 lg:py-1.5 xl:px-4 xl:py-2 text-[11px] lg:text-xs xl:text-sm font-semibold rounded-lg bg-[#F5F3EF] dark:bg-[rgba(255,255,255,0.08)] text-foreground-light dark:text-foreground-dark-secondary border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)]">
            {currentCategory}
          </span>

          {/* Question Progress with Dots - uses brand secondary color */}
          <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
            <span className="text-xs lg:text-sm xl:text-base text-foreground-light dark:text-foreground-dark-secondary opacity-70">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <div className="flex items-center gap-1 lg:gap-1.5 xl:gap-2">
              {questions.map((question, index) => {
                const isCompleted = completedQuestions.includes(question.id);
                const isCurrent = index === currentQuestionIndex;
                const isActive = isCompleted || isCurrent;
                return (
                  <div
                    key={question.id}
                    className={`w-1.5 h-1.5 lg:w-2 lg:h-2 xl:w-2.5 xl:h-2.5 rounded-full transition-all ${
                      !isActive ? 'bg-[#E7E4DF] dark:bg-[rgba(255,255,255,0.15)]' : ''
                    }`}
                    style={isActive ? {
                      backgroundColor: 'var(--brand-secondary, #fb7185)',
                    } : undefined}
                  />
                );
              })}
            </div>
          </div>
        </div>
        {/* Question Text - Large and prominent */}
        <p className="question-text text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-semibold tracking-tighter text-foreground-light dark:text-foreground-dark leading-snug lg:leading-relaxed">
          {currentQuestion.text}
        </p>

        {/* Tips & Feedback - Below the question */}
        <div className="mt-4 pt-3 lg:mt-5 lg:pt-4 xl:mt-6 xl:pt-5 border-t border-border-light dark:border-border-dark">
          {isRecording ? (
            <>
              {/* Recording feedback - matches tip styling with icons */}
              <div className="flex items-start gap-2 lg:gap-3">
                {answerEvaluation.evaluation?.isComplete ? (
                  <>
                    <Check className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 mt-0.5 text-accent-green" />
                    <p className="text-sm lg:text-base xl:text-lg leading-snug lg:leading-relaxed text-accent-green opacity-90">
                      <span className="font-semibold mr-1">Great answer!</span>
                      You can stop recording when ready.
                    </p>
                  </>
                ) : answerEvaluation.evaluation?.followUp ? (
                  <>
                    <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 mt-0.5" style={{ color: '#EAB36C' }} />
                    <p className="text-sm lg:text-base xl:text-lg leading-snug lg:leading-relaxed text-foreground-light dark:text-foreground-dark-subtle opacity-80">
                      <span className="font-semibold mr-1">Follow-up:</span>
                      {answerEvaluation.evaluation.followUp}
                    </p>
                  </>
                ) : answerEvaluation.transcript.length > 0 ? (
                  <>
                    <Lightbulb className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 mt-0.5" style={{ color: '#EAB36C' }} />
                    <p className="text-sm lg:text-base xl:text-lg leading-snug lg:leading-relaxed text-foreground-light dark:text-foreground-dark-subtle opacity-80">
                      <span className="font-semibold mr-1">Keep going...</span>
                      Add more detail for a complete answer.
                    </p>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 mt-0.5" style={{ color: '#EAB36C' }} />
                    <p className="text-sm lg:text-base xl:text-lg leading-snug lg:leading-relaxed text-foreground-light dark:text-foreground-dark-subtle opacity-80">
                      <span className="font-semibold mr-1">Recording:</span>
                      Start speaking to answer the question.
                    </p>
                  </>
                )}
              </div>

            </>
          ) : (
            /* Tips shown when not recording */
            <div className="flex items-start gap-2 lg:gap-3">
              <Lightbulb className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 mt-0.5" style={{ color: '#EAB36C' }} />
              <p className="text-sm lg:text-base xl:text-lg leading-snug lg:leading-relaxed text-foreground-light dark:text-foreground-dark-subtle opacity-80">
                <span className="font-semibold mr-1">Tip:</span>
                Look at the camera, speak clearly, and include specific metrics when possible.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
