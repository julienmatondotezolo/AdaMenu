import React, { useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { PAGE_FORMATS } from "../../types/menumaker";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface PageFormatSelectorProps {
  onFormatSelected: () => void;
  onReturn: () => void;
}

export function PageFormatSelector({ onFormatSelected, onReturn }: PageFormatSelectorProps) {
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
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="delete" size="sm" onClick={onReturn}>
          Go to Dashboard
        </Button>
        <div></div> {/* Spacer for centering */}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Menu</h1>
        <p className="text-gray-600 dark:text-gray-300">Select a page format to get started with your menu design</p>
      </div>

      <div className="space-y-6">
        {/* Predefined Formats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(PAGE_FORMATS)
            .filter(([key]) => key !== "CUSTOM")
            .map(([key, format]) => (
              <Card
                key={key}
                className={`p-6 cursor-pointer border-2 rounded-xl transition-all duration-200 hover:shadow-lg ${
                  selectedFormat === key
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400 shadow-md"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900"
                }`}
                onClick={() => setSelectedFormat(key)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{format.name}</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {format.printWidth} × {format.printHeight} mm
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {format.width} × {format.height} pixels @ 300 DPI
                </div>
                <div className="mt-4 flex justify-center">
                  <div
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
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
          className={`p-6 cursor-pointer border-2 rounded-xl transition-all duration-200 hover:shadow-lg ${
            selectedFormat === "CUSTOM"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400 shadow-md"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900"
          }`}
          onClick={() => setSelectedFormat("CUSTOM")}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Custom Size</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="custom-width"
                className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-200"
              >
                Width (mm)
              </Label>
              <Input
                id="custom-width"
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                min={50}
                max={1000}
                className="mt-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFormat("CUSTOM");
                }}
              />
            </div>
            <div>
              <Label
                htmlFor="custom-height"
                className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-200"
              >
                Height (mm)
              </Label>
              <Input
                id="custom-height"
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
                min={50}
                max={1000}
                className="mt-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFormat("CUSTOM");
                }}
              />
            </div>
          </div>
          {selectedFormat === "CUSTOM" && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {Math.round(customWidth * 11.81)} × {Math.round(customHeight * 11.81)} pixels @ 300 DPI
            </div>
          )}
        </Card>
      </div>

      {/* Create Button */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleCreateProject}
          size="lg"
          className="px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          Create Menu Project
        </Button>
      </div>

      {/* Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          All formats are optimized for 300 DPI printing quality
        </p>
      </div>
    </div>
  );
}
