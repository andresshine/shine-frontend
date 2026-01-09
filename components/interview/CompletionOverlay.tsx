"use client";

/**
 * CompletionOverlay Component
 * Shows completion message when interview is finished
 */

import { CheckCircle, Sparkles } from "lucide-react";
import { useBrandButton } from "@/lib/utils/brandButton";

interface CompletionOverlayProps {
  onDone: () => void;
}

export function CompletionOverlay({ onDone }: CompletionOverlayProps) {
  const brandButton = useBrandButton();
  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        className="bg-card-light dark:bg-[#141417] rounded-[var(--brand-radius)] max-w-2xl w-full p-12 border border-border-light dark:border-[rgba(255,255,255,0.08)] text-center"
        style={{
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(123, 191, 154, 0.2) 0%, rgba(123, 191, 154, 0.1) 100%)',
              border: '1px solid rgba(123, 191, 154, 0.3)',
            }}
          >
            <CheckCircle className="w-10 h-10 text-accent-green" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold tracking-tight text-foreground-light dark:text-foreground-dark mb-4 flex items-center justify-center gap-2">
          <span>That&apos;s it — you&apos;re all done!</span>
          <Sparkles className="w-6 h-6 text-accent-gold" />
        </h2>

        {/* Message */}
        <p className="text-foreground-light-secondary dark:text-foreground-dark-muted mb-4 leading-relaxed">
          Thank you so much for taking the time to share your story with us. Customers like you are what make partnerships truly special — you don&apos;t just use our product, you help shape it, champion it, and inspire others with your success.
        </p>

        <p className="text-foreground-light-secondary dark:text-foreground-dark-muted mb-8 leading-relaxed">
          We&apos;re so grateful to work with partners who take collaboration to the next level. Your insights mean the world to us!
        </p>

        {/* Done Button - Cinematic styling */}
        <button
          onClick={onDone}
          className="w-full px-8 py-3.5 rounded-[var(--brand-radius)] text-white font-semibold transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: brandButton.getPrimaryStyle(),
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 16px rgba(143, 132, 194, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
