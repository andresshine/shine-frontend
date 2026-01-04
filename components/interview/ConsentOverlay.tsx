"use client";

/**
 * ConsentOverlay Component
 * Shows recording consent form before interview starts
 */

import { useState } from "react";
import { useBrandButton } from "@/lib/utils/brandButton";

interface ConsentOverlayProps {
  onAccept: () => void;
  onCancel: () => void;
}

export function ConsentOverlay({ onAccept, onCancel }: ConsentOverlayProps) {
  const [isChecked, setIsChecked] = useState(false);
  const brandButton = useBrandButton();

  const handleAccept = () => {
    if (isChecked) {
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-gray-200 dark:border-gray-800">
        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Recording Consent
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Before we begin the interview, we need your permission to record this session.
        </p>

        {/* We'll record section */}
        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 mb-4">
          <h3 className="text-gray-900 dark:text-white font-medium mb-3">We'll record:</h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Video and audio of this interview</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Your responses to our questions</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Screen sharing (if enabled)</span>
            </li>
          </ul>
        </div>

        {/* Your rights section */}
        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 mb-6">
          <h3 className="text-gray-900 dark:text-white font-medium mb-3">Your rights:</h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>You can stop the recording at any time</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>We'll ask for separate consent before publishing</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>You can request deletion within 30 days</span>
            </li>
          </ul>
        </div>

        {/* Consent checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-brand-primary focus:ring-brand-primary focus:ring-offset-0"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
            I consent to this interview being recorded and processed by Shine for the purpose of creating marketing materials.
          </span>
        </label>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={!isChecked}
            className="flex-1 px-6 py-3 rounded-[var(--brand-radius)] text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: brandButton.getPrimaryStyle() }}
          >
            Accept & Start Recording
          </button>
        </div>
      </div>
    </div>
  );
}
