/* eslint-disable no-unused-vars */
import React from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";
import { FontWeight, TextElement } from "../../../types/menumaker";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { FontSelector } from "../FontSelector";

export function PropertiesPanel() {
  const { project, currentPageId, editorState, updateElement } = useMenuMakerStore();

  const currentPage = project?.pages.find((page) => page.id === currentPageId);
  const selectedElements =
    currentPage?.layers
      .flatMap((layer) => layer.elements)
      .filter(
        (element) =>
          editorState.selectedElementIds.includes(element.id) && element.type !== "shape" && element.type !== "image",
      ) || [];

  if (!currentPage) return null;

  const handleElementUpdate = (elementId: string, updates: any) => {
    // Find the layer containing this element
    const layer = currentPage.layers.find((layer) => layer.elements.some((element) => element.id === elementId));

    if (layer) {
      updateElement(currentPageId!, layer.id, elementId, updates);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Element Properties */}
        {selectedElements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {selectedElements.length === 1
                ? `${selectedElements[0].type.charAt(0).toUpperCase() + selectedElements[0].type.slice(1)} Element`
                : `${selectedElements.length} Elements`}
            </h4>

            {selectedElements.length === 1 && (
              <ElementProperties
                element={selectedElements[0]}
                onUpdate={(updates) => handleElementUpdate(selectedElements[0].id, updates)}
              />
            )}

            {selectedElements.length > 1 && (
              <MultiElementProperties
                elements={selectedElements}
                onUpdate={(updates) => {
                  selectedElements.forEach((element) => {
                    handleElementUpdate(element.id, updates);
                  });
                }}
              />
            )}
          </div>
        )}

        {/* No Selection */}
        {selectedElements.length === 0 && (
          <div className="text-center text-gray-500 text-sm">Select an element to edit its properties</div>
        )}
      </div>
    </div>
  );
}

// Component for editing a single element
function ElementProperties({ element, onUpdate }: { element: any; onUpdate: (updates: any) => void }) {
  const { getAllAvailableFonts, ensureFontLoaded } = useMenuMakerStore();

  if (element.type === "text") {
    const textElement = element as TextElement;

    // Convert legacy fontStyle to separate fields if needed
    const fontWeight =
      textElement.fontWeight || ((textElement.fontStyle?.includes("bold") ? "700" : "400") as FontWeight);
    const fontStyle = textElement.fontStyle?.includes("italic") ? "italic" : ("normal" as "normal" | "italic");

    const handleFontWeightChange = (newWeight: string) => {
      onUpdate({ fontWeight: newWeight as FontWeight });

      // For Google Fonts, ensure the specific weight variant is loaded
      const availableFonts = getAllAvailableFonts();
      const currentFont = availableFonts.find((font) => font.familyName === textElement.fontFamily);

      if (currentFont && currentFont.type === "google") {
        // Force reload the Google Font to ensure the new weight is available
        ensureFontLoaded(currentFont, true).then((loaded) => {
          if (!loaded) {
            console.warn(`Failed to load weight ${newWeight} for Google Font: ${textElement.fontFamily}`);
          }
        });
      }
    };

    const handleFontStyleChange = (newStyle: "normal" | "italic") => {
      onUpdate({ fontStyle: newStyle });

      // For Google Fonts, ensure the specific style variant is loaded
      const availableFonts = getAllAvailableFonts();
      const currentFont = availableFonts.find((font) => font.familyName === textElement.fontFamily);

      if (currentFont && currentFont.type === "google") {
        // Force reload the Google Font to ensure the new style is available
        ensureFontLoaded(currentFont, true).then((loaded) => {
          if (!loaded) {
            console.warn(`Failed to load style ${newStyle} for Google Font: ${textElement.fontFamily}`);
          }
        });
      }
    };

    const handleFontFamilyChange = async (fontFamily: string) => {
      try {
        // Find the selected font
        const availableFonts = getAllAvailableFonts();
        const selectedFont = availableFonts.find((font) => font.familyName === fontFamily);

        // Always update the font family first
        const fontUpdate = {
          fontFamily,
          fontWeight: "400" as FontWeight, // Reset to normal weight
          fontStyle: "normal" as "normal", // Reset to normal style
          letterSpacing: 0, // Reset letter spacing
          lineHeight: 1.2, // Reset line height
        };

        // Update the element immediately with the selected font
        onUpdate(fontUpdate);

        // Try to ensure the font is loaded (for Google/custom fonts)
        if (selectedFont) {
          try {
            const isLoaded = await ensureFontLoaded(selectedFont);

            if (!isLoaded) {
              console.warn(`Font may not have loaded properly: ${fontFamily}`);
              // Don't fallback to Arial - keep the selected font
            }
          } catch (loadError) {
            console.warn(`Error loading font ${fontFamily}:`, loadError);
            // Don't fallback to Arial - keep the selected font
          }
        } else {
          // Font not found in available fonts list, but still use it
          // This handles cases where custom fonts might not be properly registered
          console.warn(`Font not found in available fonts: ${fontFamily}`);
          // Don't fallback to Arial - keep the selected font
        }
      } catch (error) {
        console.error("Error in font family change:", error);
        // Even on error, keep the selected font instead of falling back to Arial
        onUpdate({
          fontFamily,
          fontWeight: "400" as FontWeight,
          fontStyle: "normal" as "normal",
          letterSpacing: 0,
          lineHeight: 1.2,
        });
      }
    };

    return (
      <div className="space-y-3">
        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="text-x">X</Label>
            <Input
              id="text-x"
              type="number"
              value={Math.round(textElement.x)}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="text-y">Y</Label>
            <Input
              id="text-y"
              type="number"
              value={Math.round(textElement.y)}
              onChange={(e) => onUpdate({ y: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="text-width">Width</Label>
            <Input
              id="text-width"
              type="number"
              value={Math.round(textElement.width)}
              onChange={(e) => onUpdate({ width: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="text-height">Height</Label>
            <Input
              id="text-height"
              type="number"
              value={Math.round(textElement.height)}
              onChange={(e) => onUpdate({ height: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Text Content */}
        <div>
          <Label htmlFor="text-content">Text</Label>
          <Input
            id="text-content"
            type="text"
            value={textElement.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="mt-1"
          />
        </div>

        {/* Font Properties */}
        <div>
          <Label htmlFor="text-font-size">Font Size</Label>
          <Input
            id="text-font-size"
            type="number"
            value={textElement.fontSize}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
            className="mt-1"
          />
        </div>

        {/* Enhanced Font Selector with all properties */}
        <div>
          <FontSelector
            value={textElement.fontFamily}
            onChange={handleFontFamilyChange}
            fontWeight={fontWeight}
            onFontWeightChange={handleFontWeightChange}
            fontStyle={fontStyle}
            onFontStyleChange={handleFontStyleChange}
            letterSpacing={textElement.letterSpacing}
            onLetterSpacingChange={(letterSpacing) => onUpdate({ letterSpacing })}
            lineHeight={textElement.lineHeight}
            onLineHeightChange={(lineHeight) => onUpdate({ lineHeight })}
            className="mt-1"
          />
        </div>

        {/* Color */}
        <div>
          <Label htmlFor="text-color">Text Color</Label>
          <Input
            id="text-color"
            type="color"
            value={textElement.fill}
            onChange={(e) => onUpdate({ fill: e.target.value })}
            className="mt-1"
          />
        </div>

        {/* Opacity */}
        <div>
          <Label htmlFor="text-opacity">Opacity</Label>
          <Input
            id="text-opacity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={textElement.opacity}
            onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
            className="mt-1"
          />
          <div className="text-xs text-gray-500 mt-1">{Math.round(textElement.opacity * 100)}%</div>
        </div>
      </div>
    );
  }

  return <div className="text-sm text-gray-500">Properties for {element.type} elements coming soon</div>;
}

// Component for editing multiple elements
function MultiElementProperties({ elements, onUpdate }: { elements: any[]; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">Editing {elements.length} elements</div>

      {/* Common properties that can be applied to all elements */}
      <div>
        <Label htmlFor="multi-opacity">Opacity</Label>
        <Input
          id="multi-opacity"
          type="range"
          min="0"
          max="1"
          step="0.1"
          defaultValue="1"
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
          className="mt-1"
        />
      </div>

      <div className="text-xs text-gray-500">Only common properties are shown when multiple elements are selected</div>
    </div>
  );
}
