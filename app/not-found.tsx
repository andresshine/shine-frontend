"use client";

/**
 * Custom 404 Page
 *
 * Shown when a user navigates to a page that doesn't exist.
 * Provides helpful navigation options back to the app.
 * Respects user's dark/light mode preference.
 */

import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

function NotFoundContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0A0A0C] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Text */}
        <h1 className="text-6xl font-bold text-[#8f84c2] mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-[#121214] dark:text-white mb-2">
          Page not found
        </h2>
        <p className="text-[#787168] dark:text-[rgba(255,255,255,0.6)] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px]
                       rounded-xl font-semibold
                       bg-white dark:bg-[#141417]
                       border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]
                       text-[#121214] dark:text-white
                       hover:border-[rgba(0,0,0,0.2)] dark:hover:border-[rgba(255,255,255,0.2)]
                       transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px]
                       rounded-xl text-white font-semibold
                       transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #8f84c2 0%, #7269a8 100%)",
              boxShadow: "0 4px 16px rgba(143, 132, 194, 0.25)",
            }}
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
        </div>

        {/* Help Link */}
        <p className="mt-8 text-sm text-[#787168]/80 dark:text-[rgba(255,255,255,0.4)]">
          Need help?{" "}
          <a
            href="mailto:hello@shine.studio"
            className="text-[#8f84c2] hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <ThemeProvider>
      <NotFoundContent />
    </ThemeProvider>
  );
}
