import { Upload, X } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { ImageElement } from "../../types/menumaker";
import { Button } from "../ui/button";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageUploadModal({ isOpen, onClose }: ImageUploadModalProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { project, currentPageId, addElement, setTool } = useMenuMakerStore();

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (JPG, PNG, GIF)");
        return;
      }

      if (file.size > 30 * 1024 * 1024) {
        // 30MB limit
        alert("File size must be less than 30MB");
        return;
      }

      setIsLoading(true);

      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Get image dimensions
        const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          const img = new Image();

          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = reject;
          img.src = base64;
        });

        // Create ImageElement
        if (project && currentPageId) {
          const currentPage = project.pages.find((page) => page.id === currentPageId);

          if (currentPage && currentPage.layers.length > 0) {
            // Calculate center position based on page format
            const centerX = (currentPage.format.width - 1000) / 2;
            const centerY = (currentPage.format.height - 400) / 2;

            const newImageElement: Omit<ImageElement, "id"> = {
              type: "image",
              fileName: file.name,
              x: centerX, // Top left of canvas
              y: centerY, // Top left of canvas
              width,
              height,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              zIndex: 1,
              locked: false,
              visible: true,
              opacity: 1,
              src: base64,
              originalWidth: width,
              originalHeight: height,
            };

            // Add to first layer
            addElement(currentPageId, currentPage.layers[0].id, newImageElement);

            // Switch back to select tool
            setTool("select");

            // Close modal
            onClose();
          }
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [project, currentPageId, addElement, setTool, onClose],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);

      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upload your image</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">Drag & drop image here to upload</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Upload an image in JPG, GIF, or PNG. The maximum upload size is 30 Mb.
                </p>
              </div>

              <Button
                onClick={handleFileSelect}
                disabled={isLoading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isLoading ? "Uploading..." : "Select from device"}</span>
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isLoading}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-start p-4 border-t border-gray-200">
          <Button onClick={onClose} variant="outline" disabled={isLoading}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
