import {
  Check,
  Clipboard,
  Copy,
  Database,
  Download,
  Edit2,
  Image,
  Loader2,
  MousePointer,
  Move,
  Redo,
  Save,
  Type,
  Undo,
  X,
} from "lucide-react";
import React, { useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { Tool } from "../../types/menumaker";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface ToolbarProps {
  onNewProject: () => void;
}

export function Toolbar({ onNewProject }: ToolbarProps) {
  const {
    project,
    currentPageId,
    editorState,
    setTool,
    addElement,
    saveProject,
    undo,
    redo,
    copy,
    paste,
    exportToPDF,
    isExportingPDF,
    updateProjectName,
  } = useMenuMakerStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");

  const { tool } = editorState;

  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "text", icon: Type, label: "Add Text" },
    { id: "image", icon: Image, label: "Add Image" },
    { id: "data", icon: Database, label: "Add Data" },
    { id: "pan", icon: Move, label: "Pan" },
  ] as const;

  const handleStartRename = () => {
    if (project) {
      setIsEditingName(true);
      setEditingName(project.name);
    }
  };

  const handleCancelRename = () => {
    setIsEditingName(false);
    setEditingName("");
  };

  const handleSaveRename = () => {
    if (editingName.trim() && project && editingName.trim() !== project.name) {
      updateProjectName(editingName.trim());
    }
    setIsEditingName(false);
    setEditingName("");
  };

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

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      {/* Left Section - File Actions */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onNewProject}>
          Go to Dashboard
        </Button>
        {/* Project Name with inline editing */}
        {project && (
          <>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="h-8 w-48"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveRename();
                    } else if (e.key === "Escape") {
                      handleCancelRename();
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={handleSaveRename} className="h-8 w-8 p-0">
                  <Check className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelRename} className="h-8 w-8 p-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="font-medium text-gray-900" title={project.name}>
                  {project.name.length > 10 ? `${project.name.substring(0, 10)}...` : project.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartRename}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </>
        )}
        <Button variant="outline" size="sm" onClick={undo}>
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={redo}>
          <Redo className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <Button variant="outline" size="sm" onClick={copy}>
          <Copy className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={paste}>
          <Clipboard className="w-4 h-4" />
        </Button>
      </div>

      {/* Center Section - Tools */}
      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
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

      {/* Right Section - View Controls */}
      <div className="flex items-center space-x-2">
        <div className="w-px h-6 bg-gray-300 mx-2" />

        <Button variant="outline" size="sm" onClick={saveProject}>
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={exportToPDF} disabled={isExportingPDF} title="Export to PDF">
          {isExportingPDF ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
          {isExportingPDF ? "Exporting..." : "Export"}
        </Button>
      </div>
    </div>
  );
}
