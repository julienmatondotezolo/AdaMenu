import { Upload, X } from "lucide-react";
import React, { useRef } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { Button } from "../ui/button";

export function BackgroundPanel() {
  const { project, currentPageId, updatePageBackground, saveProject } = useMenuMakerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPage = project?.pages.find((page) => page.id === currentPageId);

  if (!currentPage || !currentPageId) return null;

  const handleColorChange = (color: string) => {
    updatePageBackground(currentPageId, color, undefined);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const base64String = e.target?.result as string;

      updatePageBackground(currentPageId, undefined, base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    updatePageBackground(currentPageId, undefined, ""); // Opacity automatically resets to 1 in store
    saveProject();
  };

  const handleOpacityChange = (opacity: number) => {
    // Update state immediately for real-time visual feedback
    updatePageBackground(currentPageId, undefined, undefined, opacity);
  };

  const handleOpacityChangeComplete = () => {
    // Save project and update thumbnails when dragging stops
    saveProject();
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Predefined color palette
  const colorPalette = [
    "#ffffff",
    "#dee2e6",
    "#adb5bd",
    "#6c757d",
    "#000000",
    "#e53e3e",
    "#48bb78",
    "#4299e1",
    "#9f7aea",
  ];

  return (
    <div className="px-4 py-8 space-y-6">
      {/* Background Color Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Background Color</h4>

        {/* Color Input */}
        <div className="mb-3">
          <input
            type="color"
            value={currentPage.backgroundColor || "#ffffff"}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full h-10 rounded border border-gray-300 cursor-pointer"
            title="Select background color"
          />
        </div>

        {/* Color Palette */}
        <div className="grid grid-cols-11 gap-1">
          {colorPalette.map((color) => (
            <button
              key={color}
              className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                currentPage.backgroundColor === color ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Background Image Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Background Image</h4>

        {/* Current Background Image */}
        {currentPage.backgroundImage && currentPage.backgroundImage.trim() !== "" ? (
          <div className="mb-3">
            <button
              className="relative w-full group"
              onClick={handleImageClick}
              type="button"
              title="Click to replace background image"
            >
              <img
                src={currentPage.backgroundImage}
                alt="Current background"
                className="w-full h-32 object-cover rounded border border-gray-300 group-hover:opacity-80 transition-opacity"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 w-6 h-6 p-0 bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                title="Remove background image"
                type="button"
              >
                <X className="w-3 h-3" />
              </Button>
            </button>
            <p className="text-xs text-gray-500 mt-1">Click image to replace</p>
          </div>
        ) : (
          /* Upload Area */
          <button
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
            onClick={handleImageClick}
            type="button"
            title="Click to upload background image"
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Click to upload image</p>
            <p className="text-xs text-gray-400">JPG, PNG, GIF up to 5MB</p>
          </button>
        )}

        {/* Hidden File Input */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        {/* Upload Button (Alternative) */}
        <Button variant="outline" size="sm" onClick={handleImageClick} className="w-full mt-2">
          <Upload className="w-4 h-4 mr-2" />
          {currentPage.backgroundImage && currentPage.backgroundImage.trim() !== "" ? "Change Image" : "Upload Image"}
        </Button>
      </div>

      {/* Image Settings */}
      {currentPage.backgroundImage && currentPage.backgroundImage.trim() !== "" && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Image Settings</h4>
          <div className="space-y-2">
            <div>
              <label htmlFor="bg-opacity" className="text-xs text-gray-600 mb-1 block">
                Background Opacity
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="bg-opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={currentPage.backgroundImageOpacity ?? 1}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  onMouseUp={handleOpacityChangeComplete}
                  onTouchEnd={handleOpacityChangeComplete}
                  onKeyUp={handleOpacityChangeComplete}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-600 w-10 text-right">
                  {Math.round((currentPage.backgroundImageOpacity ?? 1) * 100)}%
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="bg-size" className="text-xs text-gray-600 mb-1 block">
                Background Size
              </label>
              <select id="bg-size" className="w-full text-sm border border-gray-300 rounded px-2 py-1">
                <option value="cover">Cover (Fill)</option>
                <option value="contain">Contain (Fit)</option>
                <option value="auto">Original Size</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
            <div>
              <label htmlFor="bg-position" className="text-xs text-gray-600 mb-1 block">
                Background Position
              </label>
              <select id="bg-position" className="w-full text-sm border border-gray-300 rounded px-2 py-1">
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top left">Top Left</option>
                <option value="top right">Top Right</option>
                <option value="bottom left">Bottom Left</option>
                <option value="bottom right">Bottom Right</option>
              </select>
            </div>
            <div>
              <label htmlFor="bg-repeat" className="text-xs text-gray-600 mb-1 block">
                Background Repeat
              </label>
              <select id="bg-repeat" className="w-full text-sm border border-gray-300 rounded px-2 py-1">
                <option value="no-repeat">No Repeat</option>
                <option value="repeat">Repeat</option>
                <option value="repeat-x">Repeat X</option>
                <option value="repeat-y">Repeat Y</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
