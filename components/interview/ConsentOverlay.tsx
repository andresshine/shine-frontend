"use client";

/**
 * ConsentOverlay Component
 * Shows recording consent form before interview starts
 */

import { useState } from "react";
import { Shield, Video, Mic, Monitor, Square, FileText, Trash2 } from "lucide-react";
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
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        className="bg-card-light dark:bg-[#141417] rounded-[var(--brand-radius)] max-w-2xl w-full p-8 border border-border-light dark:border-[rgba(255,255,255,0.08)]"
        style={{
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-[var(--brand-radius)] flex items-center justify-center bg-[#F5F3EF] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)]">
            <Shield className="w-6 h-6 text-foreground-light-secondary dark:text-foreground-dark-muted" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground-light dark:text-foreground-dark">
              Recording Consent
            </h2>
            <p className="text-sm text-foreground-light-secondary dark:text-foreground-dark-muted">
              We need your permission to begin
            </p>
          </div>
        </div>

        {/* We'll record section */}
        <div className="rounded-[var(--brand-radius)] p-5 mb-4 bg-[#FAF9F6] dark:bg-[rgba(255,255,255,0.03)] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
          <h3 className="text-foreground-light dark:text-foreground-dark font-semibold mb-4 text-sm uppercase tracking-wide">
            We&apos;ll record
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-foreground-light-secondary dark:text-foreground-dark-muted text-sm">
              <Video className="w-4 h-4 flex-shrink-0 text-foreground-light-muted dark:text-foreground-dark-subtle" />
              <span>Video and audio of this interview</span>
            </li>
            <li className="flex items-center gap-3 text-foreground-light-secondary dark:text-foreground-dark-muted text-sm">
              <Mic className="w-4 h-4 flex-shrink-0 text-foreground-light-muted dark:text-foreground-dark-subtle" />
              <span>Your spoken responses to our questions</span>
            </li>
            <li className="flex items-center gap-3 text-foreground-light-secondary dark:text-foreground-dark-muted text-sm">
              <Monitor className="w-4 h-4 flex-shrink-0 text-foreground-light-muted dark:text-foreground-dark-subtle" />
              <span>Screen sharing (if enabled)</span>
            </li>
          </ul>
        </div>

        {/* Your rights section */}
        <div className="rounded-[var(--brand-radius)] p-5 mb-6 bg-[#FAF9F6] dark:bg-[rgba(255,255,255,0.03)] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
          <h3 className="text-foreground-light dark:text-foreground-dark font-semibold mb-4 text-sm uppercase tracking-wide">
            Your rights
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-foreground-light-secondary dark:text-foreground-dark-muted text-sm">
              <Square className="w-4 h-4 flex-shrink-0 text-foreground-light-muted dark:text-foreground-dark-subtle" />
              <span>Stop the recording at any time</span>
            </li>
            <li className="flex items-center gap-3 text-foreground-light-secondary dark:text-foreground-dark-muted text-sm">
              <FileText className="w-4 h-4 flex-shrink-0 text-foreground-light-muted dark:text-foreground-dark-subtle" />
              <span>We&apos;ll ask for separate consent before publishing</span>
            </li>
            <li className="flex items-center gap-3 text-foreground-light-secondary dark:text-foreground-dark-muted text-sm">
              <Trash2 className="w-4 h-4 flex-shrink-0 text-foreground-light-muted dark:text-foreground-dark-subtle" />
              <span>Request deletion within 30 days</span>
            </li>
          </ul>
        </div>

        {/* Consent checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer group p-4 rounded-[var(--brand-radius)] border border-transparent hover:bg-[#FAF9F6] dark:hover:bg-[rgba(255,255,255,0.02)] transition-all">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-2 border-border-light dark:border-border-dark bg-transparent cursor-pointer"
            style={{ accentColor: 'var(--brand-primary)' }}
          />
          <span className="text-sm text-foreground-light-secondary dark:text-foreground-dark-muted group-hover:text-foreground-light dark:group-hover:text-foreground-dark transition-colors leading-relaxed">
            I consent to this interview being recorded and processed by Shine for the purpose of creating marketing materials.
          </span>
        </label>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3.5 rounded-[var(--brand-radius)] bg-transparent hover:bg-[#FAF9F6] dark:hover:bg-[rgba(255,255,255,0.04)] border border-border-light dark:border-[rgba(255,255,255,0.1)] text-foreground-light-secondary dark:text-foreground-dark-secondary hover:text-foreground-light dark:hover:text-foreground-dark transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={!isChecked}
            className="flex-1 px-6 py-3.5 rounded-[var(--brand-radius)] text-white font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: brandButton.getPrimaryStyle(),
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isChecked
                ? '0 4px 16px rgba(143, 132, 194, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : 'none',
            }}
          >
            Accept & Start Recording
          </button>
        </div>
      </div>
    </div>
  );
}
