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

// Helper function to draw text with letter spacing
const drawTextWithLetterSpacing = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
) => {
  if (letterSpacing === 0) {
    ctx.fillText(text, x, y);
    return ctx.measureText(text).width;
  }

  let currentX = x;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    ctx.fillText(char, currentX, y);
    const charWidth = ctx.measureText(char).width;

    currentX += charWidth + letterSpacing;
  }

  return currentX - x - letterSpacing; // Return total width
};

// Helper function to check if a font is actually loaded and available
const isFontAvailable = (ctx: CanvasRenderingContext2D, fontFamily: string): boolean => {
  try {
    // Test if the font is available by measuring text with different fonts
    const testText = "abcdefghijklmnopqrstuvwxyz";
    const fallbackFont = "monospace";

    // Set the desired font
    ctx.font = `16px ${fontFamily}, ${fallbackFont}`;
    const testWidth = ctx.measureText(testText).width;

    // Set just the fallback font
    ctx.font = `16px ${fallbackFont}`;
    const fallbackWidth = ctx.measureText(testText).width;

    // If widths are different, the custom font is likely loaded
    return Math.abs(testWidth - fallbackWidth) > 1;
  } catch (error) {
    console.warn("Font availability check failed:", error);
    return false;
  }
};

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

  // Ensure properties have fallback values during font family changes
  const letterSpacing = (element.letterSpacing ?? 0) * canvas.zoom;
  const lineHeight = element.lineHeight ?? 1.2;

  // Use the new separate fontWeight and fontStyle fields with fallbacks for legacy data
  const fontWeight = element.fontWeight || (element.fontStyle && element.fontStyle.includes("bold") ? "700" : "400");
  const fontStyle = element.fontStyle && element.fontStyle.includes("italic") ? "italic" : "normal";

  // Set text properties with proper font formatting and fallbacks
  let fontFamily = element.fontFamily || "Arial";

  // Check if the font is available, fallback to Arial if not
  if (fontFamily !== "Arial" && !isFontAvailable(ctx, fontFamily)) {
    console.warn(`Font '${fontFamily}' not available, falling back to Arial`);
    fontFamily = "Arial";
  }

  // Build font string with enhanced Google Font support
  let fontString: string;

  // For Google Fonts, ensure proper weight application
  if (fontFamily !== "Arial" && fontFamily !== "sans-serif") {
    // Use CSS font-weight property format for better Google Font support
    fontString = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
  } else {
    // For system fonts, use standard format
    fontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  }

  ctx.font = fontString;

  // Additional debugging for Google Font weight issues
  if (process.env.NODE_ENV === "development") {
    const testText = "Test";
    const testWidth = ctx.measureText(testText).width;

    // Test with different weight to see if it's actually changing
    const testFont = `${fontStyle} 400 ${fontSize}px "${fontFamily}", Arial, sans-serif`;

    ctx.font = testFont;
    const testWidth400 = ctx.measureText(testText).width;

    // Reset to intended font
    ctx.font = fontString;

    if (fontWeight !== "400" && Math.abs(testWidth - testWidth400) < 0.1) {
      console.warn(`Google Font weight ${fontWeight} may not be loaded for ${fontFamily}`);
    }
  }

  ctx.fillStyle = element.fill;
  ctx.globalAlpha = element.opacity;

  // Simplified text drawing for debugging
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;
  const calculatedLineHeight = fontSize * lineHeight;

  // Check if we have reasonable values - if not, use fallback rendering
  if (availableWidth <= 0 || availableHeight <= 0 || fontSize <= 0) {
    // Fallback: draw text without wrapping constraints
    drawTextWithLetterSpacing(ctx, element.content, x + 5, y + 30, letterSpacing);
    ctx.globalAlpha = 1;
    return;
  }

  // Enhanced text wrapping with letter spacing consideration
  const words = element.content.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    // Measure text width considering letter spacing
    let testWidth = 0;

    if (letterSpacing === 0) {
      testWidth = ctx.measureText(testLine).width;
    } else {
      // Calculate width with letter spacing
      testWidth = testLine.length > 0 ? ctx.measureText(testLine).width + (testLine.length - 1) * letterSpacing : 0;
    }

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
  const maxLines = Math.floor(availableHeight / calculatedLineHeight);
  const finalLines = lines.slice(0, Math.max(1, maxLines)); // Always show at least 1 line

  // Draw text lines with enhanced formatting
  ctx.textAlign = element.align as any;
  ctx.textBaseline = "top";

  finalLines.forEach((line, index) => {
    const lineY = y + padding + index * calculatedLineHeight;
    let lineX = x + padding;

    // Adjust x position based on text alignment
    if (element.align === "center") {
      lineX = x + width / 2;
    } else if (element.align === "right") {
      lineX = x + width - padding;
    }

    // Draw text with letter spacing
    drawTextWithLetterSpacing(ctx, line, lineX, lineY, letterSpacing);
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
