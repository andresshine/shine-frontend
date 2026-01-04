"use client";

/**
 * InterviewProvider
 * Manages interview state including current question, recording status, and navigation
 */

import React, { createContext, useState, useEffect } from "react";
import {
  InterviewSession,
  InterviewState,
  InterviewContextType,
} from "@/lib/types/interview";
import {
  calculateTimeEstimate,
  calculateProgress,
} from "@/lib/utils/sessionHelpers";
import { updateProgress } from "@/lib/api/client";

export const InterviewContext = createContext<InterviewContextType | undefined>(
  undefined
);

interface InterviewProviderProps {
  initialSession: InterviewSession;
  children: React.ReactNode;
}

export function InterviewProvider({
  initialSession,
  children,
}: InterviewProviderProps) {
  const [state, setState] = useState<InterviewState>({
    session: initialSession,
    currentQuestionIndex: 0,
    isRecording: false,
    completedQuestions: [],
    canRedoPrevious: false,
    evaluationStatus: 'idle',
    followUpText: undefined,
    aiScore: undefined,
    hasConsent: false,
  });

  // Sync progress to API whenever question index changes
  useEffect(() => {
    const sessionId = initialSession.session_id;
    const index = state.currentQuestionIndex;

    // Determine status based on progress
    let status: "pending" | "in_progress" | "completed" = "in_progress";

    if (index === 0 && state.completedQuestions.length === 0) {
      status = "in_progress"; // User has started
    } else if (state.completedQuestions.length === state.session.questions.length) {
      status = "completed"; // All questions done
    }

    // Update progress in database
    updateProgress(sessionId, index, status).catch((error) => {
      console.error("Failed to sync progress:", error);
    });
  }, [state.currentQuestionIndex, state.completedQuestions.length, initialSession.session_id, state.session.questions.length]);

  const startRecording = () => {
    setState((prev) => ({
      ...prev,
      isRecording: true,
    }));
  };

  const stopRecording = () => {
    setState((prev) => {
      const currentQuestion = prev.session.questions[prev.currentQuestionIndex];

      // Move to next question if not last
      if (prev.currentQuestionIndex < prev.session.questions.length - 1) {
        return {
          ...prev,
          isRecording: false,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          completedQuestions: [...prev.completedQuestions, currentQuestion.id],
          canRedoPrevious: true,
        };
      } else {
        // Last question completed
        return {
          ...prev,
          isRecording: false,
          completedQuestions: [...prev.completedQuestions, currentQuestion.id],
        };
      }
    });
  };

  const redoQuestion = () => {
    setState((prev) => {
      if (prev.currentQuestionIndex > 0 && prev.canRedoPrevious) {
        return {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex - 1,
          isRecording: false,
          canRedoPrevious: false,
        };
      }
      return prev;
    });
  };

  const goToNextQuestion = () => {
    setState((prev) => {
      if (prev.currentQuestionIndex < prev.session.questions.length - 1) {
        return {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          isRecording: false,
        };
      }
      return prev;
    });
  };

  const goToQuestion = (index: number) => {
    setState((prev) => {
      if (index >= 0 && index < prev.session.questions.length) {
        return {
          ...prev,
          currentQuestionIndex: index,
          isRecording: false,
        };
      }
      return prev;
    });
  };

  // AI Producer evaluation methods
  const setEvaluating = () => {
    setState((prev) => ({
      ...prev,
      evaluationStatus: 'evaluating',
      followUpText: undefined,
      aiScore: undefined,
    }));
  };

  const setFollowUp = (followUpText: string, score?: number) => {
    setState((prev) => ({
      ...prev,
      evaluationStatus: 'follow_up',
      followUpText,
      aiScore: score,
      isRecording: false,
    }));
  };

  const approveAnswer = (score?: number) => {
    setState((prev) => {
      const currentQuestion = prev.session.questions[prev.currentQuestionIndex];

      // Move to next question if not last
      if (prev.currentQuestionIndex < prev.session.questions.length - 1) {
        return {
          ...prev,
          evaluationStatus: 'idle',
          followUpText: undefined,
          aiScore: score,
          isRecording: false,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          completedQuestions: [...prev.completedQuestions, currentQuestion.id],
          canRedoPrevious: true,
        };
      } else {
        // Last question completed
        return {
          ...prev,
          evaluationStatus: 'idle',
          followUpText: undefined,
          aiScore: score,
          isRecording: false,
          completedQuestions: [...prev.completedQuestions, currentQuestion.id],
        };
      }
    });
  };

  const giveConsent = () => {
    setState((prev) => ({
      ...prev,
      hasConsent: true,
    }));
  };

  const progress = calculateProgress(
    state.currentQuestionIndex,
    state.session.questions.length
  );

  const timeEstimate = calculateTimeEstimate(
    state.session.questions.length - state.currentQuestionIndex
  );

  return (
    <InterviewContext.Provider
      value={{
        state,
        startRecording,
        stopRecording,
        redoQuestion,
        goToNextQuestion,
        goToQuestion,
        setEvaluating,
        setFollowUp,
        approveAnswer,
        giveConsent,
        progress,
        timeEstimate,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}
