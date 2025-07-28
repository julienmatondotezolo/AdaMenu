/* eslint-disable no-unused-vars */
import React from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { ProjectFont } from "../../types/menumaker";

interface FontSelectorProps {
  value: string;
  onChange: (fontFamily: string) => void;
  className?: string;
  placeholder?: string;
  // New props for font properties
  fontWeight?: string;
  onFontWeightChange?: (weight: string) => void;
  fontStyle?: "normal" | "italic";
  onFontStyleChange?: (style: "normal" | "italic") => void;
  letterSpacing?: number;
  onLetterSpacingChange?: (spacing: number) => void;
  lineHeight?: number;
  onLineHeightChange?: (lineHeight: number) => void;
  showAdvancedOptions?: boolean;
}

export function FontSelector({
  value,
  onChange,
  className = "",
  placeholder = "Select font...",
  fontWeight = "400",
  onFontWeightChange,
  fontStyle = "normal",
  onFontStyleChange,
  letterSpacing = 0,
  onLetterSpacingChange,
  lineHeight = 1.2,
  onLineHeightChange,
  showAdvancedOptions = true,
}: FontSelectorProps) {
  const { getAllAvailableFonts, ensureFontLoaded } = useMenuMakerStore();

  const availableFonts = getAllAvailableFonts();

  const handleFontChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFontFamily = event.target.value;

    onChange(selectedFontFamily);

    // Reset all font properties to defaults when font family changes
    if (onFontWeightChange) {
      onFontWeightChange("400");
    }
    if (onFontStyleChange) {
      onFontStyleChange("normal");
    }
    if (onLetterSpacingChange) {
      onLetterSpacingChange(0);
    }
    if (onLineHeightChange) {
      onLineHeightChange(1.2);
    }

    // Ensure the font is loaded for immediate use
    const selectedFont = availableFonts.find((font) => font.familyName === selectedFontFamily);

    if (selectedFont) {
      await ensureFontLoaded(selectedFont);
    }
  };

  // Get available weights for the selected font
  const getAvailableWeights = (): string[] => {
    const selectedFont = availableFonts.find((font) => font.familyName === value);

    if (!selectedFont || !selectedFont.variants.length) {
      return ["400", "700"]; // Default weights
    }

    // Enhanced parsing for Google Font variants
    const weights = new Set<string>();

    selectedFont.variants.forEach((variant) => {
      // Handle Google Font variant formats
      if (variant === "regular") {
        weights.add("400");
      } else if (variant === "italic") {
        weights.add("400"); // Regular italic maps to 400 weight
      } else if (variant.includes("italic")) {
        // Extract weight from italic variants (e.g., "300italic" -> "300")
        const weight = variant.replace("italic", "");

        if (weight && /^\d+$/.test(weight)) {
          weights.add(weight);
        }
      } else if (/^\d+$/.test(variant)) {
        // Pure numeric weight (e.g., "300", "400", "700")
        weights.add(variant);
      }
    });

    // Convert Set to Array and sort
    const weightArray = Array.from(weights).sort((a, b) => parseInt(a) - parseInt(b));

    // Ensure we always have at least 400 and 700 as fallbacks
    if (weightArray.length === 0) {
      return ["400", "700"];
    }

    // Add 400 if not present (most fonts should have regular)
    if (!weightArray.includes("400")) {
      weightArray.push("400");
      weightArray.sort((a, b) => parseInt(a) - parseInt(b));
    }

    return weightArray;
  };

  // Check if italic style is available for the selected font
  const isItalicAvailable = (): boolean => {
    const selectedFont = availableFonts.find((font) => font.familyName === value);

    if (!selectedFont || !selectedFont.variants.length) {
      return true; // Assume available for system fonts
    }

    return selectedFont.variants.some((variant) => variant.includes("italic"));
  };

  // Group fonts by type for better organization
  const fontsByType = availableFonts.reduce(
    (acc, font) => {
      if (!acc[font.type]) {
        acc[font.type] = [];
      }
      acc[font.type].push(font);
      return acc;
    },
    {} as Record<string, ProjectFont[]>,
  );

  return (
    <div className="space-y-3">
      {/* Font Family Selector */}
      <div>
        <label htmlFor="font-family-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Font Family
        </label>
        <select
          id="font-family-select"
          value={value}
          onChange={handleFontChange}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent ${className}`}
        >
          {placeholder && <option value="">{placeholder}</option>}

          {/* Google Fonts */}
          {fontsByType.google && fontsByType.google.length > 0 && (
            <optgroup label="Google Fonts">
              {fontsByType.google.map((font) => (
                <option key={font.id} value={font.familyName}>
                  {font.displayName}
                  {!font.isLoaded && " (Loading...)"}
                </option>
              ))}
            </optgroup>
          )}

          {/* Custom Fonts */}
          {fontsByType.custom && fontsByType.custom.length > 0 && (
            <optgroup label="Custom Fonts">
              {fontsByType.custom.map((font) => (
                <option key={font.id} value={font.familyName}>
                  {font.displayName}
                  {!font.isLoaded && " (Loading...)"}
                </option>
              ))}
            </optgroup>
          )}

          {/* System Fonts */}
          {fontsByType.system && fontsByType.system.length > 0 && (
            <optgroup label="System Fonts">
              {fontsByType.system.map((font) => (
                <option key={font.id} value={font.familyName}>
                  {font.displayName}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {showAdvancedOptions && (
        <>
          {/* Font Weight and Style Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Font Weight */}
            <div>
              <label
                htmlFor="font-weight-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Weight
              </label>
              <select
                id="font-weight-select"
                value={fontWeight}
                onChange={(e) => onFontWeightChange?.(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                {getAvailableWeights().map((weight) => (
                  <option key={weight} value={weight}>
                    {weight === "400" ? "400 (Normal)" : weight === "700" ? "700 (Bold)" : weight}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Style */}
            <div>
              <label
                htmlFor="font-style-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Style
              </label>
              <select
                id="font-style-select"
                value={fontStyle}
                onChange={(e) => onFontStyleChange?.(e.target.value as "normal" | "italic")}
                disabled={!isItalicAvailable()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>
          </div>

          {/* Letter Spacing and Line Height Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Letter Spacing */}
            <div>
              <label
                htmlFor="letter-spacing-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Letter Spacing
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="letter-spacing-input"
                  type="range"
                  min="-2"
                  max="10"
                  step="0.1"
                  value={letterSpacing}
                  onChange={(e) => onLetterSpacingChange?.(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">{letterSpacing}px</span>
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label
                htmlFor="line-height-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Line Height
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="line-height-input"
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => onLineHeightChange?.(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">{lineHeight}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Font Preview Component for showing how text looks with a font
interface FontPreviewProps {
  fontFamily: string;
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: "normal" | "italic";
  letterSpacing?: number;
  lineHeight?: number;
  className?: string;
}

export function FontPreview({
  fontFamily,
  text = "The quick brown fox jumps over the lazy dog",
  fontSize = 16,
  fontWeight = "400",
  fontStyle = "normal",
  letterSpacing = 0,
  lineHeight = 1.2,
  className = "",
}: FontPreviewProps) {
  const { ensureFontLoaded, getAllAvailableFonts } = useMenuMakerStore();
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const loadFont = async () => {
      if (fontFamily) {
        const availableFonts = getAllAvailableFonts();
        const font = availableFonts.find((f) => f.familyName === fontFamily);

        if (font) {
          const loaded = await ensureFontLoaded(font);

          setIsLoaded(loaded);
        }
      }
    };

    loadFont();
  }, [fontFamily, ensureFontLoaded, getAllAvailableFonts]);

  return (
    <div
      className={`p-3 bg-gray-50 dark:bg-gray-800 rounded border text-gray-900 dark:text-white ${className}`}
      style={{
        fontFamily: isLoaded ? fontFamily : "inherit",
        fontSize: `${fontSize}px`,
        fontWeight,
        fontStyle,
        letterSpacing: `${letterSpacing}px`,
        lineHeight,
      }}
    >
      {text}
      {!isLoaded && fontFamily && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Loading font...)</span>
      )}
    </div>
  );
}
