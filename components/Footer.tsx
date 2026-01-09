"use client";

/**
 * Footer Component
 *
 * Minimal footer with legal links (Privacy Policy, Terms of Service).
 * Designed to be unobtrusive while meeting compliance requirements.
 */

interface FooterProps {
  /** Show compact version (single line) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function Footer({ compact = false, className = "" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer className={`text-center text-xs text-[#787168]/70 dark:text-[rgba(255,255,255,0.4)] ${className}`}>
        <a
          href="https://shine.studio/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#8f84c2] transition-colors"
        >
          Privacy
        </a>
        <span className="mx-2">·</span>
        <a
          href="https://shine.studio/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#8f84c2] transition-colors"
        >
          Terms
        </a>
      </footer>
    );
  }

  return (
    <footer className={`py-6 border-t border-border-light dark:border-border-dark ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-[#787168] dark:text-[rgba(255,255,255,0.5)]">
            © {currentYear} Shine Studio. All rights reserved.
          </p>

          {/* Legal Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://shine.studio/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#787168] dark:text-[rgba(255,255,255,0.5)]
                         hover:text-[#8f84c2] transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://shine.studio/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#787168] dark:text-[rgba(255,255,255,0.5)]
                         hover:text-[#8f84c2] transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="mailto:hello@shine.studio"
              className="text-sm text-[#787168] dark:text-[rgba(255,255,255,0.5)]
                         hover:text-[#8f84c2] transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Inline legal links for use in forms or tight spaces
 */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-[#787168]/70 dark:text-[rgba(255,255,255,0.4)] ${className}`}>
      By continuing, you agree to our{" "}
      <a
        href="https://shine.studio/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#8f84c2] hover:underline"
      >
        Terms of Service
      </a>{" "}
      and{" "}
      <a
        href="https://shine.studio/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#8f84c2] hover:underline"
      >
        Privacy Policy
      </a>
      .
    </p>
  );
}
