import React, { useCallback, useEffect, useState } from "react";

import { fetchCompleteMenu } from "../../../_services/ada/adaMenuService";
import { useMenuMakerStore } from "../../../stores/menumaker";
import { DataElement, ImageElement, MenuElement, ShapeElement, TextElement } from "../../../types/menumaker";
import { ExportLoader } from "../ExportLoader";
import { MobileActionBar } from "./MobileActionBar";
import { MobileBottomSheet } from "./MobileBottomSheet";
import { MobileCanvasPreview } from "./MobileCanvasPreview";
import { MobileDataEditor } from "./MobileDataEditor";
import { MobileImageEditor } from "./MobileImageEditor";
import { MobilePageStrip } from "./MobilePageStrip";
import { MobileShapeEditor } from "./MobileShapeEditor";
import { MobileTextEditor } from "./MobileTextEditor";
import { MobileTopBar } from "./MobileTopBar";

interface MobileMenuMakerProps {
  onBack: () => void;
}

export function MobileMenuMaker({ onBack }: MobileMenuMakerProps) {
  const {
    project,
    currentPageId,
    setMenuData,
    setMenuLoading,
    setMenuError,
  } = useMenuMakerStore();

  const [selectedElement, setSelectedElement] = useState<MenuElement | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string>("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch fresh menu data on mount (same as desktop MenuMakerEditor)
  useEffect(() => {
    const loadMenuData = async () => {
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

  // Handle element selection from canvas tap
  const handleElementSelect = useCallback((element: MenuElement | null, layerId: string) => {
    if (!element) {
      // Deselect
      setSelectedElement(null);
      setSelectedLayerId("");
      setIsSheetOpen(false);
      return;
    }

    // Skip background elements (not editable in quick edit)
    if (element.type === "background") return;

    setSelectedElement(element);
    setSelectedLayerId(layerId);
    setIsSheetOpen(true);
  }, []);

  // Handle sheet close
  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false);
    setSelectedElement(null);
    setSelectedLayerId("");
  }, []);

  // Get bottom sheet title based on element type
  const getSheetTitle = (): string => {
    if (!selectedElement) return "Edit Element";

    switch (selectedElement.type) {
      case "text":
        return "Edit Text";
      case "data": {
        const dataEl = selectedElement as DataElement;
        switch (dataEl.dataType) {
          case "category":
            return "Edit Category Title";
          case "subcategory":
            return "Edit Subcategory Title";
          case "menuitem":
            return "Edit Menu Items";
          default:
            return "Edit Data";
        }
      }
      case "image":
        return "Edit Image";
      case "shape":
        return "Edit Shape";
      default:
        return "Edit Element";
    }
  };

  // Render the appropriate editor for the selected element
  const renderEditor = () => {
    if (!selectedElement || !currentPageId) return null;

    switch (selectedElement.type) {
      case "text":
        return (
          <MobileTextEditor
            element={selectedElement as TextElement}
            pageId={currentPageId}
            layerId={selectedLayerId}
          />
        );
      case "data":
        return (
          <MobileDataEditor
            element={selectedElement as DataElement}
            pageId={currentPageId}
            layerId={selectedLayerId}
          />
        );
      case "image":
        return (
          <MobileImageEditor
            element={selectedElement as ImageElement}
            pageId={currentPageId}
            layerId={selectedLayerId}
          />
        );
      case "shape":
        return (
          <MobileShapeEditor
            element={selectedElement as ShapeElement}
            pageId={currentPageId}
            layerId={selectedLayerId}
          />
        );
      default:
        return (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            <p className="text-sm">This element type cannot be edited on mobile.</p>
            <p className="text-xs mt-1">Use a desktop computer for advanced editing.</p>
          </div>
        );
    }
  };

  if (!project || !currentPageId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-[#121212]">
        <div className="text-center px-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No project loaded</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select a project from the dashboard to start editing
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-[#121212]">
      {/* Top Bar */}
      <MobileTopBar onBack={onBack} />

      {/* Canvas Preview (fills remaining space) */}
      <MobileCanvasPreview
        onElementSelect={handleElementSelect}
        selectedElementId={selectedElement?.id || null}
      />

      {/* Page Strip (only if multiple pages) */}
      <MobilePageStrip />

      {/* Action Bar */}
      <MobileActionBar />

      {/* Bottom Sheet Editor */}
      <MobileBottomSheet
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        title={getSheetTitle()}
      >
        {renderEditor()}
      </MobileBottomSheet>

      {/* Export Loader */}
      <ExportLoader />
    </div>
  );
}
