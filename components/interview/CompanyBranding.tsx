"use client";

/**
 * CompanyBranding Component
 * Displays company logo/initial, name, and brand customization button
 */

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
    <div className="p-5 border-b border-border-light dark:border-gold/10">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={`${company_name} logo`}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-600 dark:text-white">
                {initial}
              </span>
            )}
          </div>
          <h2 className="text-gray-900 dark:text-white font-medium">
            {company_name}
          </h2>
        </div>

        {/* Brand Customization Button */}
        <button
          onClick={onBrandPanelToggle}
          className="p-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
          aria-label="Open brand customization panel"
          title="Brand Customization"
        >
          <Palette className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-500">
        Powered by Shine ✨
      </p>
    </div>
  );
}
