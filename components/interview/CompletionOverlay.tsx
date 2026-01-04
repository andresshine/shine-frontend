"use client";

/**
 * CompletionOverlay Component
 * Shows completion message when interview is finished
 */

import { CheckCircle } from "lucide-react";
import { useBrandButton } from "@/lib/utils/brandButton";

interface CompletionOverlayProps {
  onDone: () => void;
}

export function CompletionOverlay({ onDone }: CompletionOverlayProps) {
  const brandButton = useBrandButton();
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-12 shadow-2xl border border-gray-200 dark:border-gray-800 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-500" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          That's it — you're all done! 🎉
        </h2>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          Thank you so much for taking the time to share your story with us. Customers like you are what make partnerships truly special — you don't just use our product, you help shape it, champion it, and inspire others with your success.
        </p>

        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          We're so grateful to work with partners who take collaboration to the next level. Your insights mean the world to us! 💙
        </p>

        {/* Done Button */}
        <button
          onClick={onDone}
          className="w-full px-8 py-3 rounded-[var(--brand-radius)] text-white font-medium transition-all hover:opacity-90"
          style={{ background: brandButton.getPrimaryStyle() }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
