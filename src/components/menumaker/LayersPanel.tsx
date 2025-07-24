import { Copy, Eye, EyeOff, Lock, Plus, Trash2, Unlock } from "lucide-react";
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

  const handleDuplicateLayer = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateLayer(currentPageId!, layerId);
  };

  const handleDeleteLayer = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage.layers.length > 1) {
      deleteLayer(currentPageId!, layerId);
    }
  };

  const handleLayerNameChange = (layerId: string, name: string) => {
    updateLayerName(currentPageId!, layerId, name);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Layers</h3>
          <Button variant="outline" size="sm" onClick={handleAddLayer}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {/* Render layers in reverse order (top layer first) */}
        {[...currentPage.layers].reverse().map((layer, index) => (
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
                      className={`text-xs p-1 rounded transition-colors ${
                        editorState.selectedElementIds.includes(element.id)
                          ? "bg-blue-100 text-blue-900"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="capitalize">
                          {element.type}{" "}
                          {element.type === "text" && element.content ? `"${element.content.slice(0, 20)}..."` : ""}
                        </span>
                        <span className="text-gray-400">
                          {Math.round(element.x)}, {Math.round(element.y)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Layer actions (visible on hover) */}
              <div className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={(e) => handleDuplicateLayer(layer.id, e)}
                    title="Duplicate layer"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {currentPage.layers.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-6 h-6 p-0"
                      onClick={(e) => handleDeleteLayer(layer.id, e)}
                      title="Delete layer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
