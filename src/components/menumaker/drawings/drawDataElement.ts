import { getBackgroundStyle } from "../utils/colorUtils";
import { drawMenuItemsList } from "../utils/drawMenuItemsList";
import { drawResizeHandles } from "./drawResizeHandles";

interface DrawDataElementParams {
  ctx: CanvasRenderingContext2D;
  element: any;
  canvas: any;
  isSelected: boolean;
  pageOffset: { x: number; y: number };
  tempElementPositions: Record<string, { x: number; y: number }>;
  tempElementDimensions: Record<string, { width: number; height: number; x?: number; y?: number }>;
}

export const drawDataElement = ({
  ctx,
  element,
  canvas,
  isSelected,
  pageOffset,
  tempElementPositions,
  tempElementDimensions,
}: DrawDataElementParams) => {
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

  // Draw background with opacity
  const backgroundStyle = getBackgroundStyle(element.backgroundColor || "#ffffff", element.backgroundOpacity);

  if (backgroundStyle) {
    ctx.fillStyle = backgroundStyle;
    ctx.fillRect(x, y, width, height);
  }

  // Draw border
  const borderSize = (element.borderSize || 0) * canvas.zoom;

  if (borderSize > 0) {
    ctx.strokeStyle = element.borderColor || "#000000";
    ctx.lineWidth = borderSize;

    // Set border type
    if (element.borderType === "dashed") {
      ctx.setLineDash([5 * canvas.zoom, 5 * canvas.zoom]);
    } else if (element.borderType === "dotted") {
      ctx.setLineDash([2 * canvas.zoom, 2 * canvas.zoom]);
    } else {
      ctx.setLineDash([]);
    }

    // Draw border with border radius if specified
    if (element.borderRadius > 0) {
      const radius = element.borderRadius * canvas.zoom;

      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.stroke();
    } else {
      ctx.strokeRect(x, y, width, height);
    }
    ctx.setLineDash([]);
  }

  // Draw data content
  ctx.fillStyle = element.textColor || "#333";
  const fontSize = (element.fontSize || 64) * canvas.zoom;

  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  let displayText = "";

  if (element.dataType === "category" && element.categoryData) {
    // Show the actual category name
    displayText = element.categoryData.names?.en || element.categoryData.name || "Select category";
  } else if (element.dataType === "category" && element.dataId) {
    displayText = "Select category";
  } else if (element.dataType === "subcategory" && element.subcategoryData) {
    // Show the actual subcategory name
    displayText = element.subcategoryData.names?.en || element.subcategoryData.name || "Select subcategory";
  } else if (element.dataType === "subcategory" && element.dataId) {
    displayText = "Select subcategory";
  } else if (element.dataType === "menuitem" && element.subcategoryData) {
    // Draw menu items list instead of simple text
    drawMenuItemsList({
      ctx,
      element,
      x,
      y,
      width,
      height,
      scale: canvas.zoom,
      isThumbnail: false,
    });
    // Don't return early - we still need to draw selection borders
    displayText = ""; // Set empty to avoid drawing default text
  } else if (element.dataType === "menuitem") {
    displayText = "Select category and subcategory";
  } else {
    displayText = element.dataType ? element.dataType.toUpperCase() : "DATA";
  }

  // Position text at top-left with some padding (only if we have displayText)
  if (displayText) {
    const padding = 10 * canvas.zoom;

    ctx.fillText(displayText, x + padding, y + padding);
  }

  // Draw selection border and resize handles if selected
  if (isSelected) {
    ctx.strokeStyle = "#0066cc";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
    ctx.setLineDash([]);

    // Draw resize handles at corners
    drawResizeHandles(ctx, x, y, width, height);
  }
};
