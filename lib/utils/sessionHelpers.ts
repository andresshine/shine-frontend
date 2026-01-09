/**
 * Session Helper Utilities
 * Functions for working with interview sessions
 */

import { InterviewSession } from "@/lib/types/interview";

/**
 * Calculate time estimate for remaining questions
 * Assumes 1-1.5 minutes per question
 */
export function calculateTimeEstimate(questionsRemaining: number): {
  min: number;
  max: number;
} {
  return {
    min: questionsRemaining * 1,
    max: Math.ceil(questionsRemaining * 1.5),
  };
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(
  currentIndex: number,
  totalQuestions: number
): number {
  return ((currentIndex + 1) / totalQuestions) * 100;
}

/**
 * Validate interview session data
 */
export function isValidSession(session: any): session is InterviewSession {
  return (
    session &&
    typeof session.session_id === "string" &&
    typeof session.company_name === "string" &&
    Array.isArray(session.questions) &&
    session.questions.length > 0 &&
    typeof session.created_at === "string"
  );
}
