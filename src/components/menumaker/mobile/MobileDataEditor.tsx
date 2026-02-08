import React, { useCallback, useEffect, useState } from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";
import { DataElement, FontWeight } from "../../../types/menumaker";
import { MobileColorPicker } from "./MobileColorPicker";

interface MobileDataEditorProps {
  element: DataElement;
  pageId: string;
  layerId: string;
}

type Language = "en" | "fr" | "it" | "nl";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "nl", label: "NL" },
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
  { value: "it", label: "IT" },
];

export function MobileDataEditor({ element, pageId, layerId }: MobileDataEditorProps) {
  const { updateElement, getAllAvailableFonts, ensureFontLoaded } = useMenuMakerStore();

  // Title/language state
  const [titleLanguage, setTitleLanguage] = useState<Language>(element.titleLanguage || element.itemNameLanguage || "en");
  const [itemNameLanguage, setItemNameLanguage] = useState<Language>(element.itemNameLanguage || "en");

  // Display toggles
  const [showPrice, setShowPrice] = useState(element.showPrice ?? true);
  const [showCurrencySign, setShowCurrencySign] = useState(element.showCurrencySign ?? true);
  const [showMenuDescription, setShowMenuDescription] = useState(element.showMenuDescription ?? false);
  const [showSubcategoryTitle, setShowSubcategoryTitle] = useState(element.showSubcategoryTitle ?? true);
  const [priceSeparator, setPriceSeparator] = useState<"." | ",">(element.priceSeparator || ".");

  // Styling
  const [fontSize, setFontSize] = useState(element.fontSize || 64);
  const [textColor, setTextColor] = useState(element.textColor || "#000000");
  const [priceColor, setPriceColor] = useState(element.priceColor || "#000000");
  const [titleFontSize, setTitleFontSize] = useState(element.titleTextFontSize || 48);
  const [titleTextColor, setTitleTextColor] = useState(element.titleTextColor || "#000000");
  const [fontFamily, setFontFamily] = useState(element.fontFamily || "Arial, sans-serif");
  const [fontWeight, setFontWeight] = useState<FontWeight>(element.fontWeight || "normal");
  const [showFontPicker, setShowFontPicker] = useState(false);

  const availableFonts = getAllAvailableFonts();

  // Sync with element changes
  useEffect(() => {
    setTitleLanguage(element.titleLanguage || element.itemNameLanguage || "en");
    setItemNameLanguage(element.itemNameLanguage || "en");
    setShowPrice(element.showPrice ?? true);
    setShowCurrencySign(element.showCurrencySign ?? true);
    setShowMenuDescription(element.showMenuDescription ?? false);
    setShowSubcategoryTitle(element.showSubcategoryTitle ?? true);
    setPriceSeparator(element.priceSeparator || ".");
    setFontSize(element.fontSize || 64);
    setTextColor(element.textColor || "#000000");
    setPriceColor(element.priceColor || "#000000");
    setTitleFontSize(element.titleTextFontSize || 48);
    setTitleTextColor(element.titleTextColor || "#000000");
    setFontFamily(element.fontFamily || "Arial, sans-serif");
    setFontWeight(element.fontWeight || "normal");
  }, [element]);

  const handleUpdate = useCallback(
    (updates: Partial<DataElement>) => {
      updateElement(pageId, layerId, element.id, updates);
    },
    [updateElement, pageId, layerId, element.id]
  );

  // Data type label
  const getDataTypeLabel = () => {
    switch (element.dataType) {
      case "category":
        return "Category Title";
      case "subcategory":
        return "Subcategory Title";
      case "menuitem":
        return "Menu Items";
      default:
        return "Data Element";
    }
  };

  const isCategoryOrSubcategory = element.dataType === "category" || element.dataType === "subcategory";
  const isMenuItem = element.dataType === "menuitem";

  return (
    <div className="space-y-5">
      {/* Data Type Badge */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
          {getDataTypeLabel()}
        </span>
      </div>

      {/* Language Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
        <div className="flex items-center gap-2">
          {LANGUAGES.map((lang) => {
            const isActive = isCategoryOrSubcategory
              ? titleLanguage === lang.value
              : itemNameLanguage === lang.value;
            return (
              <button
                key={lang.value}
                onClick={() => {
                  if (isCategoryOrSubcategory) {
                    setTitleLanguage(lang.value);
                    handleUpdate({ titleLanguage: lang.value });
                  } else {
                    setItemNameLanguage(lang.value);
                    handleUpdate({ itemNameLanguage: lang.value });
                  }
                }}
                className={`flex-1 h-10 rounded-lg font-medium text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Display Options for Menu Items */}
      {isMenuItem && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Options</label>
          <div className="space-y-2">
            <ToggleRow
              label="Show prices"
              checked={showPrice}
              onChange={(v) => {
                setShowPrice(v);
                handleUpdate({ showPrice: v });
              }}
            />
            <ToggleRow
              label="Show € symbol"
              checked={showCurrencySign}
              onChange={(v) => {
                setShowCurrencySign(v);
                handleUpdate({ showCurrencySign: v });
              }}
            />
            <ToggleRow
              label="Show descriptions"
              checked={showMenuDescription}
              onChange={(v) => {
                setShowMenuDescription(v);
                handleUpdate({ showMenuDescription: v });
              }}
            />
            <ToggleRow
              label="Show subcategory title"
              checked={showSubcategoryTitle}
              onChange={(v) => {
                setShowSubcategoryTitle(v);
                handleUpdate({ showSubcategoryTitle: v });
              }}
            />

            {/* Price Separator */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Price separator</span>
              <div className="flex items-center gap-1">
                {([".", ","] as const).map((sep) => (
                  <button
                    key={sep}
                    onClick={() => {
                      setPriceSeparator(sep);
                      handleUpdate({ priceSeparator: sep });
                    }}
                    className={`w-10 h-8 rounded-md text-sm font-medium transition-colors ${
                      priceSeparator === sep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {sep}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isCategoryOrSubcategory ? "Title Font Size" : "Font Size"}
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {isCategoryOrSubcategory ? titleFontSize : fontSize}px
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isCategoryOrSubcategory) {
                const v = Math.max(8, titleFontSize - 2);
                setTitleFontSize(v);
                handleUpdate({ titleTextFontSize: v });
              } else {
                const v = Math.max(8, fontSize - 2);
                setFontSize(v);
                handleUpdate({ fontSize: v });
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-lg"
          >
            −
          </button>
          <input
            type="range"
            min="8"
            max="300"
            step="1"
            value={isCategoryOrSubcategory ? titleFontSize : fontSize}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (isCategoryOrSubcategory) {
                setTitleFontSize(v);
                handleUpdate({ titleTextFontSize: v });
              } else {
                setFontSize(v);
                handleUpdate({ fontSize: v });
              }
            }}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <button
            onClick={() => {
              if (isCategoryOrSubcategory) {
                const v = Math.min(300, titleFontSize + 2);
                setTitleFontSize(v);
                handleUpdate({ titleTextFontSize: v });
              } else {
                const v = Math.min(300, fontSize + 2);
                setFontSize(v);
                handleUpdate({ fontSize: v });
              }
            }}
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
                onClick={async () => {
                  setFontFamily(font.familyName);
                  setShowFontPicker(false);
                  await ensureFontLoaded(font);
                  if (isCategoryOrSubcategory) {
                    handleUpdate({ titleTextFontFamily: font.familyName });
                  } else {
                    handleUpdate({ fontFamily: font.familyName });
                  }
                }}
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

      {/* Text Color */}
      <MobileColorPicker
        value={isCategoryOrSubcategory ? titleTextColor : textColor}
        onChange={(color) => {
          if (isCategoryOrSubcategory) {
            setTitleTextColor(color);
            handleUpdate({ titleTextColor: color });
          } else {
            setTextColor(color);
            handleUpdate({ textColor: color });
          }
        }}
        label="Text Color"
      />

      {/* Price Color (for menu items) */}
      {isMenuItem && (
        <MobileColorPicker
          value={priceColor}
          onChange={(color) => {
            setPriceColor(color);
            handleUpdate({ priceColor: color });
          }}
          label="Price Color"
        />
      )}
    </div>
  );
}

// Toggle row component
function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
