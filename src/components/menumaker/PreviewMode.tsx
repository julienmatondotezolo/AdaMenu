import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";

interface PreviewModeProps {
  onExit: () => void;
  showExitButton?: boolean;
}

export function PreviewMode({ onExit, showExitButton = true }: PreviewModeProps) {
  const { generatePreviewImages, project, currentPageId, menuData } = useMenuMakerStore();
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Generate preview images when component mounts or menu data changes
  useEffect(() => {
    setIsGeneratingPreview(true);
    setPreviewImages([]); // Clear any existing images

    const generateImages = async () => {
      try {
        const images = await generatePreviewImages();

        setPreviewImages(images);
      } catch (error) {
        console.error("Failed to generate preview images:", error);
        setPreviewImages([]);
      } finally {
        setIsGeneratingPreview(false);
      }
    };

    generateImages();
  }, [generatePreviewImages, menuData]);

  // Scroll to current page when preview images are loaded
  useEffect(() => {
    if (previewImages.length > 0 && project && currentPageId) {
      // Find the index of the current page
      const currentPageIndex = project.pages.findIndex((page) => page.id === currentPageId);

      if (currentPageIndex !== -1 && pageRefs.current[currentPageIndex]) {
        // Small delay to ensure images are rendered
        setTimeout(() => {
          pageRefs.current[currentPageIndex]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      }
    }
  }, [previewImages, project, currentPageId]);

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-[#121212]">
      {/* Exit Preview Button */}
      {showExitButton && (
        <button
          onClick={onExit}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
          title="Exit Preview Mode"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Preview Content */}
      <div className="w-full h-full overflow-auto">
        {isGeneratingPreview ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Generating Preview</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Rendering your menu design...</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">This may take a few moments</p>
            </div>
          </div>
        ) : previewImages.length > 0 ? (
          <div className="flex flex-col items-center space-y-6 p-6 pt-20 relative">
            {/* Pages */}
            {previewImages.map((imageData, index) => (
              <div
                key={index}
                ref={(el) => {
                  pageRefs.current[index] = el;
                }}
                className="relative max-w-full"
              >
                {/* Page Number Badge */}
                <div className="absolute -top-3 left-4 z-10">
                  <span
                    className={`${
                      project && currentPageId && project.pages[index]?.id === currentPageId
                        ? "bg-green-600"
                        : "bg-blue-600"
                    } text-white text-xs font-medium px-2 py-1 rounded-full shadow-md`}
                  >
                    Page {index + 1}
                    {project && currentPageId && project.pages[index]?.id === currentPageId && (
                      <span className="ml-1">•</span>
                    )}
                  </span>
                </div>

                {/* Page Image */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
                  <img
                    src={imageData}
                    alt={`Page ${index + 1} Preview`}
                    className="max-w-full h-auto rounded border border-gray-200 dark:border-gray-600"
                    style={{ maxHeight: "70vh" }}
                  />
                </div>
              </div>
            ))}

            {/* Footer Info */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              This is a preview. Export to PDF for high-quality output.
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 dark:text-gray-300">No preview available</p>
          </div>
        )}
      </div>

      {/* Preview Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {previewImages.length === 1 ? "1 Page" : `${previewImages.length} Pages`}
        </span>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
        <span className="text-xs text-gray-500 dark:text-gray-400">Preview Quality</span>
      </div>
    </div>
  );
}
