/* eslint-disable no-unused-vars */
import React from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { ProjectFont } from "../../types/menumaker";

interface FontSelectorProps {
  value: string;
  onChange: (fontFamily: string) => void;
  className?: string;
  placeholder?: string;
}

export function FontSelector({ value, onChange, className = "", placeholder = "Select font..." }: FontSelectorProps) {
  const { getAllAvailableFonts, ensureFontLoaded } = useMenuMakerStore();

  const availableFonts = getAllAvailableFonts();

  const handleFontChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFontFamily = event.target.value;

    onChange(selectedFontFamily);

    // Ensure the font is loaded for immediate use
    const selectedFont = availableFonts.find((font) => font.familyName === selectedFontFamily);

    if (selectedFont) {
      await ensureFontLoaded(selectedFont);
    }
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
    <select
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
  );
}

// Font Preview Component for showing how text looks with a font
interface FontPreviewProps {
  fontFamily: string;
  text?: string;
  fontSize?: number;
  className?: string;
}

export function FontPreview({
  fontFamily,
  text = "The quick brown fox jumps over the lazy dog",
  fontSize = 16,
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
      }}
    >
      {text}
      {!isLoaded && fontFamily && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Loading font...)</span>
      )}
    </div>
  );
}
