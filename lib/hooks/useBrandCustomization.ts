/**
 * useBrandCustomization Hook
 * Manage brand customization with localStorage persistence
 */

import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { BrandCustomization } from "@/lib/types/interview";

const DEFAULT_CUSTOMIZATION: BrandCustomization = {
  brandmarkLight: undefined,
  brandmarkDark: undefined,
  primaryColor: "#8F84C2",
  secondaryColor: "#FB7185",
  tertiaryColor: "#D19648",
  buttonStyle: "solid",
  cornerRadius: 16,
  fontFamily: "Inter",
};

export function useBrandCustomization(
  initial?: BrandCustomization
): [
  BrandCustomization,
  (customization: Partial<BrandCustomization>) => void,
  () => void
] {
  const [customization, setCustomization] = useLocalStorage<BrandCustomization>(
    "brandCustomization",
    initial || DEFAULT_CUSTOMIZATION
  );

  // Apply customization to CSS variables
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--brand-primary", customization.primaryColor);
    root.style.setProperty(
      "--brand-primary-rgb",
      hexToRgb(customization.primaryColor)
    );
    root.style.setProperty("--brand-secondary", customization.secondaryColor);
    root.style.setProperty(
      "--brand-secondary-rgb",
      hexToRgb(customization.secondaryColor)
    );
    root.style.setProperty("--brand-tertiary", customization.tertiaryColor);
    root.style.setProperty(
      "--brand-radius",
      `${customization.cornerRadius}px`
    );
    root.style.setProperty(
      "--brand-font-family",
      `'${customization.fontFamily}', sans-serif`
    );
  }, [customization]);

  const updateCustomization = (updates: Partial<BrandCustomization>) => {
    setCustomization((prev) => ({ ...prev, ...updates }));
  };

  const resetCustomization = () => {
    setCustomization(DEFAULT_CUSTOMIZATION);
  };

  return [customization, updateCustomization, resetCustomization];
}

// Helper function to convert hex to RGB string
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
      result[3],
      16
    )}`;
  }
  return "0, 0, 0";
}
