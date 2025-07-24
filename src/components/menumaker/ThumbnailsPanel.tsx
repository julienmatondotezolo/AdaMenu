/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { Copy, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { Button } from "../ui/button";

export function ThumbnailsPanel() {
  const { project, currentPageId, setCurrentPage, addPage, deletePage, duplicatePage, reorderPages } =
    useMenuMakerStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!project) return null;

  const handlePageClick = (pageId: string) => {
    setCurrentPage(pageId);
  };

  const handleAddPage = () => {
    addPage();
  };

  const handleDuplicatePage = (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicatePage(pageId);
  };

  const handleDeletePage = (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.pages.length > 1) {
      deletePage(pageId);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      reorderPages(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            {project.pages.length} {project.pages.length > 1 ? "pages" : "page"}
          </h3>
          <Button variant="outline" size="sm" onClick={handleAddPage}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {project.pages.map((page, index) => (
          <div
            key={page.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative group cursor-pointer rounded-lg border-2 transition-all duration-200 ${
              currentPageId === page.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
            } ${draggedIndex === index ? "opacity-50 scale-95" : ""} ${
              dragOverIndex === index && draggedIndex !== index ? "border-green-400 bg-green-50 scale-105" : ""
            }`}
            onClick={() => handlePageClick(page.id)}
          >
            {/* Thumbnail */}
            <div className="p-3">
              <div
                className="bg-white border border-gray-200 rounded shadow-sm mx-auto"
                style={{
                  width: "160px",
                  height: `${(160 * page.format.height) / page.format.width}px`,
                  maxHeight: "200px",
                  backgroundColor: page.backgroundColor,
                }}
              >
                {/* Page content preview would go here */}
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  {page.layers.reduce((total, layer) => total + layer.elements.length, 0)} elements
                </div>
              </div>

              {/* Page Info */}
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-gray-900">{page.name}</div>
                <div className="text-xs text-gray-500">
                  {page.format.name} ({page.format.printWidth}×{page.format.printHeight}mm)
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-6 h-6 p-0"
                  onClick={(e) => handleDuplicatePage(page.id, e)}
                  title="Duplicate page"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                {project.pages.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={(e) => handleDeletePage(page.id, e)}
                    title="Delete page"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Page number */}
            <div className="absolute top-2 left-2">
              <div className="bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded">{index + 1}</div>
            </div>

            {/* Drag indicator */}
            {draggedIndex === index && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-75 rounded-lg">
                <div className="text-blue-600 text-sm font-medium">Moving...</div>
              </div>
            )}

            {dragOverIndex === index && draggedIndex !== index && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-100 bg-opacity-75 rounded-lg">
                <div className="text-green-600 text-sm font-medium">Drop here</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
