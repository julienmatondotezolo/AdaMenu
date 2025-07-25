import { Clipboard, Copy, Database, Image, MousePointer, Move, Redo, Type, Undo } from "lucide-react";
import React from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { Tool } from "../../types/menumaker";
import { Button } from "../ui/button";

export function MainToolbar() {
  const { project, currentPageId, editorState, setTool, addElement, undo, redo, copy, paste } = useMenuMakerStore();

  const { tool } = editorState;

  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "text", icon: Type, label: "Add Text" },
    { id: "image", icon: Image, label: "Add Image" },
    { id: "data", icon: Database, label: "Add Data" },
    { id: "pan", icon: Move, label: "Pan" },
  ] as const;

  const handleToolSelect = (toolId: Tool) => {
    setTool(toolId);

    // If data tool is selected, add a default data element
    if (toolId === "data" && project && currentPageId) {
      const currentPage = project.pages.find((page) => page.id === currentPageId);

      if (currentPage && currentPage.layers.length > 0) {
        // Calculate center position based on page format
        const centerX = (currentPage.format.width - 1000) / 2;
        const centerY = (currentPage.format.height - 400) / 2;

        // Create default data element
        const defaultDataElement = {
          type: "data" as const,
          x: Math.max(0, centerX), // Ensure it's not negative
          y: Math.max(0, centerY), // Ensure it's not negative
          width: 1000,
          height: 400,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          zIndex: 1,
          locked: false,
          visible: true,
          opacity: 1,
          dataType: "" as any, // Empty dataType
          dataId: "",
          backgroundColor: "#ffffff", // White background
          borderColor: "#000000", // Black border
          borderSize: 1,
          borderType: "solid" as const,
          borderRadius: 0,
        };

        // Add to first layer
        addElement(currentPageId, currentPage.layers[0].id, defaultDataElement);
      }
    }
  };

  if (!project || !currentPageId) return null;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-lg px-4 py-2">
      <div className="flex items-center space-x-3">
        {/* Undo/Redo Section */}
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm" onClick={undo} title="Undo">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={redo} title="Redo">
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Copy/Paste Section */}
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm" onClick={copy} title="Copy">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={paste} title="Paste">
            <Clipboard className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Tools Section */}
        <div className="flex items-center space-x-1  p-1">
          {tools.map((toolItem) => (
            <Button
              key={toolItem.id}
              variant={tool === toolItem.id ? "default" : "ghost"}
              size="sm"
              onClick={() => handleToolSelect(toolItem.id)}
              title={toolItem.label}
            >
              <toolItem.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
