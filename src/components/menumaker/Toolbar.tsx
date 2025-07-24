import {
  Clipboard,
  Copy,
  Download,
  Grid,
  Image,
  Loader2,
  MousePointer,
  Move,
  Palette,
  Redo,
  Ruler,
  Save,
  Type,
  Undo,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { Button } from "../ui/button";

interface ToolbarProps {
  onNewProject: () => void;
}

export function Toolbar({ onNewProject }: ToolbarProps) {
  const {
    editorState,
    setTool,
    setZoom,
    toggleGrid,
    toggleRulers,
    saveProject,
    undo,
    redo,
    copy,
    paste,
    exportToPDF,
    isExportingPDF,
  } = useMenuMakerStore();

  const { tool, canvas, ui } = editorState;

  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "text", icon: Type, label: "Add Text" },
    { id: "image", icon: Image, label: "Add Image" },
    { id: "background", icon: Palette, label: "Background" },
    { id: "pan", icon: Move, label: "Pan" },
  ] as const;

  const handleZoomIn = () => {
    setZoom(canvas.zoom * 1.2);
  };

  const handleZoomOut = () => {
    setZoom(canvas.zoom / 1.2);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      {/* Left Section - File Actions */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onNewProject}>
          New
        </Button>
        <Button variant="outline" size="sm" onClick={saveProject}>
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={exportToPDF} disabled={isExportingPDF} title="Export to PDF">
          {isExportingPDF ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
          {isExportingPDF ? "Exporting..." : "Export"}
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
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
            onClick={() => setTool(toolItem.id)}
            title={toolItem.label}
          >
            <toolItem.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {/* Right Section - View Controls */}
      <div className="flex items-center space-x-2">
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <Button variant={ui.showGrid ? "default" : "outline"} size="sm" onClick={toggleGrid} title="Toggle Grid">
          <Grid className="w-4 h-4" />
        </Button>
        <Button variant={ui.showRulers ? "default" : "outline"} size="sm" onClick={toggleRulers} title="Toggle Rulers">
          <Ruler className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-gray-600 min-w-[60px] text-center">{Math.round(canvas.zoom * 100)}%</span>
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
