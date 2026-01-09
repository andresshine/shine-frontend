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
      // Shine cinematic gradient (135deg angle for premium feel)
      return `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColorBrightness(primaryColor, -15)} 100%)`;
    } else if (variant === 'secondary') {
      return `linear-gradient(135deg, ${secondaryColor} 0%, ${adjustColorBrightness(secondaryColor, -15)} 100%)`;
    } else {
      return `linear-gradient(135deg, ${tertiaryColor} 0%, ${adjustColorBrightness(tertiaryColor, -15)} 100%)`;
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
 * Adjust color brightness
 * @param color - Hex color string
 * @param percent - Percentage to adjust (-100 to 100)
 */
function adjustColorBrightness(color: string, percent: number): string {
  // Handle rgb/rgba format
  if (color.startsWith('rgb')) {
    return color; // Return as-is for simplicity
  }

  // Handle hex format
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const adjust = (val: number) => Math.min(255, Math.max(0, val + (val * percent / 100)));

  const newR = Math.round(adjust(r)).toString(16).padStart(2, '0');
  const newG = Math.round(adjust(g)).toString(16).padStart(2, '0');
  const newB = Math.round(adjust(b)).toString(16).padStart(2, '0');

  return `#${newR}${newG}${newB}`;
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
