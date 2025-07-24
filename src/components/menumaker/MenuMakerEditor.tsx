import React, { useEffect, useRef } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { CanvasArea } from "./CanvasArea";
import { LayersPanel } from "./LayersPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { ThumbnailsPanel } from "./ThumbnailsPanel";
import { Toolbar } from "./Toolbar";

interface MenuMakerEditorProps {
  onNewProject: () => void;
}

export function MenuMakerEditor({ onNewProject }: MenuMakerEditorProps) {
  const { project, currentPageId, editorState, saveProject } = useMenuMakerStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (project) {
        saveProject();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [project, saveProject]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s":
            e.preventDefault();
            saveProject();
            break;
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              // Redo
            } else {
              // Undo
            }
            break;
          case "c":
            e.preventDefault();
            // Copy
            break;
          case "v":
            e.preventDefault();
            // Paste
            break;
          case "x":
            e.preventDefault();
            // Cut
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveProject]);

  if (!project || !currentPageId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No project loaded</h2>
          <p className="text-gray-600 mb-4">Create a new project to get started</p>
          <button onClick={onNewProject} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            New Project
          </button>
        </div>
      </div>
    );
  }

  const currentPage = project.pages.find((page) => page.id === currentPageId);

  if (!currentPage) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
          <p className="text-gray-600">The selected page could not be loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100" ref={containerRef}>
      {/* Top Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-300 bg-white">
        <Toolbar onNewProject={onNewProject} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Thumbnails */}
        {editorState.ui.thumbnailsPanelOpen && (
          <div className="w-64 flex-shrink-0 border-r border-gray-300 bg-white">
            <ThumbnailsPanel />
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden">
          <CanvasArea />
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0 border-l border-gray-300 bg-white flex flex-col">
          {/* Layers Panel */}
          {editorState.ui.layersPanelOpen && (
            <div className="flex-1 border-b border-gray-300">
              <LayersPanel />
            </div>
          )}

          {/* Properties Panel */}
          {editorState.ui.propertiesPanelOpen && (
            <div className="flex-1">
              <PropertiesPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
