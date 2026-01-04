"use client";

/**
 * AIFeedback Component
 * Displays AI Producer evaluation feedback and follow-up questions
 */

import { useInterview } from "@/lib/hooks/useInterview";
import { Sparkles } from "lucide-react";

export function AIFeedback() {
  const { state } = useInterview();
  const { evaluationStatus, followUpText, aiScore } = state;

  // Don't show anything if idle or evaluating
  if (evaluationStatus === 'idle' || evaluationStatus === 'evaluating') {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mb-6">
      {evaluationStatus === 'follow_up' && followUpText && (
        <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 border border-brand-primary/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Shine would like to know more
              </h3>

              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                {followUpText}
              </p>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="font-medium">AI Score:</span>
                  <span className="text-brand-primary font-semibold">
                    {aiScore || '--'}/100
                  </span>
                </div>
                <span className="text-gray-400">•</span>
                <span>Click "Record Follow-Up" to continue</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {evaluationStatus === 'approved' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                Great answer!
              </h3>

              <p className="text-green-700 dark:text-green-300 mb-3">
                Your response was comprehensive and well-structured.
              </p>

              {aiScore && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/40 rounded-full text-sm">
                  <span className="font-medium text-green-900 dark:text-green-100">Score:</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {aiScore}/100
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
