import React, { useCallback, useState } from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";
import { ShapeElement } from "../../../types/menumaker";
import { MobileColorPicker } from "./MobileColorPicker";

interface MobileShapeEditorProps {
  element: ShapeElement;
  pageId: string;
  layerId: string;
}

export function MobileShapeEditor({ element, pageId, layerId }: MobileShapeEditorProps) {
  const { updateElement } = useMenuMakerStore();

  const [fill, setFill] = useState(element.fill);
  const [stroke, setStroke] = useState(element.stroke);
  const [strokeWidth, setStrokeWidth] = useState(element.strokeWidth);
  const [opacity, setOpacity] = useState(element.opacity);

  const handleUpdate = useCallback(
    (updates: Partial<ShapeElement>) => {
      updateElement(pageId, layerId, element.id, updates);
    },
    [updateElement, pageId, layerId, element.id]
  );

  // Shape type label
  const shapeLabel =
    element.shapeType === "rectangle"
      ? "Rectangle"
      : element.shapeType === "circle"
        ? "Circle"
        : element.shapeType === "triangle"
          ? "Triangle"
          : "Shape";

  return (
    <div className="space-y-5">
      {/* Shape Type Badge */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
          {shapeLabel}
        </span>
      </div>

      {/* Fill Color */}
      <MobileColorPicker
        value={fill}
        onChange={(color) => {
          setFill(color);
          handleUpdate({ fill: color });
        }}
        label="Fill Color"
      />

      {/* Stroke Color */}
      <MobileColorPicker
        value={stroke}
        onChange={(color) => {
          setStroke(color);
          handleUpdate({ stroke: color });
        }}
        label="Border Color"
      />

      {/* Stroke Width */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Border Width</label>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{strokeWidth}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={strokeWidth}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            setStrokeWidth(v);
            handleUpdate({ strokeWidth: v });
          }}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setOpacity(v);
            handleUpdate({ opacity: v });
          }}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    </div>
  );
}
