/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import {
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Database,
  Edit2,
  Eye,
  EyeOff,
  GripVertical,
  Image,
  Lock,
  Square,
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
    updateLayerName,
    updateLayerVisibility,
    updateLayerLock,
    selectLayer,
    selectElements,
    reorderLayers,
    setHoveredElement,
  } = useMenuMakerStore();

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<{ layerId: string; position: "above" | "below" } | null>(null);

  const currentPage = project?.pages.find((page) => page.id === currentPageId);

  if (!currentPage) return null;

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

    if (draggedLayerId === layerId) return;

    // Get the bounding rect of the layer element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    const mouseY = e.clientY;

    // Determine if we should drop above or below
    const position = mouseY < midPoint ? "above" : "below";

    setDropPosition({ layerId, position });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drop position if we're leaving the layers panel entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;

    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();

    if (!draggedLayerId || !dropPosition || draggedLayerId === targetLayerId) {
      setDropPosition(null);
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
      let originalTargetIndex = currentPage.layers.length - 1 - targetIndex;

      // Adjust target index based on drop position
      if (dropPosition.position === "below") {
        originalTargetIndex += 1;
      }

      // If we're moving down and dropping below, we need to adjust for the removal
      if (originalDraggedIndex < originalTargetIndex) {
        originalTargetIndex -= 1;
      }

      reorderLayers(currentPageId!, originalDraggedIndex, originalTargetIndex);
    }

    setDropPosition(null);
    setDraggedLayerId(null);
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
    setDropPosition(null);
  };

  const handleElementClick = (elementId: string, layerLocked: boolean, e: React.MouseEvent) => {
    e.stopPropagation();

    if (layerLocked) return;

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
      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {/* Render layers in reverse order (top layer first) */}
        {[...currentPage.layers].reverse().map((layer) => (
          <div key={layer.id} className="relative">
            {/* Drop indicator above */}
            {dropPosition?.layerId === layer.id && dropPosition.position === "above" && (
              <div className="absolute top-0 left-0 right-0 -mt-1 z-10">
                <div className="bg-blue-500 h-0.5 mx-3">
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded absolute -top-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    Drop here
                  </div>
                </div>
              </div>
            )}

            <div
              className={`group border-b border-gray-100 cursor-pointer transition-colors ${
                editorState.selectedLayerId === layer.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
              } ${draggedLayerId === layer.id ? "opacity-50" : ""}`}
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
                        onClick={(e) => handleElementClick(element.id, layer.locked, e)}
                        onMouseEnter={() => {
                          if (layer.locked) return;
                          setHoveredElement(element.id);
                        }}
                        onMouseLeave={() => {
                          if (layer.locked) return;
                          setHoveredElement(null);
                        }}
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
                                  <IconComponent
                                    className="w-3 h-3"
                                    style={{ color: shapeElement.fill || "#3B82F6" }}
                                  />
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

            {/* Drop indicator below */}
            {dropPosition?.layerId === layer.id && dropPosition.position === "below" && (
              <div className="absolute bottom-0 left-0 right-0 -mb-1 z-10">
                <div className="bg-blue-500 h-0.5 mx-3">
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded absolute -bottom-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    Drop here
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
