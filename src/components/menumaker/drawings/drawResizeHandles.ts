export const drawResizeHandles = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const handleSize = 12;
  const handleRadius = handleSize / 2;

  // Save current styles
  ctx.save();

  // Handle style
  ctx.fillStyle = "#0066cc";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;

  // Define handle positions
  const handles = [
    { x: x - handleRadius, y: y - handleRadius }, // Top-left
    { x: x + width - handleRadius, y: y - handleRadius }, // Top-right
    { x: x - handleRadius, y: y + height - handleRadius }, // Bottom-left
    { x: x + width - handleRadius, y: y + height - handleRadius }, // Bottom-right
  ];

  // Draw each handle
  handles.forEach((handle) => {
    ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
    ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
  });

  // Restore styles
  ctx.restore();
};
