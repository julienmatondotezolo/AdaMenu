import { Check } from "lucide-react";
import React, { useState } from "react";

interface MobileColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

// Common colors for restaurant menus
const PRESET_COLORS = [
  "#000000", "#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF",
  "#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560", "#f38181",
  "#2d4059", "#ea5455", "#f07b3f", "#ffd460", "#6a994e", "#386641",
  "#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51", "#d62828",
  "#023e8a", "#0077b6", "#00b4d8", "#90e0ef", "#f72585", "#7209b7",
];

export function MobileColorPicker({ value, onChange, label }: MobileColorPickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customHex, setCustomHex] = useState(value);

  const handlePresetClick = (color: string) => {
    onChange(color);
    setCustomHex(color);
  };

  const handleCustomSubmit = () => {
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(customHex)) {
      onChange(customHex);
    }
    setShowCustomInput(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>

      {/* Current color preview + custom input toggle */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="text-xs text-blue-600 dark:text-blue-400 font-medium"
        >
          {showCustomInput ? "Hide" : "Custom hex"}
        </button>
      </div>

      {/* Custom hex input */}
      {showCustomInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#000000"
            className="flex-1 h-9 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            maxLength={7}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setCustomHex(e.target.value);
            }}
            className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <button
            onClick={handleCustomSubmit}
            className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-lg"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preset swatches */}
      <div className="grid grid-cols-6 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handlePresetClick(color)}
            className={`w-full aspect-square rounded-lg border-2 transition-all ${
              value.toLowerCase() === color.toLowerCase()
                ? "border-blue-500 scale-110 shadow-sm"
                : "border-gray-200 dark:border-gray-600"
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}
