"use client";

/**
 * Interview Page
 * Main page for conducting video testimonial interviews
 * Route: /interview/[session_id]
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeProvider, useTheme } from "@/components/providers/ThemeProvider";
import { InterviewProvider } from "@/components/providers/InterviewProvider";
import { InterviewHeader } from "@/components/interview/InterviewHeader";
import { QuestionsSidebar } from "@/components/interview/QuestionsSidebar";
import { MainContent } from "@/components/interview/MainContent";
import { BrandPanel } from "@/components/interview/BrandPanel";
import { ConsentOverlay } from "@/components/interview/ConsentOverlay";
import { CompletionOverlay } from "@/components/interview/CompletionOverlay";
import { OfflineBanner } from "@/components/interview/OfflineBanner";
import { InterviewSkeleton } from "@/components/interview/InterviewSkeleton";
import { Footer } from "@/components/Footer";
import { getSessionData } from "@/lib/api/sessions";
import { InterviewSession } from "@/lib/types/interview";
import { useInterview } from "@/lib/hooks/useInterview";


// Inner component that has access to InterviewContext
function InterviewContent() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isBrandPanelOpen, setIsBrandPanelOpen] = useState(false);
  const [isQuestionsExpanded, setIsQuestionsExpanded] = useState(false);
  const [isRimLightEnabled, setIsRimLightEnabled] = useState(() => {
    // Load from localStorage, default to true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shine-rim-light');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const { state, giveConsent } = useInterview();
  const prevCompletedCountRef = useRef(state.completedQuestions.length);

  // Calculate if rim light is currently active (recording + enabled + dark mode)
  const isRimLightActive = state.isRecording && isRimLightEnabled && theme === 'dark';

  // Auto-close questions sidebar when rim light becomes active
  useEffect(() => {
    if (isRimLightActive && isQuestionsExpanded) {
      setIsQuestionsExpanded(false);
    }
  }, [isRimLightActive, isQuestionsExpanded]);

  // Persist rim light preference
  const toggleRimLight = () => {
    setIsRimLightEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('shine-rim-light', String(newValue));
      return newValue;
    });
  };

  // Auto-expand sidebar briefly when a question is completed
  useEffect(() => {
    if (state.completedQuestions.length > prevCompletedCountRef.current && state.completedQuestions.length < state.session.questions.length) {
      setIsQuestionsExpanded(true);
      const timer = setTimeout(() => setIsQuestionsExpanded(false), 2500);
      return () => clearTimeout(timer);
    }
    prevCompletedCountRef.current = state.completedQuestions.length;
  }, [state.completedQuestions.length, state.session.questions.length]);

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
      {/* Offline Banner - shows when connection is lost */}
      <OfflineBanner />

      {/* Consent Overlay - shown when consent not given */}
      {!state.hasConsent && (
        <ConsentOverlay onAccept={handleConsent} onCancel={handleCancel} />
      )}

      {/* Completion Overlay - shown when all questions are done */}
      {state.hasConsent && isComplete && (
        <CompletionOverlay onDone={handleComplete} />
      )}

      <div className="h-screen bg-background-light dark:bg-background-dark transition-colors duration-700 flex flex-col overflow-hidden">
        {/* Interview Header */}
        <InterviewHeader />

        {/* Main Content Area - Questions List + Video */}
        <div
          className="interview-content flex-1 flex flex-col lg:flex-row min-h-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 gap-4 sm:gap-6 justify-center overflow-visible"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {/* Questions Panel - Left Side (Collapsible) */}
          <QuestionsSidebar
            isExpanded={isQuestionsExpanded}
            onToggle={() => setIsQuestionsExpanded(!isQuestionsExpanded)}
          />

          {/* Video Content - Centered, shifts right when sidebar opens */}
          <MainContent
            onBrandPanelToggle={() => setIsBrandPanelOpen(true)}
            onQuestionsToggle={() => setIsQuestionsExpanded(!isQuestionsExpanded)}
            isQuestionsExpanded={isQuestionsExpanded}
            isRimLightEnabled={isRimLightEnabled}
            onToggleRimLight={toggleRimLight}
          />

          {/* Brand Customization Panel */}
          <BrandPanel
            isOpen={isBrandPanelOpen}
            onClose={() => setIsBrandPanelOpen(false)}
          />
        </div>

        {/* Footer with Powered by Shine + Legal Links */}
        <div className="fixed bottom-4 right-4 flex items-center gap-3 text-xs">
          <Footer compact />
          <span className="text-[#787168]/30 dark:text-[rgba(255,255,255,0.2)]">·</span>
          <a
            href="https://www.shine.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground-light-muted/50 dark:text-foreground-dark-faint/50 hover:text-foreground-light-muted dark:hover:text-foreground-dark-faint transition-colors"
          >
            Powered by Shine
          </a>
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

  // Loading state - use skeleton for better UX
  if (loading) {
    return <InterviewSkeleton />;
  }

  // Error or not found state
  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground-light dark:text-white mb-2">
            {error || "Session Not Found"}
          </h1>
          <p className="text-foreground-light-muted dark:text-foreground-dark-muted">
            The interview session &quot;{sessionId}&quot; could not be found.
          </p>
          <p className="text-sm text-foreground-light-muted dark:text-foreground-dark-subtle mt-4">
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
