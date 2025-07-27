import { MenuElement, MenuPage } from "../../../types/menumaker";

interface DrawHoverBoundingBoxParams {
  ctx: CanvasRenderingContext2D;
  elementId: string;
  currentPage: MenuPage;
  tempElementPositions: Record<string, { x: number; y: number }>;
  tempElementDimensions: Record<string, { width: number; height: number; x?: number; y?: number }>;
  pageOffset: { x: number; y: number };
  canvas: { zoom: number };
}

export function drawHoverBoundingBox({
  ctx,
  elementId,
  currentPage,
  tempElementPositions,
  tempElementDimensions,
  pageOffset,
  canvas,
}: DrawHoverBoundingBoxParams) {
  // Find the hovered element and its layer
  let hoveredElement: MenuElement | null = null;
  let elementLayer = null;

  for (const layer of currentPage.layers) {
    const element = layer.elements.find((el: MenuElement) => el.id === elementId);

    if (element) {
      hoveredElement = element;
      elementLayer = layer;
      break;
    }
  }

  if (!hoveredElement || !elementLayer) return;

  // Use temporary position/dimensions if dragging/resizing, otherwise use element values
  const tempPos = tempElementPositions[hoveredElement.id];
  const tempDim = tempElementDimensions[hoveredElement.id];

  const elementX = tempDim?.x !== undefined ? tempDim.x : tempPos ? tempPos.x : hoveredElement.x;
  const elementY = tempDim?.y !== undefined ? tempDim.y : tempPos ? tempPos.y : hoveredElement.y;
  const elementWidth = tempDim ? tempDim.width : hoveredElement.width;
  const elementHeight = tempDim ? tempDim.height : hoveredElement.height;

  const x = pageOffset.x + elementX * canvas.zoom;
  const y = pageOffset.y + elementY * canvas.zoom;
  const width = elementWidth * canvas.zoom;
  const height = elementHeight * canvas.zoom;

  // If layer is locked, grey out the element and show "LOCKED" text
  if (elementLayer.locked) {
    ctx.save();

    // Draw hover bounding box with grey stroke when locked
    ctx.strokeStyle = "#4B4B4B";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);

    // Draw grey overlay on the entire element
    ctx.fillStyle = "rgba(128, 128, 128, 0.2)"; // Semi-transparent grey
    ctx.fillRect(x, y, width, height);

    // Set up text styling for "LOCKED" label
    ctx.font = "12px Arial";
    ctx.fillStyle = "#4B4B4B";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    const text = "Locked";
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = 12;

    // Position text at top-left corner of the bounding box
    const textY = y - 5; // Slightly above the bounding box

    // Draw text background
    ctx.fillStyle = "#4B4B4B";
    ctx.fillRect(x, textY - textHeight - 2, textWidth + 8, textHeight + 6);

    // Draw text
    ctx.fillStyle = "#ffffff";

    ctx.fillText(text, x + textWidth + 4, textY - textHeight + 2);

    ctx.restore();
  } else {
    // Draw normal hover bounding box when not locked
    ctx.strokeStyle = "#ff6b36";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
  }
}
