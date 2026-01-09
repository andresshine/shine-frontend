"use client";

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Also reports errors to console (can be extended to send to error tracking service).
 */

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Store error info for display
    this.setState({ errorInfo });

    // TODO: Send to error tracking service (Sentry, etc.)
    // Example:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark mb-2">
              Something went wrong
            </h1>
            <p className="text-foreground-light-secondary dark:text-foreground-dark-muted mb-6">
              We encountered an unexpected error. Your recording progress has been saved.
            </p>

            {/* Error Details (collapsible in production) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 text-left bg-card-light dark:bg-card-dark rounded-[var(--brand-radius)] p-4 border border-border-light dark:border-border-dark">
                <summary className="cursor-pointer text-sm font-medium text-foreground-light dark:text-foreground-dark">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px]
                           rounded-[var(--brand-radius)] text-white font-semibold
                           transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, var(--brand-primary) 0%, #7269a8 100%)",
                  boxShadow: "0 4px 16px rgba(143, 132, 194, 0.25)",
                }}
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Page
              </button>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px]
                           rounded-[var(--brand-radius)] font-semibold
                           bg-card-light dark:bg-card-dark
                           border border-border-light dark:border-border-dark
                           text-foreground-light dark:text-foreground-dark
                           hover:border-border-light-strong dark:hover:border-border-dark-hover
                           transition-colors"
              >
                <Home className="w-5 h-5" />
                Go Home
              </Link>
            </div>

            {/* Support Link */}
            <p className="mt-6 text-sm text-foreground-light-muted dark:text-foreground-dark-faint">
              If this keeps happening, please{" "}
              <a
                href="mailto:hello@shine.studio"
                className="text-[var(--brand-primary)] hover:underline"
              >
                contact support
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
