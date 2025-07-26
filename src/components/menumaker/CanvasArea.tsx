"use client";

import React, { useEffect, useRef, useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { TextElement } from "../../types/menumaker";
import { getBackgroundStyle } from "./utils/colorUtils";
import { drawMenuItemsList } from "./utils/drawMenuItemsList";

// Simplified canvas without React Konva for now to avoid DevTools errors
export function CanvasArea() {
  const {
    project,
    currentPageId,
    editorState,
    selectElements,
    addElement,
    deleteElement,
    updateElement,
    setZoom,
    setCanvasOffset,
    setTool,
  } = useMenuMakerStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [pageOffset, setPageOffset] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null); // 'tl', 'tr', 'bl', 'br'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStartPositions, setElementStartPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [elementStartDimensions, setElementStartDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [tempElementPositions, setTempElementPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [tempElementDimensions, setTempElementDimensions] = useState<
    Record<string, { width: number; height: number; x?: number; y?: number }>
  >({});
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [hoveredResizeHandle, setHoveredResizeHandle] = useState<string | null>(null);

  const [backgroundImageCache, setBackgroundImageCache] = useState<Map<string, HTMLImageElement>>(new Map());

  const currentPage = project?.pages.find((page) => page.id === currentPageId);
  const { canvas, tool } = editorState;

  // Update canvas size based on page format and container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && currentPage) {
        const container = containerRef.current;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        // Calculate page size at current zoom level
        const pageWidth = currentPage.format.width * canvas.zoom;
        const pageHeight = currentPage.format.height * canvas.zoom;

        // Add padding around the page
        const padding = 100;
        const neededWidth = pageWidth + padding * 2;
        const neededHeight = pageHeight + padding * 2;

        // Use the larger of container size or needed size
        const finalWidth = Math.max(containerWidth, neededWidth);
        const finalHeight = Math.max(containerHeight, neededHeight);

        setCanvasSize({
          width: finalWidth,
          height: finalHeight,
        });

        // Calculate page offset to center it, incorporating canvas offset
        setPageOffset({
          x: (finalWidth - pageWidth) / 2 + canvas.offsetX,
          y: (finalHeight - pageHeight) / 2 + canvas.offsetY,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [currentPage, canvas.zoom, canvas.offsetX, canvas.offsetY]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if canvas area is hovered and elements are selected
      if (!isCanvasHovered || editorState.selectedElementIds.length === 0 || !currentPage) return;

      // Delete key (46) for Windows/Linux, Backspace (8) for Mac
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();

        // Delete all selected elements
        editorState.selectedElementIds.forEach((elementId) => {
          // Find which layer contains this element
          currentPage.layers.forEach((layer) => {
            const elementExists = layer.elements.some((el) => el.id === elementId);

            if (elementExists) {
              deleteElement(currentPageId!, layer.id, elementId);
            }
          });
        });

        // Clear selection after deletion
        selectElements([]);
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCanvasHovered, editorState.selectedElementIds, currentPage, currentPageId, deleteElement, selectElements]);

  // Handle zoom with wheel events (pinch zoom and Ctrl+wheel)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check if the event target is the canvas or its container
      const canvasElement = canvasRef.current;
      const containerElement = containerRef.current;

      if (!canvasElement || !containerElement || !currentPage) return;

      // Check if the wheel event is over the canvas area
      const rect = containerElement.getBoundingClientRect();
      const isOverCanvas =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (!isOverCanvas) return;

      // Detect pinch zoom (trackpad) or Ctrl+wheel (mouse)
      const isPinchZoom = e.ctrlKey; // Trackpad pinch gestures set ctrlKey to true
      const isCtrlWheel = e.ctrlKey && e.deltaY !== 0;

      if (isPinchZoom || isCtrlWheel) {
        e.preventDefault(); // Prevent page zoom

        // Calculate zoom delta
        const zoomSensitivity = 0.001;
        const deltaY = e.deltaY;
        const zoomDelta = -deltaY * zoomSensitivity;

        // Get current zoom and calculate new zoom
        const currentZoom = canvas.zoom;
        const minZoom = 0.1;
        const maxZoom = 5.0;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom + zoomDelta));

        // Get mouse position relative to the container
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate the center of the canvas for default centering
        const canvasCenterX = (canvasSize.width - currentPage.format.width * currentZoom) / 2;
        const canvasCenterY = (canvasSize.height - currentPage.format.height * currentZoom) / 2;

        // Calculate zoom center point relative to the page content
        const pageMouseX = (mouseX - canvasCenterX - canvas.offsetX) / currentZoom;
        const pageMouseY = (mouseY - canvasCenterY - canvas.offsetY) / currentZoom;

        // Calculate new canvas center
        const newCanvasCenterX = (canvasSize.width - currentPage.format.width * newZoom) / 2;
        const newCanvasCenterY = (canvasSize.height - currentPage.format.height * newZoom) / 2;

        // Calculate new offset to keep the same point under the mouse
        const newOffsetX = mouseX - newCanvasCenterX - pageMouseX * newZoom;
        const newOffsetY = mouseY - newCanvasCenterY - pageMouseY * newZoom;

        // Update zoom and offset
        setZoom(newZoom);
        setCanvasOffset(newOffsetX, newOffsetY);
      }
    };

    // Add wheel event listener to the container
    const containerElement = containerRef.current;

    if (containerElement) {
      containerElement.addEventListener("wheel", handleWheel, { passive: false });
    }

    // Cleanup
    return () => {
      if (containerElement) {
        containerElement.removeEventListener("wheel", handleWheel);
      }
    };
  }, [canvas.zoom, canvas.offsetX, canvas.offsetY, canvasSize, currentPage, setZoom, setCanvasOffset]);

  // Draw canvas content
  useEffect(() => {
    if (!canvasRef.current || !currentPage) return;

    const ctx = canvasRef.current.getContext("2d");

    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Set canvas size
    canvasRef.current.width = canvasSize.width;
    canvasRef.current.height = canvasSize.height;

    // Draw page background
    drawPageBackground(ctx, currentPage, canvas);

    // Draw elements
    drawElements(ctx, currentPage, canvas, editorState.selectedElementIds);

    // Draw selection box if selecting
    if (isSelecting && tool === "select") {
      drawSelectionBox(ctx);
    }

    // Draw hover bounding box for text elements when in text mode
    if (hoveredElementId && !editorState.selectedElementIds.includes(hoveredElementId) && tool === "select") {
      drawHoverBoundingBox(ctx, hoveredElementId);
    }
  }, [
    currentPage,
    canvasSize,
    pageOffset,
    canvas,
    editorState.selectedElementIds,
    isSelecting,
    selectionStart,
    selectionEnd,
    tool,
    hoveredElementId,
    backgroundImageCache,
    tempElementPositions,
    tempElementDimensions,
  ]);

  const drawPageBackground = (ctx: CanvasRenderingContext2D, page: any, canvas: any) => {
    const pageWidth = page.format.width * canvas.zoom;
    const pageHeight = page.format.height * canvas.zoom;

    // Draw page shadow
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(pageOffset.x + 3, pageOffset.y + 3, pageWidth, pageHeight);

    // Draw page background color
    ctx.fillStyle = page.backgroundColor;
    ctx.fillRect(pageOffset.x, pageOffset.y, pageWidth, pageHeight);

    // Draw background image if available
    if (page.backgroundImage) {
      const cachedImage = backgroundImageCache.get(page.backgroundImage);

      if (cachedImage && cachedImage.complete) {
        // Image is loaded and ready to draw
        ctx.save();
        ctx.globalAlpha = page.backgroundImageOpacity ?? 1;
        ctx.drawImage(cachedImage, pageOffset.x, pageOffset.y, pageWidth, pageHeight);
        ctx.restore();
      } else if (!cachedImage) {
        // Load the image and cache it
        const img = new Image();

        img.onload = () => {
          setBackgroundImageCache((prev) => new Map(prev.set(page.backgroundImage, img)));
          // Trigger a full canvas redraw when image loads
          // This will be handled by the useEffect that redraws the canvas
        };
        img.onerror = () => {
          console.warn("Failed to load background image:", page.backgroundImage);
        };
        img.src = page.backgroundImage;

        // Store the loading image in cache to prevent multiple loads
        setBackgroundImageCache((prev) => new Map(prev.set(page.backgroundImage, img)));
      }
    }
  };

  const drawElements = (ctx: CanvasRenderingContext2D, page: any, canvas: any, selectedIds: string[]) => {
    page.layers.forEach((layer: any) => {
      if (!layer.visible) return;

      layer.elements.forEach((element: any) => {
        const isSelected = selectedIds.includes(element.id);

        if (element.type === "text") {
          drawTextElement(ctx, element, canvas, isSelected);
        } else if (element.type === "image") {
          drawImageElement(ctx, element, canvas, isSelected);
        } else if (element.type === "data") {
          drawDataElement(ctx, element, canvas, isSelected);
        }
      });
    });
  };

  const drawTextElement = (ctx: CanvasRenderingContext2D, element: TextElement, canvas: any, isSelected: boolean) => {
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

  const drawImageElement = (ctx: CanvasRenderingContext2D, element: any, canvas: any, isSelected: boolean) => {
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

    // Draw placeholder
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(x, y, width, height);

    // Draw border
    ctx.strokeStyle = isSelected ? "#0066cc" : "#ccc";
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(x, y, width, height);

    // Draw resize handles if selected
    if (isSelected) {
      drawResizeHandles(ctx, x, y, width, height);
    }

    // Draw "Image" text
    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Image", x + width / 2, y + height / 2);
  };

  const drawDataElement = (ctx: CanvasRenderingContext2D, element: any, canvas: any, isSelected: boolean) => {
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

  const drawSelectionBox = (ctx: CanvasRenderingContext2D) => {
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

  const getElementsInSelectionBox = () => {
    if (!currentPage) return [];

    const startX = Math.min(selectionStart.x, selectionEnd.x);
    const startY = Math.min(selectionStart.y, selectionEnd.y);
    const endX = Math.max(selectionStart.x, selectionEnd.x);
    const endY = Math.max(selectionStart.y, selectionEnd.y);

    // Convert screen coordinates to page coordinates
    const pageStartX = (startX - pageOffset.x) / canvas.zoom;
    const pageStartY = (startY - pageOffset.y) / canvas.zoom;
    const pageEndX = (endX - pageOffset.x) / canvas.zoom;
    const pageEndY = (endY - pageOffset.y) / canvas.zoom;

    const selectedElementIds: string[] = [];

    currentPage.layers.forEach((layer) => {
      if (!layer.visible) return;

      layer.elements.forEach((element) => {
        // Use temporary position if dragging, otherwise use element position
        const tempPos = tempElementPositions[element.id];
        const elementX = tempPos ? tempPos.x : element.x;
        const elementY = tempPos ? tempPos.y : element.y;

        // Check if element is within selection box
        const elementRight = elementX + (element.width || 0);
        const elementBottom = elementY + (element.height || 0);

        if (elementX >= pageStartX && elementY >= pageStartY && elementRight <= pageEndX && elementBottom <= pageEndY) {
          selectedElementIds.push(element.id);
        }
      });
    });

    return selectedElementIds;
  };

  const getElementAtPosition = (mouseX: number, mouseY: number): string | null => {
    if (!currentPage) return null;

    // Convert screen coordinates to page coordinates
    const pageX = (mouseX - pageOffset.x) / canvas.zoom;
    const pageY = (mouseY - pageOffset.y) / canvas.zoom;

    // Check if click is within page bounds
    if (pageX < 0 || pageY < 0 || pageX > currentPage.format.width || pageY > currentPage.format.height) {
      return null;
    }

    // Check elements from top layer to bottom (reverse order for top-most selection)
    for (let layerIndex = currentPage.layers.length - 1; layerIndex >= 0; layerIndex--) {
      const layer = currentPage.layers[layerIndex];

      if (!layer.visible) continue;

      // Check elements from last to first (top-most element)
      for (let elementIndex = layer.elements.length - 1; elementIndex >= 0; elementIndex--) {
        const element = layer.elements[elementIndex];

        if (!element.visible) continue;

        // Use temporary position/dimensions if dragging/resizing, otherwise use element values
        const tempPos = tempElementPositions[element.id];
        const tempDim = tempElementDimensions[element.id];

        const elementX = tempDim?.x !== undefined ? tempDim.x : tempPos ? tempPos.x : element.x;
        const elementY = tempDim?.y !== undefined ? tempDim.y : tempPos ? tempPos.y : element.y;

        // Check if click is within element bounds
        let elementWidth = tempDim ? tempDim.width : element.width || 0;
        let elementHeight = tempDim ? tempDim.height : element.height || 0;

        // For text elements, use a more accurate bounding box calculation
        if (element.type === "text") {
          // Use font size for a more accurate text bounds
          const textHeight = element.fontSize || 16;
          const textWidth = element.content ? element.content.length * (element.fontSize || 16) * 0.6 : elementWidth;

          elementWidth = Math.max(elementWidth, textWidth);
          elementHeight = Math.max(elementHeight, textHeight);
        }

        const elementRight = elementX + elementWidth;
        const elementBottom = elementY + elementHeight;

        if (pageX >= elementX && pageY >= elementY && pageX <= elementRight && pageY <= elementBottom) {
          return element.id;
        }
      }
    }

    return null;
  };

  const drawResizeHandles = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
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

  const getResizeHandleAtPosition = (mouseX: number, mouseY: number, elementId: string): string | null => {
    if (!currentPage) return null;

    // Find the element
    let element = null;

    for (const layer of currentPage.layers) {
      const found = layer.elements.find((el) => el.id === elementId);

      if (found) {
        element = found;
        break;
      }
    }

    if (!element || !editorState.selectedElementIds.includes(elementId)) return null;

    // Use temporary dimensions/positions if resizing, otherwise use element values
    const tempPos = tempElementPositions[element.id];
    const tempDim = tempElementDimensions[element.id];

    const elementX = tempPos ? tempPos.x : element.x;
    const elementY = tempPos ? tempPos.y : element.y;

    // Convert to screen coordinates
    const x = pageOffset.x + elementX * canvas.zoom;
    const y = pageOffset.y + elementY * canvas.zoom;

    // Use element dimensions for all element types (including text)
    const elementWidth = tempDim ? tempDim.width : element.width;
    const elementHeight = tempDim ? tempDim.height : element.height;

    const width = elementWidth * canvas.zoom;
    const height = elementHeight * canvas.zoom;

    const handleSize = 12;
    const handleRadius = handleSize / 2;

    // Define handle positions
    const handles = {
      tl: { x: x - handleRadius, y: y - handleRadius, cursor: "nw-resize" }, // Top-left
      tr: { x: x + width - handleRadius, y: y - handleRadius, cursor: "ne-resize" }, // Top-right
      bl: { x: x - handleRadius, y: y + height - handleRadius, cursor: "sw-resize" }, // Bottom-left
      br: { x: x + width - handleRadius, y: y + height - handleRadius, cursor: "se-resize" }, // Bottom-right
    };

    // Check if mouse is over any handle
    for (const [handleId, handle] of Object.entries(handles)) {
      if (
        mouseX >= handle.x &&
        mouseX <= handle.x + handleSize &&
        mouseY >= handle.y &&
        mouseY <= handle.y + handleSize
      ) {
        return handleId;
      }
    }

    return null;
  };

  const getResizeCursor = (handleId: string | null): string => {
    if (!handleId) return "default";

    const cursors: Record<string, string> = {
      tl: "nw-resize",
      tr: "ne-resize",
      bl: "sw-resize",
      br: "se-resize",
    };

    return cursors[handleId] || "default";
  };

  const getCanvasCursor = (): string => {
    // Handle text tool
    if (tool === "text") {
      return "text";
    }

    // Handle select tool with various states
    if (tool === "select") {
      if (isResizing) {
        return getResizeCursor(resizeHandle);
      }

      if (isDragging) {
        return "grabbing";
      }

      if (hoveredResizeHandle) {
        return getResizeCursor(hoveredResizeHandle);
      }

      return "default";
    }

    // Handle pan tool
    if (tool === "pan") {
      return isDragging ? "grabbing" : "grab";
    }

    // Default cursor for other tools (image, data, etc.)
    return "crosshair";
  };

  const drawHoverBoundingBox = (ctx: CanvasRenderingContext2D, elementId: string) => {
    if (!currentPage) return;

    // Find the hovered element
    let hoveredElement = null;

    for (const layer of currentPage.layers) {
      const element = layer.elements.find((el) => el.id === elementId);

      if (element) {
        hoveredElement = element;
        break;
      }
    }

    if (!hoveredElement) return;

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

    // Draw hover bounding box using element dimensions
    ctx.strokeStyle = "#ff6b35";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
  };

  const getTextElementAtPosition = (mouseX: number, mouseY: number): string | null => {
    if (!currentPage) return null;

    // Convert screen coordinates to page coordinates
    const pageX = (mouseX - pageOffset.x) / canvas.zoom;
    const pageY = (mouseY - pageOffset.y) / canvas.zoom;

    // Check if click is within page bounds
    if (pageX < 0 || pageY < 0 || pageX > currentPage.format.width || pageY > currentPage.format.height) {
      return null;
    }

    // Check text elements from top layer to bottom (reverse order for top-most selection)
    for (let layerIndex = currentPage.layers.length - 1; layerIndex >= 0; layerIndex--) {
      const layer = currentPage.layers[layerIndex];

      if (!layer.visible) continue;

      // Check elements from last to first (top-most element)
      for (let elementIndex = layer.elements.length - 1; elementIndex >= 0; elementIndex--) {
        const element = layer.elements[elementIndex];

        if (!element.visible || element.type !== "text") continue;

        // Use temporary position/dimensions if dragging/resizing, otherwise use element values
        const tempPos = tempElementPositions[element.id];
        const tempDim = tempElementDimensions[element.id];

        const elementX = tempDim?.x !== undefined ? tempDim.x : tempPos ? tempPos.x : element.x;
        const elementY = tempDim?.y !== undefined ? tempDim.y : tempPos ? tempPos.y : element.y;
        const elementWidth = tempDim ? tempDim.width : element.width;
        const elementHeight = tempDim ? tempDim.height : element.height;

        // Use element dimensions for text bounds
        const elementRight = elementX + elementWidth;
        const elementBottom = elementY + elementHeight;

        if (pageX >= elementX && pageY >= elementY && pageX <= elementRight && pageY <= elementBottom) {
          return element.id;
        }
      }
    }

    return null;
  };

  // Handle canvas mouse down
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentPage) return;

    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (tool === "select") {
      // First check if clicking on a resize handle
      if (editorState.selectedElementIds.length === 1) {
        const elementId = editorState.selectedElementIds[0];
        const handle = getResizeHandleAtPosition(mouseX, mouseY, elementId);

        if (handle) {
          // Start resizing
          setIsResizing(true);
          setResizeHandle(handle);
          setDragStart({ x: mouseX, y: mouseY });

          // Store initial dimensions and positions
          const initialDimensions: Record<string, { width: number; height: number }> = {};
          const initialPositions: Record<string, { x: number; y: number }> = {};

          currentPage.layers.forEach((layer) => {
            layer.elements.forEach((element) => {
              if (element.id === elementId) {
                initialDimensions[element.id] = { width: element.width, height: element.height };
                initialPositions[element.id] = { x: element.x, y: element.y };
              }
            });
          });
          setElementStartDimensions(initialDimensions);
          setElementStartPositions(initialPositions);
          return;
        }
      }

      // Check if clicking on an element
      const clickedElementId = getElementAtPosition(mouseX, mouseY);

      if (clickedElementId) {
        // Check if element is already selected
        const isAlreadySelected = editorState.selectedElementIds.includes(clickedElementId);

        if (e.ctrlKey || e.metaKey) {
          // Multi-select mode: add/remove from selection
          if (isAlreadySelected) {
            // Remove from selection if already selected
            selectElements(editorState.selectedElementIds.filter((id) => id !== clickedElementId));
          } else {
            // Add to selection
            selectElements([...editorState.selectedElementIds, clickedElementId]);
          }
        } else if (isAlreadySelected && editorState.selectedElementIds.length === 1) {
          // Single selected element clicked - start dragging
          setIsDragging(true);
          setDragStart({ x: mouseX, y: mouseY });

          // Store initial positions of selected element
          const initialPositions: Record<string, { x: number; y: number }> = {};

          currentPage.layers.forEach((layer) => {
            layer.elements.forEach((element) => {
              if (element.id === clickedElementId) {
                initialPositions[element.id] = { x: element.x, y: element.y };
              }
            });
          });
          setElementStartPositions(initialPositions);
        } else if (isAlreadySelected && editorState.selectedElementIds.length > 1) {
          // Multiple elements selected, clicked element is one of them - start dragging all
          setIsDragging(true);
          setDragStart({ x: mouseX, y: mouseY });

          // Store initial positions of all selected elements
          const initialPositions: Record<string, { x: number; y: number }> = {};

          currentPage.layers.forEach((layer) => {
            layer.elements.forEach((element) => {
              if (editorState.selectedElementIds.includes(element.id)) {
                initialPositions[element.id] = { x: element.x, y: element.y };
              }
            });
          });
          setElementStartPositions(initialPositions);
        } else {
          // Element not selected - select it (replace current selection)
          selectElements([clickedElementId]);
        }
      } else {
        // Click on empty space - clear selection and start selection box
        selectElements([]);
        setIsSelecting(true);
        setSelectionStart({ x: mouseX, y: mouseY });
        setSelectionEnd({ x: mouseX, y: mouseY });
      }
    } else {
      // Handle other tools with click
      handleCanvasClick(e);
    }
  };

  // Handle canvas mouse move
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (tool === "select") {
      // Handle hover detection for text elements
      const hoveredElement = getElementAtPosition(mouseX, mouseY);

      if (hoveredElement) {
        setHoveredElementId(hoveredElement);
      } else {
        setHoveredElementId(null);
      }

      if (isResizing && resizeHandle && editorState.selectedElementIds.length === 1) {
        // Handle element resizing
        const elementId = editorState.selectedElementIds[0];
        const startDim = elementStartDimensions[elementId];
        const startPos = elementStartPositions[elementId];

        if (startDim && startPos) {
          const deltaX = (mouseX - dragStart.x) / canvas.zoom;
          const deltaY = (mouseY - dragStart.y) / canvas.zoom;

          let newWidth = startDim.width;
          let newHeight = startDim.height;
          let newX = startPos.x;
          let newY = startPos.y;

          // Find the element to check if it's a text element
          let isTextElement = false;
          let textElement = null;

          if (currentPage) {
            for (const layer of currentPage.layers) {
              const element = layer.elements.find((el) => el.id === elementId);

              if (element && element.type === "text") {
                isTextElement = true;
                textElement = element;
                break;
              }
            }
          }

          // Calculate minimum dimensions for text elements
          let minWidth = 20;
          let minHeight = 20;

          if (isTextElement && textElement && canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");

            if (ctx) {
              // Set font to measure character width
              ctx.font = `${textElement.fontStyle} ${textElement.fontSize}px ${textElement.fontFamily}`;

              // Calculate minimum width for at least 1 character (use "W" as it's typically the widest)
              const singleCharWidth = ctx.measureText("W").width;
              const padding = textElement.padding * 2; // padding on both sides

              minWidth = singleCharWidth + padding + 10; // Add some extra margin

              // Calculate minimum height for at least 1 line
              const lineHeight = textElement.fontSize * textElement.lineHeight;

              minHeight = lineHeight; // Add some extra margin
            }
          }

          // Apply resize based on handle
          switch (resizeHandle) {
            case "tl": // Top-left
              newWidth = Math.max(minWidth, startDim.width - deltaX);
              newHeight = Math.max(minHeight, startDim.height - deltaY);
              newX = startPos.x + (startDim.width - newWidth);
              newY = startPos.y + (startDim.height - newHeight);
              break;
            case "tr": // Top-right
              newWidth = Math.max(minWidth, startDim.width + deltaX);
              newHeight = Math.max(minHeight, startDim.height - deltaY);
              newY = startPos.y + (startDim.height - newHeight);
              break;
            case "bl": // Bottom-left
              newWidth = Math.max(minWidth, startDim.width - deltaX);
              newHeight = Math.max(minHeight, startDim.height + deltaY);
              newX = startPos.x + (startDim.width - newWidth);
              break;
            case "br": // Bottom-right
              newWidth = Math.max(minWidth, startDim.width + deltaX);
              newHeight = Math.max(minHeight, startDim.height + deltaY);
              break;
          }

          setTempElementDimensions({
            [elementId]: { width: newWidth, height: newHeight, x: newX, y: newY },
          });
        }
      } else if (isDragging) {
        // Handle element dragging - update temporary positions only
        const deltaX = (mouseX - dragStart.x) / canvas.zoom;
        const deltaY = (mouseY - dragStart.y) / canvas.zoom;

        // Update temporary positions for all selected elements
        const newTempPositions: Record<string, { x: number; y: number }> = {};

        editorState.selectedElementIds.forEach((elementId) => {
          const startPos = elementStartPositions[elementId];

          if (startPos) {
            newTempPositions[elementId] = {
              x: startPos.x + deltaX,
              y: startPos.y + deltaY,
            };
          }
        });
        setTempElementPositions(newTempPositions);
      } else if (isSelecting) {
        // Handle selection box
        setSelectionEnd({ x: mouseX, y: mouseY });
      } else {
        // Check for hover over resize handles
        if (editorState.selectedElementIds.length === 1) {
          const elementId = editorState.selectedElementIds[0];
          const handle = getResizeHandleAtPosition(mouseX, mouseY, elementId);

          setHoveredResizeHandle(handle);
        } else {
          setHoveredResizeHandle(null);
        }
      }
    }
  };

  // Handle mouse enter/leave for keyboard event handling
  const handleCanvasMouseEnter = () => {
    setIsCanvasHovered(true);
  };

  const handleCanvasMouseLeave = () => {
    setIsCanvasHovered(false);
    setHoveredElementId(null); // Clear hover state when leaving canvas
  };

  // Handle canvas mouse up
  const handleCanvasMouseUp = () => {
    if (tool === "select") {
      if (isResizing) {
        // Commit temporary dimensions to store on mouse up
        Object.entries(tempElementDimensions).forEach(([elementId, dimensions]) => {
          if (currentPage) {
            // Find which layer contains this element and update it
            currentPage.layers.forEach((layer) => {
              const elementExists = layer.elements.some((el) => el.id === elementId);

              if (elementExists) {
                const updates: any = {
                  width: dimensions.width,
                  height: dimensions.height,
                };

                // Update position if it changed (for tl, tr, bl handles)
                if (dimensions.x !== undefined) updates.x = dimensions.x;
                if (dimensions.y !== undefined) updates.y = dimensions.y;

                updateElement(currentPageId!, layer.id, elementId, updates);
              }
            });
          }
        });

        // End resizing and clear temporary state
        setIsResizing(false);
        setResizeHandle(null);
        setElementStartDimensions({});
        setElementStartPositions({});
        setTempElementDimensions({});
      } else if (isDragging) {
        // Commit temporary positions to store on mouse up
        Object.entries(tempElementPositions).forEach(([elementId, position]) => {
          if (currentPage) {
            // Find which layer contains this element and update it
            currentPage.layers.forEach((layer) => {
              const elementExists = layer.elements.some((el) => el.id === elementId);

              if (elementExists) {
                updateElement(currentPageId!, layer.id, elementId, { x: position.x, y: position.y });
              }
            });
          }
        });

        // End dragging and clear temporary state
        setIsDragging(false);
        setElementStartPositions({});
        setTempElementPositions({});
      } else if (isSelecting) {
        // Only update selection if we actually dragged (selection box has some size)
        const dragDistance = Math.abs(selectionEnd.x - selectionStart.x) + Math.abs(selectionEnd.y - selectionStart.y);

        if (dragDistance > 5) {
          // Minimum drag distance to consider it a selection box
          const selectedElementIds = getElementsInSelectionBox();

          selectElements(selectedElementIds);
        }

        setIsSelecting(false);
      }
    }

    setTool("select");
  };

  // Handle canvas click (for non-select tools)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentPage) return;

    const rect = canvasRef.current?.getBoundingClientRect();

    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate position relative to page
    const relativeX = (clickX - pageOffset.x) / canvas.zoom;
    const relativeY = (clickY - pageOffset.y) / canvas.zoom;

    // Check if click is within page bounds
    if (
      relativeX < 0 ||
      relativeY < 0 ||
      relativeX > currentPage.format.width ||
      relativeY > currentPage.format.height
    ) {
      return; // Click outside page
    }

    // Clear selection first for non-select tools
    if (tool !== "select") {
      selectElements([]);
    }

    if (tool === "text") {
      // Check if clicking on an existing text element first
      const clickedTextElement = getTextElementAtPosition(clickX, clickY);

      if (clickedTextElement) {
        // Select the existing text element
        selectElements([clickedTextElement]);
        return;
      }

      // Add new text element
      const newText: Omit<TextElement, "id"> = {
        type: "text",
        x: relativeX,
        y: relativeY,
        width: 373,
        height: 68,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: 0,
        locked: false,
        visible: true,
        opacity: 1,
        content: "Text element",
        fontSize: 64,
        fontFamily: "Arial",
        fontStyle: "normal",
        textDecoration: "none",
        fill: "#000000",
        stroke: "",
        strokeWidth: 0,
        align: "left",
        verticalAlign: "top",
        lineHeight: 1.2,
        letterSpacing: 0,
        padding: 5,
      };

      const firstLayer = currentPage.layers[0];

      if (firstLayer) {
        addElement(currentPageId!, firstLayer.id, newText);
      }
    }
  };

  if (!currentPage) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">No page selected</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full bg-gray-50 overflow-auto" style={{ overscrollBehaviorX: "none" }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseEnter={handleCanvasMouseEnter}
        onMouseLeave={handleCanvasMouseLeave}
        style={{ display: "block", cursor: getCanvasCursor() }}
        tabIndex={0}
      />
    </div>
  );
}
