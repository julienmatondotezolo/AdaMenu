import React from "react";

import { drawResizeHandles } from "./drawResizeHandles";

interface DrawImageElementParams {
  ctx: CanvasRenderingContext2D;
  element: any;
  canvas: any;
  isSelected: boolean;
  pageOffset: { x: number; y: number };
  tempElementPositions: Record<string, { x: number; y: number }>;
  tempElementDimensions: Record<string, { width: number; height: number; x?: number; y?: number }>;
  imageElementCache: Map<string, HTMLImageElement>;
  setImageElementCache: React.Dispatch<React.SetStateAction<Map<string, HTMLImageElement>>>;
}

export const drawImageElement = ({
  ctx,
  element,
  canvas,
  isSelected,
  pageOffset,
  tempElementPositions,
  tempElementDimensions,
  imageElementCache,
  setImageElementCache,
}: DrawImageElementParams) => {
  // Use temporary position/dimensions if dragging/resizing, otherwise use element values
  const tempPos = tempElementPositions[element.id];
  const tempDim = tempElementDimensions[element.id];

  const elementX = tempDim?.x !== undefined ? tempDim.x : tempPos ? tempPos.x : element.x;
  const elementY = tempDim?.y !== undefined ? tempDim.y : tempPos ? tempPos.y : element.y;
  const elementWidth = tempDim ? tempDim.width : element.width;
  const elementHeight = tempDim ? tempDim.height : element.height;

  const x = pageOffset.x + elementX * canvas.zoom;
  const y = pageOffset.y + elementY * canvas.zoom;
  const width = elementWidth * canvas.zoom;
  const height = elementHeight * canvas.zoom;

  // Draw image if available
  if (element.src) {
    const cachedImage = imageElementCache.get(element.src);

    if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0 && cachedImage.naturalHeight > 0) {
      // Image is loaded successfully and ready to draw
      ctx.save();
      ctx.globalAlpha = element.opacity ?? 1;

      // Draw the image scaled to fit the element dimensions
      ctx.drawImage(cachedImage, x, y, width, height);

      ctx.restore();
    } else if (cachedImage && cachedImage.complete && cachedImage.naturalWidth === 0) {
      // Image failed to load (broken state)
      ctx.fillStyle = "#ffebee";
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = "#f44336";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
      ctx.fillStyle = "#f44336";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("❌ Image Error", x + width / 2, y + height / 2 - 8);
      ctx.font = "12px Arial";
      ctx.fillText("Failed to load", x + width / 2, y + height / 2 + 8);
    } else if (!cachedImage) {
      // Load the image and cache it
      const img = new Image();

      img.crossOrigin = "anonymous"; // Enable CORS to prevent canvas tainting

      img.onload = () => {
        // Double-check the image loaded successfully
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          setImageElementCache((prev) => new Map(prev.set(element.src, img)));
          // Trigger a full canvas redraw when image loads successfully
        } else {
          console.warn("Image loaded but has no dimensions:", element.src);
          // Mark as failed by setting naturalWidth to 0 explicitly
          Object.defineProperty(img, 'naturalWidth', { value: 0 });
          Object.defineProperty(img, 'naturalHeight', { value: 0 });
          setImageElementCache((prev) => new Map(prev.set(element.src, img)));
        }
      };
      img.onerror = () => {
        console.warn("Failed to load image element:", element.src);
        // Mark as failed by setting naturalWidth to 0 explicitly
        Object.defineProperty(img, 'naturalWidth', { value: 0 });
        Object.defineProperty(img, 'naturalHeight', { value: 0 });
        setImageElementCache((prev) => new Map(prev.set(element.src, img)));
      };
      img.src = element.src;

      // Store the loading image in cache to prevent multiple loads
      setImageElementCache((prev) => new Map(prev.set(element.src, img)));

      // Draw placeholder while loading
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "#666";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Loading...", x + width / 2, y + height / 2);
    } else {
      // Image is loading, show placeholder
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "#666";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Loading...", x + width / 2, y + height / 2);
    }
  } else {
    // No src, draw placeholder
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No Image", x + width / 2, y + height / 2);
  }

  // Draw border
  ctx.strokeStyle = isSelected ? "#0066cc" : "transparent";
  ctx.lineWidth = isSelected ? 2 : 0;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, width, height);
  ctx.setLineDash([]);

  // Draw resize handles if selected
  if (isSelected) {
    drawResizeHandles(ctx, x, y, width, height);
  }
};
