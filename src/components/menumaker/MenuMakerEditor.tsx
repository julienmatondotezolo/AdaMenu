/* eslint-disable prettier/prettier */
/* eslint-disable indent */
import { ChevronDown, ChevronRight, Copy, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { fetchCompleteMenu } from "../../_services/ada/adaMenuService";
import { useMenuMakerStore } from "../../stores/menumaker";
import { Button } from "../ui/button";
import { CanvasArea } from "./CanvasArea";
import { CenterToolbar } from "./CenterToolbar";
import { ExportLoader } from "./ExportLoader";
import { MainToolbar } from "./MainToolbar";
import { BackgroundPanel } from "./panels/BackgroundPanel";
import { DataPanel } from "./panels/DataPanel";
import { ImagePanel } from "./panels/ImagePanel";
import { LayersPanel } from "./panels/LayersPanel";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { ShapePanel } from "./panels/ShapePanel";
import { ThumbnailsPanel } from "./panels/ThumbnailsPanel";
import { PreviewMode } from "./PreviewMode";
import { TopNavBar } from "./TopNavBar";

interface MenuMakerEditorProps {
  onNewProject: () => void;
}

export function MenuMakerEditor({ onNewProject }: MenuMakerEditorProps) {
  const { project, currentPageId, editorState, saveProject, setMenuData, setMenuLoading, setMenuError, addLayer, deleteLayer, duplicateLayer, selectLayer, isPreviewMode, setPreviewMode } =
    useMenuMakerStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [backgroundCollapsed, setBackgroundCollapsed] = useState(false);
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
  const [shapePropertiesCollapsed, setShapePropertiesCollapsed] = useState(false);
  const [imagePropertiesCollapsed, setImagePropertiesCollapsed] = useState(false);

  // Fetch fresh menu data every time component loads
  useEffect(() => {
    const loadMenuData = async () => {
      // Always fetch fresh data on component mount
      setMenuLoading(true);
      setMenuError(null);

      try {
        const menuResponse = await fetchCompleteMenu();

        if (menuResponse && Array.isArray(menuResponse)) {
          setMenuData(menuResponse);
        } else {
          setMenuError("Invalid menu data format received");
        }
      } catch (error) {
        console.error("Error fetching menu data:", error);
        setMenuError(error instanceof Error ? error.message : "Unknown error occurred");
      } finally {
        setMenuLoading(false);
      }
    };

    loadMenuData();
  }, [setMenuData, setMenuLoading, setMenuError]);



  // Handler for adding a new layer
  const handleAddLayer = () => {
    if (!currentPageId || !currentPage) return;
    
    const layerCount = currentPage.layers.length;

    addLayer(currentPageId, `Layer ${layerCount + 1}`);
  };

  // Handler for duplicating the selected layer
  const handleDuplicateLayer = () => {
    if (!currentPageId || !editorState.selectedLayerId) return;

    duplicateLayer(currentPageId, editorState.selectedLayerId);
  };

  // Handler for deleting the selected layer
  const handleDeleteLayer = () => {
    if (!currentPageId || !editorState.selectedLayerId || !currentPage) return;
    
    // Prevent deleting the last layer
    if (currentPage.layers.length <= 1) return;

    deleteLayer(currentPageId, editorState.selectedLayerId);
    selectLayer(null);
  };

  // Unselect layer when layers panel is collapsed
  useEffect(() => {
    if (layersCollapsed && editorState.selectedLayerId) {
      selectLayer(null);
    }
  }, [layersCollapsed, editorState.selectedLayerId, selectLayer]);



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

  // Check if any selected element is a data element
  const hasSelectedDataElement = selectedElements.some((element) => element.type === "data");

  // Check if any selected element is a shape element
  const hasSelectedShapeElement = selectedElements.some((element) => element.type === "shape");

  // Check if any selected element is an image element
  const hasSelectedImageElement = selectedElements.some((element) => element.type === "image");

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
      {isPreviewMode ? (
        <PreviewMode onExit={() => setPreviewMode(false)} />
      ) : (
        <>
          {/* Top Toolbar */}
          <div className="flex-shrink-0 border-b border-gray-300 bg-white">
            <TopNavBar onNewProject={onNewProject} />
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
              <MainToolbar />
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
                  <div className="flex items-center space-x-4">
                  <h3 className="font-semibold text-gray-900">Layers</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddLayer();
                      }}
                      title="Add new layer"
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Show duplicate and delete buttons only when a layer is selected */}
                    {editorState.selectedLayerId && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateLayer();
                          }}
                          title="Duplicate selected layer"
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLayer();
                          }}
                          disabled={currentPage.layers.length <= 1}
                          title="Delete selected layer"
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
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
            {selectedElements.length > 0 &&
              editorState.ui.propertiesPanelOpen &&
              !hasSelectedDataElement &&
              !hasSelectedShapeElement &&
              !hasSelectedImageElement && (
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

            {/* Shape Properties Panel */}
            {hasSelectedShapeElement && editorState.ui.propertiesPanelOpen && (
              <div className="border-b border-gray-300">
                {/* Shape Properties Header */}
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => setShapePropertiesCollapsed(!shapePropertiesCollapsed)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setShapePropertiesCollapsed(!shapePropertiesCollapsed);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={!shapePropertiesCollapsed}
                  aria-controls="shape-properties-content"
                >
                  <h3 className="font-semibold text-gray-900">Properties</h3>
                  <div className="flex items-center">
                    {shapePropertiesCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Shape Properties Content */}
                {!shapePropertiesCollapsed && (
                  <div id="shape-properties-content" className="overflow-y-auto">
                    <ShapePanel />
                  </div>
                )}
              </div>
            )}

            {/* Image Properties Panel */}
            {hasSelectedImageElement && editorState.ui.propertiesPanelOpen && (
              <div className="border-b border-gray-300">
                {/* Image Properties Header */}
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => setImagePropertiesCollapsed(!imagePropertiesCollapsed)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setImagePropertiesCollapsed(!imagePropertiesCollapsed);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={!imagePropertiesCollapsed}
                  aria-controls="image-properties-content"
                >
                  <h3 className="font-semibold text-gray-900">Properties</h3>
                  <div className="flex items-center">
                    {imagePropertiesCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Image Properties Content */}
                {!imagePropertiesCollapsed && (
                  <div id="image-properties-content" className="overflow-y-auto">
                    <ImagePanel />
                  </div>
                )}
              </div>
            )}

            {/* Data Panel - shown when data tool is selected OR when data element is selected */}
            {(editorState.tool === "data" || hasSelectedDataElement) && (
              <div className="border-b border-gray-300">
                {hasSelectedDataElement && (
                  <>
                    {/* Data Properties Header */}
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
                      aria-controls="data-properties-content"
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

                    {/* Data Properties Content */}
                    {!propertiesCollapsed && (
                      <div id="data-properties-content" className="overflow-y-auto">
                        <DataPanel />
                      </div>
                    )}
                  </>
                )}
                {editorState.tool === "data" && !hasSelectedDataElement && <DataPanel />}
              </div>
            )}

            {/* Background Panel (Removed - use Data Panel instead) */}
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
                <div id="background-content" className="overflow-y-auto">
                  <BackgroundPanel />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Export Loader */}
      <ExportLoader />
    </div>
  );
}
