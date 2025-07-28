import React from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";
import { ShapeElement, ShapeType } from "../../../types/menumaker";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

export function ShapePanel() {
  const { project, currentPageId, editorState, updateElement } = useMenuMakerStore();

  const currentPage = project?.pages.find((page) => page.id === currentPageId);
  const selectedElements =
    currentPage?.layers
      .flatMap((layer) => layer.elements)
      .filter((element) => editorState.selectedElementIds.includes(element.id) && element.type === "shape") || [];

  if (!currentPage || selectedElements.length === 0) return null;

  const handleElementUpdate = (elementId: string, updates: any) => {
    // Find the layer containing this element
    const layer = currentPage.layers.find((layer) => layer.elements.some((element) => element.id === elementId));

    if (layer) {
      updateElement(currentPageId!, layer.id, elementId, updates);
    }
  };

  // If multiple shapes are selected, show multi-element controls
  if (selectedElements.length > 1) {
    return (
      <div className="p-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {selectedElements.length} Shape Elements
        </h4>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Multi-shape editing coming soon. Select a single shape to edit its properties.
        </div>
      </div>
    );
  }

  // Single shape element
  const shapeElement = selectedElements[0] as ShapeElement;

  // Helper functions to extract RGBA values
  const hexToRgba = (hex: string, alpha: number = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const rgbaToHex = (rgba: string) => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);

    if (!match) return rgba;
    const r = parseInt(match[1]).toString(16).padStart(2, "0");
    const g = parseInt(match[2]).toString(16).padStart(2, "0");
    const b = parseInt(match[3]).toString(16).padStart(2, "0");

    return `#${r}${g}${b}`;
  };

  const getRgbaAlpha = (rgba: string) => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);

    return match && match[4] ? parseFloat(match[4]) : 1;
  };

  const fillColor = shapeElement.fill.startsWith("rgba") ? rgbaToHex(shapeElement.fill) : shapeElement.fill;
  const fillOpacity = shapeElement.fill.startsWith("rgba") ? getRgbaAlpha(shapeElement.fill) : 1;
  const strokeColor = shapeElement.stroke.startsWith("rgba") ? rgbaToHex(shapeElement.stroke) : shapeElement.stroke;
  const strokeOpacity = shapeElement.stroke.startsWith("rgba") ? getRgbaAlpha(shapeElement.stroke) : 1;

  const onUpdate = (updates: any) => handleElementUpdate(shapeElement.id, updates);

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Position & Size</h4>
        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="shape-x">X</Label>
            <Input
              id="shape-x"
              type="number"
              value={Math.round(shapeElement.x)}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="shape-y">Y</Label>
            <Input
              id="shape-y"
              type="number"
              value={Math.round(shapeElement.y)}
              onChange={(e) => onUpdate({ y: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="shape-width">Width</Label>
            <Input
              id="shape-width"
              type="number"
              value={Math.round(shapeElement.width)}
              onChange={(e) => onUpdate({ width: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="shape-height">Height</Label>
            <Input
              id="shape-height"
              type="number"
              value={Math.round(shapeElement.height)}
              onChange={(e) => onUpdate({ height: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Shape Type */}
        <div>
          <Label htmlFor="shape-type">Shape Type</Label>
          <select
            id="shape-type"
            value={shapeElement.shapeType}
            onChange={(e) => onUpdate({ shapeType: e.target.value as ShapeType })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="triangle">Triangle</option>
          </select>
        </div>

        {/* Border Radius (only for rectangles) */}
        {shapeElement.shapeType === "rectangle" && (
          <div>
            <Label htmlFor="shape-radius">Border Radius</Label>
            <Input
              id="shape-radius"
              type="number"
              min="0"
              value={shapeElement.radius}
              onChange={(e) => onUpdate({ radius: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        )}

        {/* Fill Color */}
        <div>
          <Label htmlFor="shape-fill-color">Fill Color</Label>
          <Input
            id="shape-fill-color"
            type="color"
            value={fillColor}
            onChange={(e) => onUpdate({ fill: hexToRgba(e.target.value, fillOpacity) })}
            className="mt-1"
          />
        </div>

        {/* Fill Opacity */}
        <div>
          <Label htmlFor="shape-fill-opacity">Fill Opacity</Label>
          <Input
            id="shape-fill-opacity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={fillOpacity}
            onChange={(e) => onUpdate({ fill: hexToRgba(fillColor, Number(e.target.value)) })}
            className="mt-1"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round(fillOpacity * 100)}%</div>
        </div>

        {/* Stroke Color */}
        <div>
          <Label htmlFor="shape-stroke-color">Stroke Color</Label>
          <Input
            id="shape-stroke-color"
            type="color"
            value={strokeColor}
            onChange={(e) => onUpdate({ stroke: hexToRgba(e.target.value, strokeOpacity) })}
            className="mt-1"
          />
        </div>

        {/* Stroke Opacity */}
        <div>
          <Label htmlFor="shape-stroke-opacity">Stroke Opacity</Label>
          <Input
            id="shape-stroke-opacity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={strokeOpacity}
            onChange={(e) => onUpdate({ stroke: hexToRgba(strokeColor, Number(e.target.value)) })}
            className="mt-1"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round(strokeOpacity * 100)}%</div>
        </div>

        {/* Stroke Width */}
        <div>
          <Label htmlFor="shape-stroke-width">Stroke Width</Label>
          <Input
            id="shape-stroke-width"
            type="number"
            min="0"
            value={shapeElement.strokeWidth}
            onChange={(e) => onUpdate({ strokeWidth: Number(e.target.value) })}
            className="mt-1"
          />
        </div>

        {/* Overall Opacity */}
        <div>
          <Label htmlFor="shape-opacity">Overall Opacity</Label>
          <Input
            id="shape-opacity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={shapeElement.opacity}
            onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
            className="mt-1"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round(shapeElement.opacity * 100)}%</div>
        </div>
      </div>
    </div>
  );
}
