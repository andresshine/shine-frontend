/**
 * Brand Button Utility
 * Provides utilities for applying brand-aware button styling based on customization
 */

import { BrandCustomization } from "@/lib/types/interview";
import { useBrandCustomization } from "@/lib/hooks/useBrandCustomization";

/**
 * Generate button background style based on brand customization
 * @param customization - Brand customization object
 * @param variant - Button color variant (primary, secondary, tertiary)
 * @returns CSS background value (gradient or solid color)
 */
export function getBrandButtonStyle(
  customization: BrandCustomization,
  variant: 'primary' | 'secondary' | 'tertiary' = 'primary'
): string {
  const { buttonStyle, primaryColor, secondaryColor, tertiaryColor } = customization;

  if (buttonStyle === 'gradient') {
    if (variant === 'primary') {
      return `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})`;
    } else if (variant === 'secondary') {
      return `linear-gradient(to bottom right, ${secondaryColor}, ${secondaryColor})`;
    } else {
      return `linear-gradient(to bottom right, ${tertiaryColor}, ${tertiaryColor})`;
    }
  } else {
    // Solid style
    if (variant === 'primary') {
      return primaryColor;
    } else if (variant === 'secondary') {
      return secondaryColor;
    } else {
      return tertiaryColor;
    }
  }
}

/**
 * Custom hook for brand-aware button styling
 * @returns Object with helper functions to get button styles for each variant
 */
export function useBrandButton() {
  const [customization] = useBrandCustomization();

  return {
    getPrimaryStyle: () => getBrandButtonStyle(customization, 'primary'),
    getSecondaryStyle: () => getBrandButtonStyle(customization, 'secondary'),
    getTertiaryStyle: () => getBrandButtonStyle(customization, 'tertiary'),
    customization,
  };
}
