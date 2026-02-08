import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Underline } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";
import { FontWeight, TextElement } from "../../../types/menumaker";
import { MobileColorPicker } from "./MobileColorPicker";

interface MobileTextEditorProps {
  element: TextElement;
  pageId: string;
  layerId: string;
}

export function MobileTextEditor({ element, pageId, layerId }: MobileTextEditorProps) {
  const { updateElement, getAllAvailableFonts, ensureFontLoaded } = useMenuMakerStore();

  const [content, setContent] = useState(element.content);
  const [fontSize, setFontSize] = useState(element.fontSize);
  const [fontFamily, setFontFamily] = useState(element.fontFamily);
  const [fill, setFill] = useState(element.fill);
  const [align, setAlign] = useState(element.align);
  const [fontWeight, setFontWeight] = useState<FontWeight>(element.fontWeight);
  const [fontStyle, setFontStyle] = useState(element.fontStyle);
  const [textDecoration, setTextDecoration] = useState(element.textDecoration);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const availableFonts = getAllAvailableFonts();

  // Sync with element changes
  useEffect(() => {
    setContent(element.content);
    setFontSize(element.fontSize);
    setFontFamily(element.fontFamily);
    setFill(element.fill);
    setAlign(element.align);
    setFontWeight(element.fontWeight);
    setFontStyle(element.fontStyle);
    setTextDecoration(element.textDecoration);
  }, [element]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (contentDebounceRef.current) {
        clearTimeout(contentDebounceRef.current);
      }
    };
  }, []);

  const handleUpdate = useCallback(
    (updates: Partial<TextElement>) => {
      updateElement(pageId, layerId, element.id, updates);
    },
    [updateElement, pageId, layerId, element.id]
  );

  // Debounced content update — properly cleans up previous timeout
  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value);
      // Clear previous timeout to debounce properly
      if (contentDebounceRef.current) {
        clearTimeout(contentDebounceRef.current);
      }
      contentDebounceRef.current = setTimeout(() => {
        handleUpdate({ content: value });
        contentDebounceRef.current = null;
      }, 300);
    },
    [handleUpdate]
  );

  const handleFontSizeChange = useCallback(
    (value: number) => {
      const clamped = Math.max(8, Math.min(500, value));
      setFontSize(clamped);
      handleUpdate({ fontSize: clamped });
    },
    [handleUpdate]
  );

  const handleFontFamilyChange = useCallback(
    async (family: string) => {
      setFontFamily(family);
      setShowFontPicker(false);
      // Ensure font is loaded
      const font = availableFonts.find((f) => f.familyName === family);
      if (font) {
        await ensureFontLoaded(font);
      }
      handleUpdate({ fontFamily: family });
    },
    [handleUpdate, availableFonts, ensureFontLoaded]
  );

  const toggleBold = useCallback(() => {
    const newWeight: FontWeight = fontWeight === "bold" || fontWeight === "700" ? "normal" : "bold";
    setFontWeight(newWeight);
    handleUpdate({ fontWeight: newWeight });
  }, [fontWeight, handleUpdate]);

  const toggleItalic = useCallback(() => {
    const newStyle = fontStyle === "italic" ? "normal" : "italic";
    setFontStyle(newStyle);
    handleUpdate({ fontStyle: newStyle });
  }, [fontStyle, handleUpdate]);

  const toggleUnderline = useCallback(() => {
    const newDeco = textDecoration === "underline" ? "none" : "underline";
    setTextDecoration(newDeco);
    handleUpdate({ textDecoration: newDeco });
  }, [textDecoration, handleUpdate]);

  const handleAlignChange = useCallback(
    (newAlign: "left" | "center" | "right" | "justify") => {
      setAlign(newAlign);
      handleUpdate({ align: newAlign });
    },
    [handleUpdate]
  );

  const handleColorChange = useCallback(
    (color: string) => {
      setFill(color);
      handleUpdate({ fill: color });
    },
    [handleUpdate]
  );

  return (
    <div className="space-y-5">
      {/* Content */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Text Content</label>
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter text..."
        />
      </div>

      {/* Font Size Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Size</label>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{fontSize}px</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleFontSizeChange(fontSize - 2)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-lg"
          >
            −
          </button>
          <input
            type="range"
            min="8"
            max="500"
            step="1"
            value={fontSize}
            onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <button
            onClick={() => handleFontSizeChange(fontSize + 2)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font</label>
        <button
          onClick={() => setShowFontPicker(!showFontPicker)}
          className="w-full h-10 px-3 text-sm text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-between"
        >
          <span style={{ fontFamily }}>{fontFamily.split(",")[0].trim()}</span>
          <span className="text-gray-400">▼</span>
        </button>
        {showFontPicker && (
          <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            {availableFonts.map((font) => (
              <button
                key={font.id}
                onClick={() => handleFontFamilyChange(font.familyName)}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  fontFamily.includes(font.familyName)
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-gray-900 dark:text-white"
                }`}
                style={{ fontFamily: font.familyName }}
              >
                {font.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Text Formatting - Bold, Italic, Underline */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Formatting</label>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleBold}
            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
              fontWeight === "bold" || fontWeight === "700"
                ? "bg-blue-100 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={toggleItalic}
            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
              fontStyle === "italic"
                ? "bg-blue-100 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={toggleUnderline}
            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
              textDecoration === "underline"
                ? "bg-blue-100 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alignment</label>
        <div className="flex items-center gap-2">
          {(
            [
              { value: "left", icon: AlignLeft },
              { value: "center", icon: AlignCenter },
              { value: "right", icon: AlignRight },
              { value: "justify", icon: AlignJustify },
            ] as const
          ).map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleAlignChange(value)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                align === value
                  ? "bg-blue-100 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <MobileColorPicker value={fill} onChange={handleColorChange} label="Text Color" />
    </div>
  );
}
