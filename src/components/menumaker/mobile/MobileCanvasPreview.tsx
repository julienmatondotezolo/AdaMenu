import { Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";
import { DataElement, ImageElement, MenuElement, ShapeElement, TextElement } from "../../../types/menumaker";
import { useMobileGestures } from "./useMobileGestures";

interface MobileCanvasPreviewProps {
  onElementSelect: (element: MenuElement, layerId: string) => void;
  selectedElementId: string | null;
}

interface ElementBounds {
  element: MenuElement;
  layerId: string;
  // Bounds relative to canvas (0-1 normalized)
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function MobileCanvasPreview({ onElementSelect, selectedElementId }: MobileCanvasPreviewProps) {
  const { project, currentPageId, generatePreviewImages, menuData } = useMenuMakerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [elementBounds, setElementBounds] = useState<ElementBounds[]>([]);

  const currentPage = project?.pages.find((p) => p.id === currentPageId);

  // Calculate element bounds for hit-testing
  useEffect(() => {
    if (!currentPage) {
      setElementBounds([]);
      return;
    }

    const bounds: ElementBounds[] = [];
    const pageWidth = currentPage.format.width;
    const pageHeight = currentPage.format.height;

    for (const layer of currentPage.layers) {
      if (!layer.visible || layer.locked) continue;

      for (const element of layer.elements) {
        if (!element.visible || element.locked) continue;

        // Normalize bounds to 0-1 range
        bounds.push({
          element,
          layerId: layer.id,
          left: element.x / pageWidth,
          top: element.y / pageHeight,
          right: (element.x + element.width) / pageWidth,
          bottom: (element.y + element.height) / pageHeight,
        });
      }
    }

    // Reverse so top-most elements (later in layers) are checked first
    setElementBounds(bounds.reverse());
  }, [currentPage]);

  // Generate preview image
  const regeneratePreview = useCallback(async () => {
    if (!project || !currentPageId) return;
    setIsGenerating(true);
    try {
      const images = await generatePreviewImages();
      const pageIndex = project.pages.findIndex((p) => p.id === currentPageId);
      if (pageIndex >= 0 && images[pageIndex]) {
        setPreviewImage(images[pageIndex]);
      }
    } catch (error) {
      console.error("Failed to generate preview:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [project, currentPageId, generatePreviewImages]);

  // Regenerate on page change or menu data change
  useEffect(() => {
    regeneratePreview();
  }, [currentPageId, menuData]);

  // Expose regenerate to parent via callback (regenerate when element changes)
  useEffect(() => {
    // Debounced regenerate when project data changes
    const timeout = setTimeout(() => {
      regeneratePreview();
    }, 500);
    return () => clearTimeout(timeout);
  }, [project?.updatedAt, regeneratePreview]);

  // Handle tap to find which element was tapped
  const handleTap = useCallback(
    (clientX: number, clientY: number) => {
      if (!imageRef.current || !containerRef.current) return;

      const imgRect = imageRef.current.getBoundingClientRect();

      // Calculate tap position relative to the image (0-1)
      const relX = (clientX - imgRect.left) / imgRect.width;
      const relY = (clientY - imgRect.top) / imgRect.height;

      // Check if tap is within image bounds
      if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return;

      // Find the top-most element that contains this point
      // Add 2% padding to each element for easier tapping (following Canva's approach)
      const PADDING = 0.02;

      for (const bound of elementBounds) {
        if (
          relX >= bound.left - PADDING &&
          relX <= bound.right + PADDING &&
          relY >= bound.top - PADDING &&
          relY <= bound.bottom + PADDING
        ) {
          onElementSelect(bound.element, bound.layerId);
          return;
        }
      }

      // Tapped on empty area — deselect
      onElementSelect(null as any, "");
    },
    [elementBounds, onElementSelect]
  );

  const handleDoubleTap = useCallback(() => {
    gestureHandlers.resetZoom();
  }, []);

  const gestureHandlers = useMobileGestures({
    onTap: handleTap,
    onDoubleTap: handleDoubleTap,
    minScale: 0.5,
    maxScale: 5,
  });

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-[#121212]">
        <p className="text-gray-500 dark:text-gray-400 text-sm">No page selected</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-gray-200 dark:bg-[#1a1a1a]"
      onTouchStart={gestureHandlers.handleTouchStart}
      onTouchMove={gestureHandlers.handleTouchMove}
      onTouchEnd={gestureHandlers.handleTouchEnd}
      style={{ touchAction: "none" }}
    >
      {/* Canvas Image Container */}
      <div
        className="w-full h-full flex items-center justify-center p-4"
        style={{
          transform: `scale(${gestureHandlers.scale}) translate(${gestureHandlers.offsetX / gestureHandlers.scale}px, ${gestureHandlers.offsetY / gestureHandlers.scale}px)`,
          transformOrigin: "center center",
          transition: "transform 0.1s ease-out",
        }}
      >
        {isGenerating && !previewImage ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Rendering preview...</p>
          </div>
        ) : previewImage ? (
          <div className="relative max-w-full max-h-full">
            <img
              ref={imageRef}
              src={previewImage}
              alt={`Page preview`}
              className="max-w-full max-h-full object-contain rounded-sm shadow-lg"
              style={{ maxHeight: "calc(100vh - 220px)" }}
              draggable={false}
            />

            {/* Selected Element Highlight Overlay */}
            {selectedElementId && imageRef.current && (
              <SelectedElementOverlay
                elementBounds={elementBounds}
                selectedElementId={selectedElementId}
                imageRef={imageRef}
              />
            )}

            {/* Generating indicator overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-white/30 dark:bg-black/30 flex items-center justify-center rounded-sm">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
            <p className="text-sm">No preview available</p>
          </div>
        )}
      </div>

      {/* Zoom indicator */}
      {gestureHandlers.scale !== 1 && (
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {Math.round(gestureHandlers.scale * 100)}%
        </div>
      )}

      {/* Tap hint */}
      {!selectedElementId && previewImage && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
          Tap any element to edit
        </div>
      )}
    </div>
  );
}

// Overlay component for highlighting the selected element
function SelectedElementOverlay({
  elementBounds,
  selectedElementId,
  imageRef,
}: {
  elementBounds: ElementBounds[];
  selectedElementId: string;
  imageRef: React.RefObject<HTMLImageElement | null>;
}) {
  const bound = elementBounds.find((b) => b.element.id === selectedElementId);
  if (!bound || !imageRef.current) return null;

  const imgRect = imageRef.current.getBoundingClientRect();
  const containerRect = imageRef.current.parentElement?.getBoundingClientRect();
  if (!containerRect) return null;

  // Calculate position relative to the parent container
  const imgOffsetX = imgRect.left - containerRect.left;
  const imgOffsetY = imgRect.top - containerRect.top;

  return (
    <div
      className="absolute pointer-events-none border-2 border-blue-500 rounded-sm"
      style={{
        left: imgOffsetX + bound.left * imgRect.width,
        top: imgOffsetY + bound.top * imgRect.height,
        width: (bound.right - bound.left) * imgRect.width,
        height: (bound.bottom - bound.top) * imgRect.height,
        boxShadow: "0 0 0 2000px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Corner dots */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
    </div>
  );
}
