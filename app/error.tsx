"use client";

/**
 * Global Error Page
 *
 * Shown when an unhandled error occurs in the app.
 * This is a Next.js App Router error boundary.
 */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to console
    console.error("Global error:", error);

    // TODO: Send to error tracking service (Sentry, etc.)
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0A0A0C] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-semibold text-[#121214] dark:text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-[#787168] dark:text-[rgba(255,255,255,0.6)] mb-6">
          We encountered an unexpected error. Don&apos;t worry, your progress has been saved.
        </p>

        {/* Error ID for support */}
        {error.digest && (
          <p className="text-xs text-[#787168]/60 dark:text-[rgba(255,255,255,0.4)] mb-6">
            Error ID: {error.digest}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px]
                       rounded-xl text-white font-semibold
                       transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #8f84c2 0%, #7269a8 100%)",
              boxShadow: "0 4px 16px rgba(143, 132, 194, 0.25)",
            }}
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px]
                       rounded-xl font-semibold
                       bg-white dark:bg-[#141417]
                       border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]
                       text-[#121214] dark:text-white
                       hover:border-[rgba(0,0,0,0.2)] dark:hover:border-[rgba(255,255,255,0.2)]
                       transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
        </div>

        {/* Support Link */}
        <p className="mt-6 text-sm text-[#787168]/80 dark:text-[rgba(255,255,255,0.4)]">
          If this keeps happening, please{" "}
          <a
            href="mailto:hello@shine.studio"
            className="text-[#8f84c2] hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}
