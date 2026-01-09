"use client";

/**
 * CompanyBranding Component
 * Displays company logo/initial, name, and brand customization button
 */

import Image from "next/image";
import { Palette } from "lucide-react";
import { useInterview } from "@/lib/hooks/useInterview";
import { useBrandCustomization } from "@/lib/hooks/useBrandCustomization";
import { useTheme } from "@/lib/hooks/useTheme";

interface CompanyBrandingProps {
  onBrandPanelToggle: () => void;
}

export function CompanyBranding({ onBrandPanelToggle }: CompanyBrandingProps) {
  const { state } = useInterview();
  const [customization] = useBrandCustomization();
  const { mode } = useTheme();
  const { company_name, company_logo } = state.session;

  // Get first letter of company name for initial
  const initial = company_name.charAt(0).toUpperCase();

  // Get brandmark based on theme with fallback logic
  const getBrandmarkSrc = () => {
    // Priority: customization brandmark > session company_logo > initial
    const brandmark = mode === 'dark'
      ? customization.brandmarkDark || customization.brandmarkLight
      : customization.brandmarkLight || customization.brandmarkDark;

    return brandmark || company_logo;
  };

  const logoSrc = getBrandmarkSrc();

  return (
    <div className="px-4 md:px-6 py-4 border-b border-border-light dark:border-gold/10">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center bg-[#F5F3EF] dark:bg-[rgba(255,255,255,0.08)]">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={`${company_name} logo`}
                width={40}
                height={40}
                className="w-full h-full object-contain p-1"
                unoptimized
              />
            ) : (
              <span className="text-2xl font-bold text-foreground-light-secondary dark:text-white">
                {initial}
              </span>
            )}
          </div>
          <h2 className="text-foreground-light dark:text-white font-medium">
            {company_name}
          </h2>
        </div>

        {/* Brand Customization Button */}
        <button
          onClick={onBrandPanelToggle}
          className="p-2 rounded-lg bg-[#FAF9F6] border border-[rgba(0,0,0,0.08)] hover:bg-[#F5F3EF] dark:bg-[rgba(255,255,255,0.06)] dark:border-[rgba(255,255,255,0.08)] dark:hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          aria-label="Open brand customization panel"
          title="Brand Customization"
        >
          <Palette className="w-4 h-4 text-foreground-light-secondary dark:text-foreground-dark-muted" />
        </button>
      </div>

      <p className="text-sm text-foreground-light-muted dark:text-foreground-dark-subtle">
        Powered by Shine ✨
      </p>
    </div>
  );
}
