import { Camera, ImageIcon, Upload } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";
import { ImageElement } from "../../../types/menumaker";

interface MobileImageEditorProps {
  element: ImageElement;
  pageId: string;
  layerId: string;
}

export function MobileImageEditor({ element, pageId, layerId }: MobileImageEditorProps) {
  const { updateElement } = useMenuMakerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [opacity, setOpacity] = useState(element.opacity);

  const handleUpdate = useCallback(
    (updates: Partial<ImageElement>) => {
      updateElement(pageId, layerId, element.id, updates);
    },
    [updateElement, pageId, layerId, element.id]
  );

  const handleImageReplace = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          handleUpdate({
            src,
            fileName: file.name,
            originalWidth: img.width,
            originalHeight: img.height,
          });
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [handleUpdate]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageReplace(file);
      }
    },
    [handleImageReplace]
  );

  const handleOpacityChange = useCallback(
    (value: number) => {
      const clamped = Math.max(0, Math.min(1, value));
      setOpacity(clamped);
      handleUpdate({ opacity: clamped });
    },
    [handleUpdate]
  );

  return (
    <div className="space-y-5">
      {/* Current Image Preview */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Image</label>
        <div className="w-full h-32 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          {element.src ? (
            <img
              src={element.src}
              alt={element.fileName || "Image"}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-gray-400 dark:text-gray-500 flex flex-col items-center gap-1">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        {element.fileName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{element.fileName}</p>
        )}
      </div>

      {/* Replace Image Buttons */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Replace Image</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Choose File
          </button>
          <button
            onClick={() => {
              // Trigger camera capture
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute("capture", "environment");
                fileInputRef.current.click();
                fileInputRef.current.removeAttribute("capture");
              }
            }}
            className="flex items-center justify-center gap-2 h-12 px-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm border border-gray-200 dark:border-gray-600"
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Opacity</label>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {Math.round(opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={opacity}
          onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    </div>
  );
}
