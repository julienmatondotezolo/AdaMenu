"use client";

import React, { useEffect, useRef, useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { TextElement } from "../../types/menumaker";

// Simplified canvas without React Konva for now to avoid DevTools errors
export function CanvasArea() {
  const { project, currentPageId, editorState, selectElements, addElement, deleteElement, updateElement } =
    useMenuMakerStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [pageOffset, setPageOffset] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStartPositions, setElementStartPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [backgroundImageCache, setBackgroundImageCache] = useState<Map<string, HTMLImageElement>>(new Map());

  const currentPage = project?.pages.find((page) => page.id === currentPageId);
  const { canvas, tool, ui } = editorState;

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

        // Calculate page offset to center it
        setPageOffset({
          x: (finalWidth - pageWidth) / 2,
          y: (finalHeight - pageHeight) / 2,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [currentPage, canvas.zoom]);

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

    // Draw grid if enabled
    if (ui.showGrid) {
      drawGrid(ctx, canvasSize, ui.gridSize * canvas.zoom);
    }

    // Draw page background
    drawPageBackground(ctx, currentPage, canvas);

    // Draw elements
    drawElements(ctx, currentPage, canvas, editorState.selectedElementIds);

    // Draw selection box if selecting
    if (isSelecting && tool === "select") {
      drawSelectionBox(ctx);
    }

    // Draw hover bounding box for text elements when in text mode
    if (hoveredElementId && tool === "text") {
      drawHoverBoundingBox(ctx, hoveredElementId);
    }
  }, [
    currentPage,
    canvasSize,
    pageOffset,
    ui.showGrid,
    ui.gridSize,
    canvas,
    editorState.selectedElementIds,
    isSelecting,
    selectionStart,
    selectionEnd,
    tool,
    hoveredElementId,
    backgroundImageCache,
  ]);

  const drawGrid = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, gridSize: number) => {
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.5;

    // Only draw grid on the page area
    const pageWidth = currentPage!.format.width * canvas.zoom;
    const pageHeight = currentPage!.format.height * canvas.zoom;

    // Vertical lines
    for (let x = 0; x <= pageWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(pageOffset.x + x, pageOffset.y);
      ctx.lineTo(pageOffset.x + x, pageOffset.y + pageHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= pageHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(pageOffset.x, pageOffset.y + y);
      ctx.lineTo(pageOffset.x + pageWidth, pageOffset.y + y);
      ctx.stroke();
    }
  };

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
        ctx.drawImage(cachedImage, pageOffset.x, pageOffset.y, pageWidth, pageHeight);
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
        }
      });
    });
  };

  const drawTextElement = (ctx: CanvasRenderingContext2D, element: TextElement, canvas: any, isSelected: boolean) => {
    const x = pageOffset.x + element.x * canvas.zoom;
    const y = pageOffset.y + element.y * canvas.zoom;
    const fontSize = element.fontSize * canvas.zoom;

    // Set text properties
    ctx.font = `${element.fontStyle} ${fontSize}px ${element.fontFamily}`;
    ctx.fillStyle = element.fill;
    ctx.textAlign = element.align as any;
    ctx.globalAlpha = element.opacity;

    // Draw text
    ctx.fillText(element.content, x, y + fontSize);

    // Draw selection border
    if (isSelected) {
      ctx.strokeStyle = "#0066cc";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      const textMetrics = ctx.measureText(element.content);

      ctx.strokeRect(x - 2, y, textMetrics.width + 4, fontSize + 4);
    }

    ctx.globalAlpha = 1;
  };

  const drawImageElement = (ctx: CanvasRenderingContext2D, element: any, canvas: any, isSelected: boolean) => {
    const x = pageOffset.x + element.x * canvas.zoom;
    const y = pageOffset.y + element.y * canvas.zoom;
    const width = element.width * canvas.zoom;
    const height = element.height * canvas.zoom;

    // Draw placeholder
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(x, y, width, height);

    // Draw border
    ctx.strokeStyle = isSelected ? "#0066cc" : "#ccc";
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(x, y, width, height);

    // Draw "Image" text
    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Image", x + width / 2, y + height / 2);
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
        // Check if element is within selection box
        const elementRight = element.x + (element.width || 0);
        const elementBottom = element.y + (element.height || 0);

        if (
          element.x >= pageStartX &&
          element.y >= pageStartY &&
          elementRight <= pageEndX &&
          elementBottom <= pageEndY
        ) {
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

        // Check if click is within element bounds
        let elementWidth = element.width || 0;
        let elementHeight = element.height || 0;

        // For text elements, use a more accurate bounding box calculation
        if (element.type === "text") {
          // Use font size for a more accurate text bounds
          const textHeight = element.fontSize || 16;
          const textWidth = element.content ? element.content.length * (element.fontSize || 16) * 0.6 : elementWidth;

          elementWidth = Math.max(elementWidth, textWidth);
          elementHeight = Math.max(elementHeight, textHeight);
        }

        const elementRight = element.x + elementWidth;
        const elementBottom = element.y + elementHeight;

        if (pageX >= element.x && pageY >= element.y && pageX <= elementRight && pageY <= elementBottom) {
          return element.id;
        }
      }
    }

    return null;
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

    if (!hoveredElement || hoveredElement.type !== "text") return;

    const x = pageOffset.x + hoveredElement.x * canvas.zoom;
    const y = pageOffset.y + hoveredElement.y * canvas.zoom;
    const fontSize = hoveredElement.fontSize * canvas.zoom;

    // Calculate text width
    ctx.font = `${hoveredElement.fontStyle} ${fontSize}px ${hoveredElement.fontFamily}`;
    const textMetrics = ctx.measureText(hoveredElement.content);
    const textWidth = textMetrics.width;

    // Draw hover bounding box
    ctx.strokeStyle = "#ff6b35";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x - 2, y, textWidth + 4, fontSize + 4);
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

        // Check if click is within text element bounds
        const textHeight = element.fontSize || 16;
        const textWidth = element.content
          ? element.content.length * (element.fontSize || 16) * 0.6
          : element.width || 0;

        const elementRight = element.x + textWidth;
        const elementBottom = element.y + textHeight;

        if (pageX >= element.x && pageY >= element.y && pageX <= elementRight && pageY <= elementBottom) {
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
      // Check if clicking on an element first
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
      if (isDragging) {
        // Handle element dragging
        const deltaX = (mouseX - dragStart.x) / canvas.zoom;
        const deltaY = (mouseY - dragStart.y) / canvas.zoom;

        // Update positions of all selected elements
        editorState.selectedElementIds.forEach((elementId) => {
          const startPos = elementStartPositions[elementId];

          if (startPos && currentPage) {
            const newX = startPos.x + deltaX;
            const newY = startPos.y + deltaY;

            // Find which layer contains this element and update it
            currentPage.layers.forEach((layer) => {
              const elementExists = layer.elements.some((el) => el.id === elementId);

              if (elementExists) {
                updateElement(currentPageId!, layer.id, elementId, { x: newX, y: newY });
              }
            });
          }
        });
      } else if (isSelecting) {
        // Handle selection box
        setSelectionEnd({ x: mouseX, y: mouseY });
      }
    } else if (tool === "text") {
      // Handle hover detection for text elements
      const hoveredElement = getTextElementAtPosition(mouseX, mouseY);

      setHoveredElementId(hoveredElement);
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
      if (isDragging) {
        // End dragging
        setIsDragging(false);
        setElementStartPositions({});
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
        width: 200,
        height: 80,
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
    <div ref={containerRef} className="h-full w-full bg-gray-50 overflow-auto">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseEnter={handleCanvasMouseEnter}
        onMouseLeave={handleCanvasMouseLeave}
        className={`cursor-${tool === "select" ? (isDragging ? "grabbing" : "default") : "crosshair"}`}
        style={{ display: "block" }}
        tabIndex={0}
      />

      {/* Status bar */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Tool: {tool} | Format: {currentPage.format.name} ({currentPage.format.printWidth}×
        {currentPage.format.printHeight}mm) | Zoom: {Math.round(canvas.zoom * 100)}% | Elements:{" "}
        {currentPage.layers.reduce((total, layer) => total + layer.elements.length, 0)}
      </div>
    </div>
  );
}
