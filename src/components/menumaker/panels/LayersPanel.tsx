/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import {
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Copy,
  Database,
  Edit2,
  Eye,
  EyeOff,
  GripVertical,
  Image,
  Lock,
  Plus,
  Square,
  Trash2,
  Triangle,
  Type,
  Unlock,
  X,
} from "lucide-react";
import React, { useState } from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

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
    reorderLayers,
  } = useMenuMakerStore();

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);

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

  const handleToggleCollapse = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCollapsed = new Set(collapsedLayers);

    if (collapsedLayers.has(layerId)) {
      newCollapsed.delete(layerId);
    } else {
      newCollapsed.add(layerId);
    }
    setCollapsedLayers(newCollapsed);
  };

  const handleStartEditLayerName = (layerId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLayerId(layerId);
    setEditingName(currentName);
  };

  const handleCancelEditLayerName = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLayerId(null);
    setEditingName("");
  };

  const handleSaveLayerName = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editingName.trim() && editingLayerId) {
      updateLayerName(currentPageId!, editingLayerId, editingName.trim());
    }
    setEditingLayerId(null);
    setEditingName("");
  };

  const handleCancelEditLayerNameKeyboard = () => {
    setEditingLayerId(null);
    setEditingName("");
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", layerId);
  };

  const handleDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverLayerId(layerId);
  };

  const handleDragLeave = () => {
    setDragOverLayerId(null);
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    setDragOverLayerId(null);

    if (!draggedLayerId || draggedLayerId === targetLayerId) {
      setDraggedLayerId(null);
      return;
    }

    // Find the indices of the dragged and target layers
    const reversedLayers = [...currentPage.layers].reverse();
    const draggedIndex = reversedLayers.findIndex((layer) => layer.id === draggedLayerId);
    const targetIndex = reversedLayers.findIndex((layer) => layer.id === targetLayerId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Convert back to original indices (since we reversed the array for display)
      const originalDraggedIndex = currentPage.layers.length - 1 - draggedIndex;
      const originalTargetIndex = currentPage.layers.length - 1 - targetIndex;

      reorderLayers(currentPageId!, originalDraggedIndex, originalTargetIndex);
    }

    setDraggedLayerId(null);
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
    setDragOverLayerId(null);
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
            } ${draggedLayerId === layer.id ? "opacity-50" : ""} ${
              dragOverLayerId === layer.id ? "border-blue-400 border-2" : ""
            }`}
            onClick={() => handleLayerClick(layer.id)}
            draggable
            onDragStart={(e) => handleDragStart(e, layer.id)}
            onDragOver={(e) => handleDragOver(e, layer.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, layer.id)}
            onDragEnd={handleDragEnd}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                {/* Drag handle */}
                <div className="flex items-center space-x-2">
                  <div className="drag-handle cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Collapse toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-4 h-4 p-0"
                    onClick={(e) => handleToggleCollapse(layer.id, e)}
                    title={collapsedLayers.has(layer.id) ? "Expand layer" : "Collapse layer"}
                  >
                    {collapsedLayers.has(layer.id) ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </Button>

                  {/* Layer name and info */}
                  <div className="flex-1 min-w-0">
                    {editingLayerId === layer.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-6 text-sm font-medium"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveLayerName();
                            } else if (e.key === "Escape") {
                              handleCancelEditLayerNameKeyboard();
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveLayerName}
                          className="h-6 w-6 p-0"
                          title="Save layer name"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEditLayerName}
                          className="h-6 w-6 p-0"
                          title="Cancel editing"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900" title={layer.name}>
                          {layer.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleStartEditLayerName(layer.id, layer.name, e)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit layer name"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">{layer.elements.length} elements</div>
                  </div>
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

              {/* Elements list - only show when not collapsed */}
              {layer.elements.length > 0 && !collapsedLayers.has(layer.id) && (
                <div className="mt-2 ml-6 space-y-1">
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
                          {element.type === "shape" &&
                            (() => {
                              const shapeElement = element as any;
                              const IconComponent =
                                shapeElement.shapeType === "rectangle"
                                  ? Square
                                  : shapeElement.shapeType === "circle"
                                    ? Circle
                                    : shapeElement.shapeType === "triangle"
                                      ? Triangle
                                      : Square;

                              return (
                                <IconComponent className="w-3 h-3" style={{ color: shapeElement.fill || "#3B82F6" }} />
                              );
                            })()}
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
                            ) : element.type === "shape" ? (
                              (element as any).shapeType
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
