import React from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";
import { ImageElement } from "../../../types/menumaker";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

export function ImagePanel() {
  const { project, currentPageId, editorState, updateElement } = useMenuMakerStore();

  const currentPage = project?.pages.find((page) => page.id === currentPageId);
  const selectedElements =
    currentPage?.layers
      .flatMap((layer) => layer.elements)
      .filter((element) => editorState.selectedElementIds.includes(element.id) && element.type === "image") || [];

  if (!currentPage || selectedElements.length === 0) return null;

  const handleElementUpdate = (elementId: string, updates: any) => {
    // Find the layer containing this element
    const layer = currentPage.layers.find((layer) => layer.elements.some((element) => element.id === elementId));

    if (layer) {
      updateElement(currentPageId!, layer.id, elementId, updates);
    }
  };

  // If multiple images are selected, show multi-element controls
  if (selectedElements.length > 1) {
    return (
      <div className="p-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">{selectedElements.length} Image Elements</h4>
        <div className="text-sm text-gray-500">
          Multi-image editing coming soon. Select a single image to edit its properties.
        </div>
      </div>
    );
  }

  // Single image element
  const imageElement = selectedElements[0] as ImageElement;

  const onUpdate = (updates: any) => handleElementUpdate(imageElement.id, updates);

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 mb-3">Position & Size</h4>
        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="image-x">X</Label>
            <Input
              id="image-x"
              type="number"
              value={Math.round(imageElement.x)}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="image-y">Y</Label>
            <Input
              id="image-y"
              type="number"
              value={Math.round(imageElement.y)}
              onChange={(e) => onUpdate({ y: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="image-width">Width</Label>
            <Input
              id="image-width"
              type="number"
              value={Math.round(imageElement.width)}
              onChange={(e) => onUpdate({ width: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="image-height">Height</Label>
            <Input
              id="image-height"
              type="number"
              value={Math.round(imageElement.height)}
              onChange={(e) => onUpdate({ height: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Original Dimensions (Read-only) */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Original Width</Label>
            <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600">
              {imageElement.originalWidth}px
            </div>
          </div>
          <div>
            <Label>Original Height</Label>
            <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600">
              {imageElement.originalHeight}px
            </div>
          </div>
        </div>

        {/* File Name (Read-only) */}
        <div>
          <Label>File Name</Label>
          <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600">
            {imageElement.fileName}
          </div>
        </div>

        {/* Crop Settings */}
        {imageElement.crop && (
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-2 block">Crop Settings</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="crop-x">Crop X</Label>
                <Input
                  id="crop-x"
                  type="number"
                  value={Math.round(imageElement.crop.x)}
                  onChange={(e) =>
                    onUpdate({
                      crop: { ...imageElement.crop, x: Number(e.target.value) },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="crop-y">Crop Y</Label>
                <Input
                  id="crop-y"
                  type="number"
                  value={Math.round(imageElement.crop.y)}
                  onChange={(e) =>
                    onUpdate({
                      crop: { ...imageElement.crop, y: Number(e.target.value) },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="crop-width">Crop Width</Label>
                <Input
                  id="crop-width"
                  type="number"
                  value={Math.round(imageElement.crop.width)}
                  onChange={(e) =>
                    onUpdate({
                      crop: { ...imageElement.crop, width: Number(e.target.value) },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="crop-height">Crop Height</Label>
                <Input
                  id="crop-height"
                  type="number"
                  value={Math.round(imageElement.crop.height)}
                  onChange={(e) =>
                    onUpdate({
                      crop: { ...imageElement.crop, height: Number(e.target.value) },
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Image Filters */}
        {imageElement.filters && (
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-2 block">Filters</Label>
            <div className="space-y-3">
              {/* Brightness */}
              <div>
                <Label htmlFor="filter-brightness">Brightness</Label>
                <Input
                  id="filter-brightness"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={imageElement.filters.brightness}
                  onChange={(e) =>
                    onUpdate({
                      filters: { ...imageElement.filters, brightness: Number(e.target.value) },
                    })
                  }
                  className="mt-1"
                />
                <div className="text-xs text-gray-500 mt-1">{Math.round(imageElement.filters.brightness * 100)}%</div>
              </div>

              {/* Contrast */}
              <div>
                <Label htmlFor="filter-contrast">Contrast</Label>
                <Input
                  id="filter-contrast"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={imageElement.filters.contrast}
                  onChange={(e) =>
                    onUpdate({
                      filters: { ...imageElement.filters, contrast: Number(e.target.value) },
                    })
                  }
                  className="mt-1"
                />
                <div className="text-xs text-gray-500 mt-1">{Math.round(imageElement.filters.contrast * 100)}%</div>
              </div>

              {/* Saturation */}
              <div>
                <Label htmlFor="filter-saturation">Saturation</Label>
                <Input
                  id="filter-saturation"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={imageElement.filters.saturation}
                  onChange={(e) =>
                    onUpdate({
                      filters: { ...imageElement.filters, saturation: Number(e.target.value) },
                    })
                  }
                  className="mt-1"
                />
                <div className="text-xs text-gray-500 mt-1">{Math.round(imageElement.filters.saturation * 100)}%</div>
              </div>

              {/* Blur */}
              <div>
                <Label htmlFor="filter-blur">Blur</Label>
                <Input
                  id="filter-blur"
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={imageElement.filters.blur}
                  onChange={(e) =>
                    onUpdate({
                      filters: { ...imageElement.filters, blur: Number(e.target.value) },
                    })
                  }
                  className="mt-1"
                />
                <div className="text-xs text-gray-500 mt-1">{imageElement.filters.blur}px</div>
              </div>

              {/* Sepia */}
              <div>
                <Label htmlFor="filter-sepia">Sepia</Label>
                <Input
                  id="filter-sepia"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={imageElement.filters.sepia}
                  onChange={(e) =>
                    onUpdate({
                      filters: { ...imageElement.filters, sepia: Number(e.target.value) },
                    })
                  }
                  className="mt-1"
                />
                <div className="text-xs text-gray-500 mt-1">{Math.round(imageElement.filters.sepia * 100)}%</div>
              </div>

              {/* Grayscale */}
              <div>
                <Label htmlFor="filter-grayscale">Grayscale</Label>
                <Input
                  id="filter-grayscale"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={imageElement.filters.grayscale}
                  onChange={(e) =>
                    onUpdate({
                      filters: { ...imageElement.filters, grayscale: Number(e.target.value) },
                    })
                  }
                  className="mt-1"
                />
                <div className="text-xs text-gray-500 mt-1">{Math.round(imageElement.filters.grayscale * 100)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Overall Opacity */}
        <div>
          <Label htmlFor="image-opacity">Overall Opacity</Label>
          <Input
            id="image-opacity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={imageElement.opacity}
            onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
            className="mt-1"
          />
          <div className="text-xs text-gray-500 mt-1">{Math.round(imageElement.opacity * 100)}%</div>
        </div>
      </div>
    </div>
  );
}
