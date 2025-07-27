interface DrawSelectionBoxParams {
  ctx: CanvasRenderingContext2D;
  selectionStart: { x: number; y: number };
  selectionEnd: { x: number; y: number };
}

export const drawSelectionBox = ({ ctx, selectionStart, selectionEnd }: DrawSelectionBoxParams) => {
  const startX = Math.min(selectionStart.x, selectionEnd.x);
  const startY = Math.min(selectionStart.y, selectionEnd.y);
  const width = Math.abs(selectionEnd.x - selectionStart.x);
  const height = Math.abs(selectionEnd.y - selectionStart.y);

  // Draw selection box
  ctx.strokeStyle = "#0066cc";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(startX, startY, width, height);

  // Draw selection box background
  ctx.fillStyle = "rgba(0, 102, 204, 0.1)";
  ctx.fillRect(startX, startY, width, height);

  // Reset line dash
  ctx.setLineDash([]);
};
