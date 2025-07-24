import React from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { TextElement } from "../../types/menumaker";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function PropertiesPanel() {
  const { project, currentPageId, editorState, updateElement, updatePageBackground } = useMenuMakerStore();

  const currentPage = project?.pages.find((page) => page.id === currentPageId);
  const selectedElements =
    currentPage?.layers
      .flatMap((layer) => layer.elements)
      .filter((element) => editorState.selectedElementIds.includes(element.id)) || [];

  if (!currentPage) return null;

  const handlePageBackgroundChange = (color: string) => {
    updatePageBackground(currentPageId!, color);
  };

  const handleElementUpdate = (elementId: string, updates: any) => {
    // Find the layer containing this element
    const layer = currentPage.layers.find((layer) => layer.elements.some((element) => element.id === elementId));

    if (layer) {
      updateElement(currentPageId!, layer.id, elementId, updates);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Properties</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Page Properties */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Page</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="page-bg-color">Background Color</Label>
              <div className="flex mt-1">
                <Input
                  id="page-bg-color"
                  type="color"
                  value={currentPage.backgroundColor}
                  onChange={(e) => handlePageBackgroundChange(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Format: {currentPage.format.name} ({currentPage.format.printWidth}×{currentPage.format.printHeight}mm)
            </div>
          </div>
        </div>

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
  if (element.type === "text") {
    const textElement = element as TextElement;

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

        <div>
          <Label htmlFor="text-font-family">Font Family</Label>
          <select
            id="text-font-family"
            value={textElement.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Verdana">Verdana</option>
          </select>
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
