import { TextElement } from "../../../types/menumaker";
import { drawResizeHandles } from "./drawResizeHandles";

interface DrawTextElementParams {
  ctx: CanvasRenderingContext2D;
  element: TextElement;
  canvas: any;
  isSelected: boolean;
  pageOffset: { x: number; y: number };
  tempElementPositions: Record<string, { x: number; y: number }>;
  tempElementDimensions: Record<string, { width: number; height: number; x?: number; y?: number }>;
}

export const drawTextElement = ({
  ctx,
  element,
  canvas,
  isSelected,
  pageOffset,
  tempElementPositions,
  tempElementDimensions,
}: DrawTextElementParams) => {
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
  const fontSize = element.fontSize * canvas.zoom;
  const padding = element.padding * canvas.zoom;

  // Set text properties
  ctx.font = `${element.fontStyle} ${fontSize}px ${element.fontFamily}`;
  ctx.fillStyle = element.fill;
  ctx.globalAlpha = element.opacity;

  // Simplified text drawing for debugging
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;
  const lineHeight = fontSize * element.lineHeight;

  // Check if we have reasonable values - if not, use fallback rendering
  if (availableWidth <= 0 || availableHeight <= 0 || fontSize <= 0) {
    // Fallback: draw text without wrapping constraints
    ctx.fillText(element.content, x + 5, y + 30);
    ctx.globalAlpha = 1;
    return;
  }

  // Simple text wrapping
  const words = element.content.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth <= availableWidth || currentLine === "") {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  // Add the last line
  if (currentLine) {
    lines.push(currentLine);
  }

  // Limit lines to what fits in height
  const maxLines = Math.floor(availableHeight / lineHeight);
  const finalLines = lines.slice(0, Math.max(1, maxLines)); // Always show at least 1 line

  // Draw text lines
  ctx.textAlign = element.align as any;
  ctx.textBaseline = "top";

  finalLines.forEach((line, index) => {
    const lineY = y + padding + index * lineHeight;
    let lineX = x + padding;

    // Adjust x position based on text alignment
    if (element.align === "center") {
      lineX = x + width / 2;
    } else if (element.align === "right") {
      lineX = x + width - padding;
    }

    ctx.fillText(line, lineX, lineY);
  });

  // Draw selection border and resize handles
  if (isSelected) {
    ctx.strokeStyle = "#0066cc";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1;

    // Draw selection border using the actual rect dimensions
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);

    // Draw resize handles using the actual rect dimensions
    drawResizeHandles(ctx, x, y, width, height);
  }

  ctx.globalAlpha = 1;
};
