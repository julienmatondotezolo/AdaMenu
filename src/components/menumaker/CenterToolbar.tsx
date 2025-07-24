import { ChevronLeft, ChevronRight, Grid, Minus, Plus, Ruler } from "lucide-react";
import React from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { Button } from "../ui/button";

export function CenterToolbar() {
  const { project, currentPageId, editorState, setCurrentPage, setZoom, toggleGrid, toggleRulers } =
    useMenuMakerStore();

  if (!project || !currentPageId) return null;

  const currentPageIndex = project.pages.findIndex((page) => page.id === currentPageId);
  const totalPages = project.pages.length;
  const { zoom } = editorState.canvas;
  const { ui } = editorState;

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPage(project.pages[currentPageIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPage(project.pages[currentPageIndex + 1].id);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5);

    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);

    setZoom(newZoom);
  };

  const handleFitToScreen = () => {
    // This will be implemented to fit the page to the viewport
    setZoom(1);
  };

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800/95 text-white rounded-full px-4 py-2 flex items-center gap-3 shadow-lg">
        {/* Navigation arrows */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPageIndex === 0}
          className="h-8 w-8 p-0 text-white hover:bg-gray-700 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page counter */}
        <div className="flex items-center gap-1 text-sm font-medium min-w-[60px] justify-center">
          <span>{currentPageIndex + 1}</span>
          <span className="text-gray-400">/</span>
          <span>{totalPages}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPageIndex === totalPages - 1}
          className="h-8 w-8 p-0 text-white hover:bg-gray-700 disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-600" />

        {/* Zoom controls */}
        <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0 text-white hover:bg-gray-700">
          <Minus className="w-4 h-4" />
        </Button>

        <div className="text-sm font-medium min-w-[50px] text-center">{zoomPercentage}%</div>

        <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0 text-white hover:bg-gray-700">
          <Plus className="w-4 h-4" />
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-600" />

        {/* Grid and Rulers toggle */}
        <Button
          variant={ui.showGrid ? "default" : "ghost"}
          size="sm"
          onClick={toggleGrid}
          className="h-8 w-8 p-0 text-white hover:bg-gray-700"
          title="Toggle Grid"
        >
          <Grid className="w-4 h-4" />
        </Button>

        <Button
          variant={ui.showRulers ? "default" : "ghost"}
          size="sm"
          onClick={toggleRulers}
          className="h-8 w-8 p-0 text-white hover:bg-gray-700"
          title="Toggle Rulers"
        >
          <Ruler className="w-4 h-4" />
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-600" />

        {/* Fit button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFitToScreen}
          className="h-8 px-3 text-white hover:bg-gray-700 text-sm"
        >
          Fit
        </Button>
      </div>
    </div>
  );
}
