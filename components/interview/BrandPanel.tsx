"use client";

/**
 * BrandPanel Component
 * Slide-out panel for brand customization (colors, fonts, button styles, etc.)
 */

import { useState } from "react";
import Image from "next/image";
import { X, Upload, ChevronDown } from "lucide-react";
import { useBrandCustomization } from "@/lib/hooks/useBrandCustomization";
import { useBrandButton } from "@/lib/utils/brandButton";

interface BrandPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Raleway",
  "Playfair Display",
];

const RADIUS_OPTIONS = [
  { label: "Small", value: 4 },
  { label: "Medium", value: 8 },
  { label: "Large", value: 12 },
  { label: "X-Large", value: 16 },
  { label: "2X-Large", value: 24 },
];

export function BrandPanel({ isOpen, onClose }: BrandPanelProps) {
  const [customization, updateCustomization, resetCustomization] =
    useBrandCustomization();
  const brandButton = useBrandButton();
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [tempColors, setTempColors] = useState({
    primary: customization.primaryColor,
    secondary: customization.secondaryColor,
    tertiary: customization.tertiaryColor,
  });
  const [brandmarkLight, setBrandmarkLight] = useState<string | undefined>(
    customization.brandmarkLight
  );
  const [brandmarkDark, setBrandmarkDark] = useState<string | undefined>(
    customization.brandmarkDark
  );

  const handleColorChange = (type: "primary" | "secondary" | "tertiary", value: string) => {
    let color = value.trim();
    if (!color.startsWith("#")) {
      color = "#" + color;
    }

    setTempColors((prev) => ({ ...prev, [type]: color }));

    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      if (type === "primary") {
        updateCustomization({ primaryColor: color });
      } else if (type === "secondary") {
        updateCustomization({ secondaryColor: color });
      } else {
        updateCustomization({ tertiaryColor: color });
      }
    }
  };

  const handleBrandmarkUpload = async (
    mode: 'light' | 'dark',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG, SVG, or JPG file.');
      return;
    }

    // Validate file size (2MB = 2 * 1024 * 1024 bytes)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      return;
    }

    // Convert to base64 data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      if (mode === 'light') {
        setBrandmarkLight(dataUrl);
        updateCustomization({ brandmarkLight: dataUrl });
      } else {
        setBrandmarkDark(dataUrl);
        updateCustomization({ brandmarkDark: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBrandmarkRemove = (mode: 'light' | 'dark') => {
    if (mode === 'light') {
      setBrandmarkLight(undefined);
      updateCustomization({ brandmarkLight: undefined });
    } else {
      setBrandmarkDark(undefined);
      updateCustomization({ brandmarkDark: undefined });
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all customizations to default?")) {
      resetCustomization();
      setTempColors({
        primary: "#8F84C2",
        secondary: "#FB7185",
        tertiary: "#D19648",
      });
      setBrandmarkLight(undefined);
      setBrandmarkDark(undefined);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity z-[999] ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 w-[400px] max-w-[90vw] h-screen bg-white dark:bg-[#0A0A0C] dark:border-l dark:border-gray-700 shadow-xl transition-transform duration-200 z-[1000] flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-labelledby="brandPanelTitle"
        aria-modal="true"
      >
        {/* Panel Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2
              id="brandPanelTitle"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              Brand & Theme
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Close brand customization panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Customize your testimonial page branding and appearance
          </p>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Brand Assets Section */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Brand Assets
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Brandmark (Light Mode)
              </label>

              {brandmarkLight ? (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-4">
                    <Image
                      src={brandmarkLight}
                      alt="Light mode brandmark preview"
                      width={64}
                      height={64}
                      className="w-16 h-16 object-contain bg-gray-100 dark:bg-gray-900 rounded"
                      unoptimized
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Light mode logo uploaded
                      </p>
                    </div>
                    <button
                      onClick={() => handleBrandmarkRemove('light')}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/jpg"
                    onChange={(e) => handleBrandmarkUpload('light', e)}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-brand-primary hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 transition-colors bg-gray-50 dark:bg-gray-800">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      SVG, PNG, or JPG (max. 2MB)
                    </p>
                  </div>
                </label>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Brandmark (Dark Mode)
              </label>

              {brandmarkDark ? (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-4">
                    <Image
                      src={brandmarkDark}
                      alt="Dark mode brandmark preview"
                      width={64}
                      height={64}
                      className="w-16 h-16 object-contain bg-gray-100 dark:bg-gray-900 rounded"
                      unoptimized
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Dark mode logo uploaded
                      </p>
                    </div>
                    <button
                      onClick={() => handleBrandmarkRemove('dark')}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/jpg"
                    onChange={(e) => handleBrandmarkUpload('dark', e)}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-brand-primary hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10 transition-colors bg-gray-50 dark:bg-gray-800">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      SVG, PNG, or JPG (max. 2MB)
                    </p>
                  </div>
                </label>
              )}
            </div>
          </section>

          {/* Color System Section */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Color System
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Primary
                </label>
                <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus-within:border-brand-primary transition-colors">
                  <div className="relative flex-shrink-0">
                    <input
                      type="color"
                      value={tempColors.primary}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="absolute inset-0 w-10 h-10 opacity-0 cursor-pointer"
                    />
                    <div
                      className="w-10 h-10 rounded-md border-2 border-white dark:border-gray-800 shadow-[0_0_0_1px_#e5e7eb] dark:shadow-[0_0_0_1px_#374151] cursor-pointer"
                      style={{ backgroundColor: tempColors.primary }}
                    />
                  </div>
                  <input
                    type="text"
                    value={tempColors.primary}
                    onChange={(e) => handleColorChange("primary", e.target.value)}
                    className="flex-1 border-none bg-transparent text-sm font-mono text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Secondary
                </label>
                <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus-within:border-brand-primary transition-colors">
                  <div className="relative flex-shrink-0">
                    <input
                      type="color"
                      value={tempColors.secondary}
                      onChange={(e) => handleColorChange("secondary", e.target.value)}
                      className="absolute inset-0 w-10 h-10 opacity-0 cursor-pointer"
                    />
                    <div
                      className="w-10 h-10 rounded-md border-2 border-white dark:border-gray-800 shadow-[0_0_0_1px_#e5e7eb] dark:shadow-[0_0_0_1px_#374151] cursor-pointer"
                      style={{ backgroundColor: tempColors.secondary }}
                    />
                  </div>
                  <input
                    type="text"
                    value={tempColors.secondary}
                    onChange={(e) => handleColorChange("secondary", e.target.value)}
                    className="flex-1 border-none bg-transparent text-sm font-mono text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Tertiary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Tertiary
                </label>
                <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus-within:border-brand-primary transition-colors">
                  <div className="relative flex-shrink-0">
                    <input
                      type="color"
                      value={tempColors.tertiary}
                      onChange={(e) => handleColorChange("tertiary", e.target.value)}
                      className="absolute inset-0 w-10 h-10 opacity-0 cursor-pointer"
                    />
                    <div
                      className="w-10 h-10 rounded-md border-2 border-white dark:border-gray-800 shadow-[0_0_0_1px_#e5e7eb] dark:shadow-[0_0_0_1px_#374151] cursor-pointer"
                      style={{ backgroundColor: tempColors.tertiary }}
                    />
                  </div>
                  <input
                    type="text"
                    value={tempColors.tertiary}
                    onChange={(e) => handleColorChange("tertiary", e.target.value)}
                    className="flex-1 border-none bg-transparent text-sm font-mono text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Button Style Section */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Button Style
            </h3>

            <div className="flex gap-3">
              <div
                onClick={() => updateCustomization({ buttonStyle: "solid" })}
                className={`flex-1 p-4 border-2 rounded-lg text-center cursor-pointer transition-all ${
                  customization.buttonStyle === "solid"
                    ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                }`}
              >
                <div
                  className="w-full h-10 rounded-md mb-2 flex items-center justify-center text-white text-sm font-medium"
                  style={{ background: customization.primaryColor }}
                >
                  Button
                </div>
                <p
                  className={`text-sm font-medium ${
                    customization.buttonStyle === "solid"
                      ? "text-brand-primary"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  Solid
                </p>
              </div>

              <div
                onClick={() => updateCustomization({ buttonStyle: "gradient" })}
                className={`flex-1 p-4 border-2 rounded-lg text-center cursor-pointer transition-all ${
                  customization.buttonStyle === "gradient"
                    ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                }`}
              >
                <div
                  className="w-full h-10 rounded-md mb-2 flex items-center justify-center text-white text-sm font-medium"
                  style={{
                    background: `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`,
                  }}
                >
                  Button
                </div>
                <p
                  className={`text-sm font-medium ${
                    customization.buttonStyle === "gradient"
                      ? "text-brand-primary"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  Gradient
                </p>
              </div>
            </div>
          </section>

          {/* Corner Radius Section */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Card Corner Radius
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {RADIUS_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  onClick={() => updateCustomization({ cornerRadius: option.value })}
                  className={`aspect-square border-2 rounded-md cursor-pointer transition-all flex flex-col items-center justify-center p-2 ${
                    customization.cornerRadius === option.value
                      ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                  }`}
                >
                  <div
                    className="w-6 h-6 mb-1"
                    style={{
                      backgroundColor: customization.primaryColor,
                      borderRadius: `${option.value}px`,
                    }}
                  />
                  <p
                    className={`text-[10px] font-medium text-center ${
                      customization.cornerRadius === option.value
                        ? "text-brand-primary"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {option.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Typography Section */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Typography
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Font Family
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowFontDropdown(!showFontDropdown)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                >
                  <span className="text-gray-900 dark:text-white">
                    {customization.fontFamily}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      showFontDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showFontDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10 custom-scrollbar">
                    {FONT_OPTIONS.map((font) => (
                      <div
                        key={font}
                        onClick={() => {
                          updateCustomization({ fontFamily: font });
                          setShowFontDropdown(false);
                        }}
                        className={`p-3 cursor-pointer transition-colors ${
                          customization.fontFamily === font
                            ? "bg-brand-primary/10 text-brand-primary font-medium"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        }`}
                        style={{ fontFamily: `'${font}', sans-serif` }}
                      >
                        {font}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Panel Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
            >
              Reset to Default
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-[var(--brand-radius)] text-white font-medium hover:opacity-90 transition-opacity"
              style={{ background: brandButton.getPrimaryStyle() }}
            >
              Apply Changes
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
