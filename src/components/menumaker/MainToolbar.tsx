import { Clipboard, Copy, Database, Image, MousePointer, Redo, Shapes, Type, Undo } from "lucide-react";
import React, { useRef, useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { Tool } from "../../types/menumaker";
import { Button } from "../ui/button";
import { DataSelectorModal } from "./DataSelectorModal";
import { ImageUploadModal } from "./ImageUploadModal";
import { ShapeSelectorDropdown } from "./ShapeSelectorDropdown";

export function MainToolbar() {
  const { project, currentPageId, editorState, setTool, undo, redo, copy, paste } = useMenuMakerStore();
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showDataSelector, setShowDataSelector] = useState(false);
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  const shapeButtonRef = useRef<HTMLButtonElement>(null);

  const { tool } = editorState;

  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "text", icon: Type, label: "Add Text" },
    { id: "shape", icon: Shapes, label: "Add Shape" },
    { id: "image", icon: Image, label: "Add Image" },
    { id: "data", icon: Database, label: "Add Data" },
  ] as const;

  const handleToolSelect = (toolId: Tool) => {
    // If image tool is selected, show upload modal instead of setting tool
    if (toolId === "image") {
      setShowImageUpload(true);
      return;
    }

    // If data tool is selected, show data selector modal instead of setting tool
    if (toolId === "data") {
      setShowDataSelector(true);
      return;
    }

    // If shape tool is selected, show shape selector modal instead of setting tool
    if (toolId === "shape") {
      setShowShapeSelector(true);
      return;
    }

    setTool(toolId);
  };

  if (!project || !currentPageId) return null;

  return (
    <>
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
                ref={toolItem.id === "shape" ? shapeButtonRef : undefined}
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

      {/* Image Upload Modal */}
      <ImageUploadModal isOpen={showImageUpload} onClose={() => setShowImageUpload(false)} />

      {/* Data Selector Modal */}
      <DataSelectorModal isOpen={showDataSelector} onClose={() => setShowDataSelector(false)} />

      {/* Shape Selector Dropdown */}
      <ShapeSelectorDropdown
        isOpen={showShapeSelector}
        onClose={() => setShowShapeSelector(false)}
        buttonRef={shapeButtonRef}
      />
    </>
  );
}
