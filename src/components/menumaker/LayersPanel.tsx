/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { Copy, Database, Eye, EyeOff, Image, Lock, Plus, Trash2, Type, Unlock } from "lucide-react";
import React from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { Button } from "../ui/button";

export function LayersPanel() {
  const {
    project,
    currentPageId,
    editorState,
    addLayer,
    deleteLayer,
    duplicateLayer,
    updateLayerName,
    updateLayerVisibility,
    updateLayerLock,
    selectLayer,
    selectElements,
  } = useMenuMakerStore();

  const currentPage = project?.pages.find((page) => page.id === currentPageId);

  if (!currentPage) return null;

  const handleAddLayer = () => {
    const layerCount = currentPage.layers.length;

    addLayer(currentPageId!, `Layer ${layerCount + 1}`);
  };

  const handleLayerClick = (layerId: string) => {
    selectLayer(layerId);
  };

  const handleToggleVisibility = (layerId: string, visible: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    updateLayerVisibility(currentPageId!, layerId, !visible);
  };

  const handleToggleLock = (layerId: string, locked: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    updateLayerLock(currentPageId!, layerId, !locked);
  };

  const handleLayerNameChange = (layerId: string, name: string) => {
    updateLayerName(currentPageId!, layerId, name);
  };

  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (e.ctrlKey || e.metaKey) {
      // Multi-select mode
      const currentSelection = editorState.selectedElementIds;

      if (currentSelection.includes(elementId)) {
        // Remove from selection
        selectElements(currentSelection.filter((id) => id !== elementId));
      } else {
        // Add to selection
        selectElements([...currentSelection, elementId]);
      }
    } else {
      // Single select mode
      selectElements([elementId]);
    }
  };

  const handleDuplicateSelectedLayer = () => {
    if (editorState.selectedLayerId) {
      duplicateLayer(currentPageId!, editorState.selectedLayerId);
    }
  };

  const handleDeleteSelectedLayer = () => {
    if (editorState.selectedLayerId && currentPage.layers.length > 1) {
      deleteLayer(currentPageId!, editorState.selectedLayerId);
    }
  };

  // Helper function to get data element display information
  const getDataElementInfo = (element: any) => {
    if (element.type !== "data") return null;

    let dataType = "";
    let value = "";

    switch (element.dataType) {
      case "category":
        dataType = "Category";
        value = element.categoryData?.names?.en || element.categoryData?.name || "Select category";
        break;
      case "subcategory":
        dataType = "Subcategory";
        value = element.subcategoryData?.names?.en || element.subcategoryData?.name || "Select subcategory";
        break;
      case "menuitem":
        dataType = "Menu Item";
        value = element.subcategoryData?.names?.en || element.subcategoryData?.name || "Select subcategory";
        break;
      default:
        dataType = "Data";
        value = "Unknown";
    }

    return { dataType, value };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Layers</h3>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicateSelectedLayer}
              disabled={!editorState.selectedLayerId}
              title="Duplicate selected layer"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelectedLayer}
              disabled={!editorState.selectedLayerId || currentPage.layers.length <= 1}
              title="Delete selected layer"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddLayer}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {/* Render layers in reverse order (top layer first) */}
        {[...currentPage.layers].reverse().map((layer) => (
          <div
            key={layer.id}
            className={`group border-b border-gray-100 cursor-pointer transition-colors ${
              editorState.selectedLayerId === layer.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
            }`}
            onClick={() => handleLayerClick(layer.id)}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                {/* Layer name and info */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={layer.name}
                    onChange={(e) => handleLayerNameChange(layer.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none"
                  />
                  <div className="text-xs text-gray-500">{layer.elements.length} elements</div>
                </div>

                {/* Layer controls */}
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={(e) => handleToggleVisibility(layer.id, layer.visible, e)}
                    title={layer.visible ? "Hide layer" : "Show layer"}
                  >
                    {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={(e) => handleToggleLock(layer.id, layer.locked, e)}
                    title={layer.locked ? "Unlock layer" : "Lock layer"}
                  >
                    {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              {/* Elements list */}
              {layer.elements.length > 0 && (
                <div className="mt-2 ml-4 space-y-1">
                  {layer.elements.map((element) => (
                    <div
                      key={element.id}
                      className={`text-xs p-1 rounded transition-colors cursor-pointer ${
                        editorState.selectedElementIds.includes(element.id)
                          ? "bg-blue-100 text-blue-900"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      onClick={(e) => handleElementClick(element.id, e)}
                      title="Click to select element"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {element.type === "data" && <Database className="w-3 h-3 text-blue-600" />}
                          {element.type === "text" && <Type className="w-3 h-3 text-green-600" />}
                          {element.type === "image" && <Image className="w-3 h-3 text-purple-600" />}
                          <span className="capitalize">
                            {element.type === "data" ? (
                              (() => {
                                const dataInfo = getDataElementInfo(element);

                                return dataInfo ? `"${dataInfo.dataType}" - ${dataInfo.value}` : "Data";
                              })()
                            ) : element.type === "text" ? (
                              <>
                                {element.content
                                  ? `${element.content.length > 20 ? element.content.slice(0, 20) + "..." : element.content}`
                                  : ""}
                              </>
                            ) : element.type === "image" ? (
                              element.fileName
                            ) : (
                              element.type
                            )}
                          </span>
                        </div>
                        <span className="text-gray-400">
                          {Math.round(element.x)}, {Math.round(element.y)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
