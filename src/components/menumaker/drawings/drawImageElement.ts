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

    if (cachedImage && cachedImage.complete) {
      // Image is loaded and ready to draw
      ctx.save();
      ctx.globalAlpha = element.opacity ?? 1;

      // Draw the image scaled to fit the element dimensions
      ctx.drawImage(cachedImage, x, y, width, height);

      ctx.restore();
    } else if (!cachedImage) {
      // Load the image and cache it
      const img = new Image();

      img.crossOrigin = "anonymous"; // Enable CORS to prevent canvas tainting

      img.onload = () => {
        setImageElementCache((prev) => new Map(prev.set(element.src, img)));
        // Trigger a full canvas redraw when image loads
      };
      img.onerror = () => {
        console.warn("Failed to load image element:", element.src);
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
