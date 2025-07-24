import React, { useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { PAGE_FORMATS } from "../../types/menumaker";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface PageFormatSelectorProps {
  onFormatSelected: () => void;
}

export function PageFormatSelector({ onFormatSelected }: PageFormatSelectorProps) {
  const [selectedFormat, setSelectedFormat] = useState("A4");
  const [customWidth, setCustomWidth] = useState(210);
  const [customHeight, setCustomHeight] = useState(297);
  const { createProject } = useMenuMakerStore();

  const handleCreateProject = () => {
    // Create project with selected format
    if (selectedFormat === "CUSTOM") {
      createProject("Untitled Menu", selectedFormat, customWidth, customHeight);
    } else {
      createProject("Untitled Menu", selectedFormat);
    }
    onFormatSelected();
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Menu</h1>
        <p className="text-gray-600">Select a page format to get started with your menu design</p>
      </div>

      <div className="space-y-6">
        {/* Predefined Formats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(PAGE_FORMATS)
            .filter(([key]) => key !== "CUSTOM")
            .map(([key, format]) => (
              <Card
                key={key}
                className={`p-6 cursor-pointer border-2 transition-colors ${
                  selectedFormat === key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedFormat(key)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{format.name}</h3>
                  <div className="text-sm text-gray-500">
                    {format.printWidth} × {format.printHeight} mm
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {format.width} × {format.height} pixels @ 300 DPI
                </div>
                <div className="mt-3">
                  <div
                    className="bg-white border border-gray-200 rounded"
                    style={{
                      width: "80px",
                      height: `${(80 * format.height) / format.width}px`,
                      maxHeight: "100px",
                    }}
                  />
                </div>
              </Card>
            ))}
        </div>

        {/* Custom Format */}
        <Card
          className={`p-6 cursor-pointer border-2 transition-colors ${
            selectedFormat === "CUSTOM" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => setSelectedFormat("CUSTOM")}
        >
          <h3 className="text-lg font-semibold mb-4">Custom Size</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="custom-width">Width (mm)</Label>
              <Input
                id="custom-width"
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                min={50}
                max={1000}
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <Label htmlFor="custom-height">Height (mm)</Label>
              <Input
                id="custom-height"
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
                min={50}
                max={1000}
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          {selectedFormat === "CUSTOM" && (
            <div className="mt-3 text-sm text-gray-600">
              {Math.round(customWidth * 11.81)} × {Math.round(customHeight * 11.81)} pixels @ 300 DPI
            </div>
          )}
        </Card>
      </div>

      {/* Create Button */}
      <div className="mt-8 text-center">
        <Button onClick={handleCreateProject} size="lg" className="px-8">
          Create Menu Project
        </Button>
      </div>

      {/* Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">All formats are optimized for 300 DPI printing quality</p>
      </div>
    </div>
  );
}
