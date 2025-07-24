import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { BackgroundPanel } from "./BackgroundPanel";
import { CanvasArea } from "./CanvasArea";
import { CenterToolbar } from "./CenterToolbar";
import { ExportLoader } from "./ExportLoader";
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
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [backgroundCollapsed, setBackgroundCollapsed] = useState(false);
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);

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

  const selectedElements =
    currentPage?.layers
      .flatMap((layer) => layer.elements)
      .filter((element) => editorState.selectedElementIds.includes(element.id)) || [];

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
        <div className="flex-1 overflow-hidden relative">
          <CanvasArea />
          <CenterToolbar />
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0 border-l border-gray-300 bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {/* Layers Panel */}
            {editorState.ui.layersPanelOpen && (
              <div className="border-b border-gray-300">
                {/* Layers Header */}
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => setLayersCollapsed(!layersCollapsed)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLayersCollapsed(!layersCollapsed);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={!layersCollapsed}
                  aria-controls="layers-content"
                >
                  <h3 className="font-semibold text-gray-900">Layers</h3>
                  <div className="flex items-center">
                    {layersCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Layers Content */}
                {!layersCollapsed && (
                  <div id="layers-content" className="max-h-96 overflow-y-auto">
                    <LayersPanel />
                  </div>
                )}
              </div>
            )}

            {/* Properties Panel */}
            {selectedElements.length > 0 && editorState.ui.propertiesPanelOpen && (
              <div>
                {/* Properties Header */}
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => setPropertiesCollapsed(!propertiesCollapsed)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPropertiesCollapsed(!propertiesCollapsed);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={!propertiesCollapsed}
                  aria-controls="properties-content"
                >
                  <h3 className="font-semibold text-gray-900">Properties</h3>
                  <div className="flex items-center">
                    {propertiesCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Properties Content */}
                {!propertiesCollapsed && (
                  <div id="properties-content" className="overflow-y-auto">
                    <PropertiesPanel />
                  </div>
                )}
              </div>
            )}

            {/* Background Panel */}
            {editorState.ui.layersPanelOpen && (
              <div className="border-b border-gray-300">
                {/* Background Header */}
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => setBackgroundCollapsed(!backgroundCollapsed)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setBackgroundCollapsed(!backgroundCollapsed);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={!backgroundCollapsed}
                  aria-controls="background-content"
                >
                  <h3 className="font-semibold text-gray-900">Background</h3>
                  <div className="flex items-center">
                    {backgroundCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Background Content */}
                {!backgroundCollapsed && (
                  <div id="background-content" className="max-h-96 overflow-y-auto">
                    <BackgroundPanel />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Loader */}
      <ExportLoader />
    </div>
  );
}
