"use client";

/**
 * Interview Page
 * Main page for conducting video testimonial interviews
 * Route: /interview/[session_id]
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { InterviewProvider } from "@/components/providers/InterviewProvider";
import { QuestionsSidebar } from "@/components/interview/QuestionsSidebar";
import { MainContent } from "@/components/interview/MainContent";
import { BrandPanel } from "@/components/interview/BrandPanel";
import { ConsentOverlay } from "@/components/interview/ConsentOverlay";
import { CompletionOverlay } from "@/components/interview/CompletionOverlay";
import { getSessionData } from "@/lib/api/sessions";
import { InterviewSession } from "@/lib/types/interview";
import { useInterview } from "@/lib/hooks/useInterview";

// Inner component that has access to InterviewContext
function InterviewContent() {
  const router = useRouter();
  const [isBrandPanelOpen, setIsBrandPanelOpen] = useState(false);
  const { state, giveConsent } = useInterview();

  const handleConsent = () => {
    giveConsent();
  };

  const handleCancel = () => {
    // Navigate back to home or show message
    router.push('/');
  };

  const handleComplete = () => {
    // Redirect to shine.studio
    window.location.href = 'https://www.shine.studio';
  };

  // Check if interview is complete
  const isComplete = state.completedQuestions.length === state.session.questions.length;

  return (
    <>
      {/* Consent Overlay - shown when consent not given */}
      {!state.hasConsent && (
        <ConsentOverlay onAccept={handleConsent} onCancel={handleCancel} />
      )}

      {/* Completion Overlay - shown when all questions are done */}
      {state.hasConsent && isComplete && (
        <CompletionOverlay onDone={handleComplete} />
      )}

      <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors">
        <div className="flex flex-col md:flex-row md:h-screen">
          {/* Questions Sidebar */}
          <QuestionsSidebar
            onBrandPanelToggle={() => setIsBrandPanelOpen(true)}
          />

          {/* Main Content */}
          <MainContent />

          {/* Brand Customization Panel */}
          <BrandPanel
            isOpen={isBrandPanelOpen}
            onClose={() => setIsBrandPanelOpen(false)}
          />
        </div>
      </div>
    </>
  );
}

export default function InterviewPage() {
  const params = useParams();
  const sessionId = params.session_id as string;
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load session data from Supabase
  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        const data = await getSessionData(sessionId);
        if (data) {
          setSession(data);
        } else {
          setError("Session not found");
        }
      } catch (err) {
        console.error("Error loading session:", err);
        setError("Failed to load session");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">
            Loading interview session...
          </p>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || "Session Not Found"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            The interview session &quot;{sessionId}&quot; could not be found.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">
            Try one of these demo sessions:
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link
                href="/interview/session_abc123"
                className="text-brand-primary hover:underline"
              >
                session_abc123
              </Link>
            </li>
            <li>
              <Link
                href="/interview/session_xyz789"
                className="text-brand-primary hover:underline"
              >
                session_xyz789
              </Link>
            </li>
            <li>
              <Link
                href="/interview/session_demo"
                className="text-brand-primary hover:underline"
              >
                session_demo
              </Link>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <InterviewProvider initialSession={session}>
        <InterviewContent />
      </InterviewProvider>
    </ThemeProvider>
  );
}
