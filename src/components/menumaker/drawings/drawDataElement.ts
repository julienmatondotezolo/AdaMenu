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
  let displayText = "";
  let textColor = element.textColor || "#333";
  let fontSize = (element.fontSize || 64) * canvas.zoom;
  let fontFamily = "Arial";
  let fontWeight = "normal";
  let textAlign: "left" | "center" | "right" = "left";

  // Use title properties for category and subcategory
  if (element.dataType === "category" || element.dataType === "subcategory") {
    textColor = element.titleTextColor || element.textColor || "#333";
    fontSize = (element.titleTextFontSize || element.fontSize || 48) * canvas.zoom;
    fontFamily = element.titleTextFontFamily || "Arial, sans-serif";
    fontWeight = element.titleTextFontWeight || "normal";
    textAlign = element.titleAlign || "left";
  }

  ctx.fillStyle = textColor;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = textAlign;
  ctx.textBaseline = "top";

  if (element.dataType === "category" && element.categoryData) {
    // Show the actual category name in the selected language
    const lang = element.titleLanguage || element.itemNameLanguage || "en";

    displayText = element.categoryData.names?.[lang] || element.categoryData.name || "Select category";
  } else if (element.dataType === "category" && element.dataId) {
    displayText = "Select category";
  } else if (element.dataType === "subcategory" && element.subcategoryData) {
    // Show the actual subcategory name in the selected language
    const lang = element.titleLanguage || element.itemNameLanguage || "en";

    displayText = element.subcategoryData.names?.[lang] || element.subcategoryData.name || "Select subcategory";
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

  // Position text with alignment and padding (only if we have displayText)
  if (displayText) {
    const padding = 10 * canvas.zoom;
    let textX = x + padding;

    // Adjust X position based on alignment
    if (textAlign === "center") {
      textX = x + width / 2;
    } else if (textAlign === "right") {
      textX = x + width - padding;
    }

    ctx.fillText(displayText, textX, y + padding);
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
