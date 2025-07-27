import { ShapeElement } from "../../../types/menumaker";
import { drawResizeHandles } from "./drawResizeHandles";

interface DrawShapeElementParams {
  ctx: CanvasRenderingContext2D;
  element: ShapeElement;
  canvas: any;
  isSelected: boolean;
  pageOffset: { x: number; y: number };
  tempElementPositions: Record<string, { x: number; y: number }>;
  tempElementDimensions: Record<string, { width: number; height: number; x?: number; y?: number }>;
}

export const drawShapeElement = ({
  ctx,
  element,
  canvas,
  isSelected,
  pageOffset,
  tempElementPositions,
  tempElementDimensions,
}: DrawShapeElementParams) => {
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

  ctx.save();
  ctx.globalAlpha = element.opacity;

  // Set fill and stroke styles
  if (element.fill) {
    ctx.fillStyle = element.fill;
  }
  if (element.stroke) {
    ctx.strokeStyle = element.stroke;
    ctx.lineWidth = element.strokeWidth * canvas.zoom;
  }

  // Draw the shape based on its type
  switch (element.shapeType) {
    case "rectangle":
      if (element.radius > 0) {
        // Rounded rectangle
        const radius = element.radius * canvas.zoom;

        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
      } else {
        // Regular rectangle
        ctx.beginPath();
        ctx.rect(x, y, width, height);
      }
      break;

    case "circle": {
      // Draw circle/ellipse
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radiusX = width / 2;
      const radiusY = height / 2;

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      break;
    }

    case "triangle":
      // Draw triangle
      ctx.beginPath();
      ctx.moveTo(x + width / 2, y); // Top point
      ctx.lineTo(x, y + height); // Bottom left
      ctx.lineTo(x + width, y + height); // Bottom right
      ctx.closePath();
      break;
  }

  // Fill and stroke the shape
  if (element.fill) {
    ctx.fill();
  }
  if (element.stroke && element.strokeWidth > 0) {
    ctx.stroke();
  }

  ctx.restore();

  // Draw selection border and resize handles if selected
  if (isSelected) {
    ctx.strokeStyle = "#0066cc";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);

    // Draw resize handles
    drawResizeHandles(ctx, x, y, width, height);
  }
};
