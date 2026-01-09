"use client";

/**
 * Unsupported Browser Component
 *
 * Full-page display shown when the browser doesn't support required features.
 * Provides information about what's missing and recommendations for browsers.
 */

import { AlertCircle, Chrome, Globe, ExternalLink } from "lucide-react";

interface UnsupportedBrowserProps {
  /** List of missing features */
  missingFeatures: string[];
  /** Detected browser name */
  browserName: string;
  /** Detected browser version */
  browserVersion: string;
  /** Whether on mobile */
  isMobile: boolean;
  /** Recommended browser for this platform */
  recommendedBrowser: string;
}

const BROWSER_DOWNLOAD_LINKS: Record<string, string> = {
  Chrome: "https://www.google.com/chrome/",
  Firefox: "https://www.mozilla.org/firefox/",
  Safari: "https://www.apple.com/safari/",
  Edge: "https://www.microsoft.com/edge",
  "Chrome for Android": "https://play.google.com/store/apps/details?id=com.android.chrome",
};

export function UnsupportedBrowser({
  missingFeatures,
  browserName,
  browserVersion,
  isMobile,
  recommendedBrowser,
}: UnsupportedBrowserProps) {
  const downloadLink = BROWSER_DOWNLOAD_LINKS[recommendedBrowser.split(" or ")[0]] || BROWSER_DOWNLOAD_LINKS.Chrome;

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0A0A0C] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-semibold text-[#121214] dark:text-white mb-2">
            Browser Not Supported
          </h1>
          <p className="text-[#787168] dark:text-[rgba(255,255,255,0.6)]">
            Your browser is missing features needed for video recording.
          </p>
        </div>

        {/* Current Browser Info */}
        <div className="bg-white dark:bg-[#141417] rounded-[var(--brand-radius)] p-4 mb-4 border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-[#787168] dark:text-[rgba(255,255,255,0.6)]" />
            <div>
              <p className="text-sm font-medium text-[#121214] dark:text-white">
                Current Browser
              </p>
              <p className="text-sm text-[#787168] dark:text-[rgba(255,255,255,0.6)]">
                {browserName} {browserVersion} {isMobile ? "(Mobile)" : "(Desktop)"}
              </p>
            </div>
          </div>
        </div>

        {/* Missing Features */}
        <div className="bg-white dark:bg-[#141417] rounded-[var(--brand-radius)] p-4 mb-6 border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
          <h2 className="text-sm font-semibold text-[#121214] dark:text-white mb-3">
            Missing Features
          </h2>
          <ul className="space-y-2">
            {missingFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-red-500">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendation */}
        <div className="bg-[#8f84c2]/10 dark:bg-[#8f84c2]/20 rounded-[var(--brand-radius)] p-4 mb-6">
          <h2 className="text-sm font-semibold text-[#121214] dark:text-white mb-2">
            Recommended Solution
          </h2>
          <p className="text-sm text-[#787168] dark:text-[rgba(255,255,255,0.7)] mb-4">
            {isMobile
              ? `Please open this page in ${recommendedBrowser} for the best experience.`
              : `We recommend using ${recommendedBrowser} for recording video testimonials.`}
          </p>

          {!isMobile && (
            <a
              href={downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px]
                         rounded-xl text-white font-semibold
                         transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #8f84c2 0%, #7269a8 100%)",
                boxShadow: "0 4px 16px rgba(143, 132, 194, 0.25)",
              }}
            >
              <Chrome className="w-5 h-5" />
              Download {recommendedBrowser.split(" or ")[0]}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Alternative Options */}
        <div className="text-center text-sm text-[#787168] dark:text-[rgba(255,255,255,0.5)]">
          <p className="mb-2">Other supported browsers:</p>
          <p>Chrome 60+, Firefox 60+, Safari 11+, Edge 79+</p>
        </div>

        {/* Support Link */}
        <p className="mt-6 text-center text-sm text-[#787168]/80 dark:text-[rgba(255,255,255,0.4)]">
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
