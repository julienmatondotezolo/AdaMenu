"use client";

import React, { useEffect, useRef, useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { ShapeElement, TextElement } from "../../types/menumaker";
import { drawElements, drawHoverBoundingBox, drawPageBackground, drawSelectionBox } from "./drawings";
import { drawShapeElement } from "./drawings/drawShapeElement";
import { ActiveGuideline, snapGuidelineManager } from "./utils/snapGuidelines";

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
    selectedShapeType,
    setSelectedShapeType,
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
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
  const [activeSnapGuidelines, setActiveSnapGuidelines] = useState<ActiveGuideline[]>([]);
  const [shapePreviewPosition, setShapePreviewPosition] = useState<{ x: number; y: number } | null>(null);

  const [backgroundImageCache, setBackgroundImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const [imageElementCache, setImageElementCache] = useState<Map<string, HTMLImageElement>>(new Map());

  const currentPage = project?.pages.find((page) => page.id === currentPageId);
  const currentLayer = editorState.selectedLayerId;
  const { canvas, tool } = editorState;

  // Clear shape preview when tool changes or selectedShapeType is cleared
  useEffect(() => {
    if (tool !== "shape" || !selectedShapeType) {
      setShapePreviewPosition(null);
    }
  }, [tool, selectedShapeType]);

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

  // Handle keyboard shortcuts and shift key detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Track shift key state
      if (e.key === "Shift") {
        setIsShiftPressed(true);
      }

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

    const handleKeyUp = (e: KeyboardEvent) => {
      // Track shift key state
      if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
    drawPageBackground({
      ctx,
      page: currentPage,
      canvas,
      pageOffset,
      backgroundImageCache,
      setBackgroundImageCache,
    });

    // Draw elements
    drawElements({
      ctx,
      page: currentPage,
      canvas,
      selectedIds: editorState.selectedElementIds,
      pageOffset,
      tempElementPositions,
      tempElementDimensions,
      imageElementCache,
      setImageElementCache,
    });

    // Draw shape preview if hovering with shape tool
    if (tool === "shape" && selectedShapeType && shapePreviewPosition) {
      const previewShape: ShapeElement = {
        id: "preview",
        type: "shape",
        shapeType: selectedShapeType,
        x: shapePreviewPosition.x,
        y: shapePreviewPosition.y,
        width: selectedShapeType === "rectangle" ? 400 : 250,
        height: selectedShapeType === "rectangle" ? 100 : 250,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: 0,
        locked: false,
        visible: true,
        opacity: 0.25,
        fill: "#f63c3c", // Red fill
        stroke: "#AF1E1EFF", // Darker red stroke
        strokeWidth: 2,
        radius: 0,
      };

      drawShapeElement({
        ctx,
        element: previewShape,
        canvas,
        isSelected: false,
        pageOffset,
        tempElementPositions: {},
        tempElementDimensions: {},
      });
    }

    // Draw selection box if selecting
    if (isSelecting && tool === "select") {
      drawSelectionBox({
        ctx,
        selectionStart,
        selectionEnd,
      });
    }

    // Draw hover bounding box for text elements when in text mode
    if (hoveredElementId && !editorState.selectedElementIds.includes(hoveredElementId) && tool === "select") {
      drawHoverBoundingBox({
        ctx,
        elementId: hoveredElementId,
        currentPage,
        tempElementPositions,
        tempElementDimensions,
        pageOffset,
        canvas,
      });
    }

    // Draw snap guidelines
    if (activeSnapGuidelines.length > 0 && currentPage) {
      snapGuidelineManager.drawGuidelines(ctx, activeSnapGuidelines, pageOffset, currentPage.format, canvas.zoom);
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
    imageElementCache,
    tempElementPositions,
    tempElementDimensions,
    activeSnapGuidelines,
    selectedShapeType,
    shapePreviewPosition,
  ]);

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
      if (!layer.visible || layer.locked) return; // Skip locked layers

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

  // Helper function to check if an element is in a locked layer
  const isElementInLockedLayer = (elementId: string): boolean => {
    if (!currentPage) return false;

    for (const layer of currentPage.layers) {
      if (layer.locked && layer.elements.some((el) => el.id === elementId)) {
        return true;
      }
    }
    return false;
  };

  // Get selectable element at position (excludes elements in locked layers)
  const getSelectableElementAtPosition = (mouseX: number, mouseY: number): string | null => {
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

      if (!layer.visible || layer.locked) continue; // Skip locked layers

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

      // Check if hovering over an element in a locked layer
      if (hoveredElementId && isElementInLockedLayer(hoveredElementId)) {
        return "not-allowed";
      }

      return "default";
    }

    // Handle shape tool
    if (tool === "shape") {
      return "crosshair";
    }

    // Default cursor for other tools (image, data, etc.)
    return "crosshair";
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

      if (!layer.visible || layer.locked) continue; // Skip locked layers

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

          // Initialize snap points for guidelines (exclude the element being resized)
          snapGuidelineManager.initializeSnapPoints(currentPage, [elementId]);

          return;
        }
      }

      // Check if clicking on an element (excluding elements in locked layers)
      const clickedElementId = getSelectableElementAtPosition(mouseX, mouseY);

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

          // Initialize snap points for guidelines (exclude selected elements)
          snapGuidelineManager.initializeSnapPoints(currentPage, [clickedElementId]);
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

          // Initialize snap points for guidelines (exclude selected elements)
          snapGuidelineManager.initializeSnapPoints(currentPage, editorState.selectedElementIds);
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

        // Clear snap guidelines
        setActiveSnapGuidelines([]);
        snapGuidelineManager.clear();
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

          // Find the element to check type and constraints
          let isTextElement = false;
          let isImageElement = false;
          let textElement = null;
          let aspectRatio = null;

          if (currentPage) {
            for (const layer of currentPage.layers) {
              const element = layer.elements.find((el) => el.id === elementId);

              if (element) {
                if (element.type === "text") {
                  isTextElement = true;
                  textElement = element;
                } else if (element.type === "image") {
                  isImageElement = true;
                  // Calculate aspect ratio from original dimensions
                  aspectRatio = element.originalWidth / element.originalHeight;
                }
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

          // For image elements, set reasonable minimum dimensions
          if (isImageElement) {
            minWidth = 10; // Minimum image width
            minHeight = 10; // Minimum image height
          }

          // Apply resize based on handle
          switch (resizeHandle) {
            case "tl": // Top-left
              newWidth = Math.max(minWidth, startDim.width - deltaX);
              newHeight = Math.max(minHeight, startDim.height - deltaY);

              // Apply aspect ratio for images if shift is not pressed
              if (isImageElement && aspectRatio && !isShiftPressed) {
                // Maintain aspect ratio - use the dimension that changed less
                const widthRatio = newWidth / startDim.width;
                const heightRatio = newHeight / startDim.height;

                if (Math.abs(1 - widthRatio) < Math.abs(1 - heightRatio)) {
                  // Width changed less, adjust height based on width
                  newHeight = Math.max(minHeight, newWidth / aspectRatio);
                } else {
                  // Height changed less, adjust width based on height
                  newWidth = Math.max(minWidth, newHeight * aspectRatio);
                }
              }

              newX = startPos.x + (startDim.width - newWidth);
              newY = startPos.y + (startDim.height - newHeight);
              break;
            case "tr": // Top-right
              newWidth = Math.max(minWidth, startDim.width + deltaX);
              newHeight = Math.max(minHeight, startDim.height - deltaY);

              // Apply aspect ratio for images if shift is not pressed
              if (isImageElement && aspectRatio && !isShiftPressed) {
                const widthRatio = newWidth / startDim.width;
                const heightRatio = newHeight / startDim.height;

                if (Math.abs(1 - widthRatio) < Math.abs(1 - heightRatio)) {
                  newHeight = Math.max(minHeight, newWidth / aspectRatio);
                } else {
                  newWidth = Math.max(minWidth, newHeight * aspectRatio);
                }
              }

              newY = startPos.y + (startDim.height - newHeight);
              break;
            case "bl": // Bottom-left
              newWidth = Math.max(minWidth, startDim.width - deltaX);
              newHeight = Math.max(minHeight, startDim.height + deltaY);

              // Apply aspect ratio for images if shift is not pressed
              if (isImageElement && aspectRatio && !isShiftPressed) {
                const widthRatio = newWidth / startDim.width;
                const heightRatio = newHeight / startDim.height;

                if (Math.abs(1 - widthRatio) < Math.abs(1 - heightRatio)) {
                  newHeight = Math.max(minHeight, newWidth / aspectRatio);
                } else {
                  newWidth = Math.max(minWidth, newHeight * aspectRatio);
                }
              }

              newX = startPos.x + (startDim.width - newWidth);
              break;
            case "br": // Bottom-right
              newWidth = Math.max(minWidth, startDim.width + deltaX);
              newHeight = Math.max(minHeight, startDim.height + deltaY);

              // Apply aspect ratio for images if shift is not pressed
              if (isImageElement && aspectRatio && !isShiftPressed) {
                const widthRatio = newWidth / startDim.width;
                const heightRatio = newHeight / startDim.height;

                if (Math.abs(1 - widthRatio) < Math.abs(1 - heightRatio)) {
                  newHeight = Math.max(minHeight, newWidth / aspectRatio);
                } else {
                  newWidth = Math.max(minWidth, newHeight * aspectRatio);
                }
              }

              break;
          }

          setTempElementDimensions({
            [elementId]: { width: newWidth, height: newHeight, x: newX, y: newY },
          });

          // Calculate snapping during resizing
          if (currentPage) {
            // Create snap points for the element being resized based on resize handle
            const edgeSnapPoints: { x?: number[]; y?: number[] } = {};

            // Determine which edges to snap based on resize handle
            switch (resizeHandle) {
              case "tl": // Top-left: snap left edge, top edge
                edgeSnapPoints.x = [newX]; // left edge
                edgeSnapPoints.y = [newY]; // top edge
                break;
              case "tr": // Top-right: snap right edge, top edge
                edgeSnapPoints.x = [newX + newWidth]; // right edge
                edgeSnapPoints.y = [newY]; // top edge
                break;
              case "bl": // Bottom-left: snap left edge, bottom edge
                edgeSnapPoints.x = [newX]; // left edge
                edgeSnapPoints.y = [newY + newHeight]; // bottom edge
                break;
              case "br": // Bottom-right: snap right edge, bottom edge
                edgeSnapPoints.x = [newX + newWidth]; // right edge
                edgeSnapPoints.y = [newY + newHeight]; // bottom edge
                break;
            }

            // Calculate snap using the edge snap method
            const snapResult = snapGuidelineManager.calculateEdgeSnap(edgeSnapPoints, canvas.zoom);
            const { snapOffsetX, snapOffsetY, foundXSnap, foundYSnap, guidelines: activeGuidelines } = snapResult;

            // Apply snap offsets to position and dimensions
            let snappedX = newX;
            let snappedY = newY;
            let snappedWidth = newWidth;
            let snappedHeight = newHeight;

            if (foundXSnap) {
              switch (resizeHandle) {
                case "tl":
                case "bl":
                  // Left edge snapped - adjust x and width
                  snappedX = newX + snapOffsetX;
                  snappedWidth = newWidth - snapOffsetX;
                  break;
                case "tr":
                case "br":
                  // Right edge snapped - adjust width only
                  snappedWidth = newWidth + snapOffsetX;
                  break;
              }
            }

            if (foundYSnap) {
              switch (resizeHandle) {
                case "tl":
                case "tr":
                  // Top edge snapped - adjust y and height
                  snappedY = newY + snapOffsetY;
                  snappedHeight = newHeight - snapOffsetY;
                  break;
                case "bl":
                case "br":
                  // Bottom edge snapped - adjust height only
                  snappedHeight = newHeight + snapOffsetY;
                  break;
              }
            }

            setTempElementDimensions({
              [elementId]: { width: snappedWidth, height: snappedHeight, x: snappedX, y: snappedY },
            });

            // Set active guidelines
            setActiveSnapGuidelines(activeGuidelines);
          } else {
            setTempElementDimensions({
              [elementId]: { width: newWidth, height: newHeight, x: newX, y: newY },
            });
          }
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

        // Calculate snapping during dragging
        if (currentPage) {
          // Prepare dragged elements data for snap calculation
          const draggedElements = editorState.selectedElementIds
            .map((elementId) => {
              const tempPos = newTempPositions[elementId];
              let element = null;

              // Find the element in the page layers
              for (const layer of currentPage.layers) {
                const found = layer.elements.find((el) => el.id === elementId);

                if (found) {
                  element = found;
                  break;
                }
              }

              if (element && tempPos) {
                return {
                  id: elementId,
                  x: tempPos.x,
                  y: tempPos.y,
                  width: element.width,
                  height: element.height,
                };
              }
              return null;
            })
            .filter(Boolean) as Array<{ id: string; x: number; y: number; width: number; height: number }>;

          // Calculate snap result
          const snapResult = snapGuidelineManager.calculateSnap(draggedElements, canvas.zoom);

          // Apply snapping if available
          if (snapResult.snappedX !== undefined || snapResult.snappedY !== undefined) {
            const snappedPositions: Record<string, { x: number; y: number }> = {};

            editorState.selectedElementIds.forEach((elementId, index) => {
              const startPos = elementStartPositions[elementId];

              if (startPos) {
                snappedPositions[elementId] = {
                  x:
                    snapResult.snappedX !== undefined
                      ? snapResult.snappedX +
                        (index > 0 ? startPos.x - elementStartPositions[editorState.selectedElementIds[0]].x : 0)
                      : newTempPositions[elementId].x,
                  y:
                    snapResult.snappedY !== undefined
                      ? snapResult.snappedY +
                        (index > 0 ? startPos.y - elementStartPositions[editorState.selectedElementIds[0]].y : 0)
                      : newTempPositions[elementId].y,
                };
              }
            });
            setTempElementPositions(snappedPositions);
          }

          // Set active guidelines
          setActiveSnapGuidelines(snapResult.guidelines);
        }
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
    } else if (tool === "shape" && selectedShapeType) {
      // Track mouse position for shape preview
      const pageX = (mouseX - pageOffset.x) / canvas.zoom;
      const pageY = (mouseY - pageOffset.y) / canvas.zoom;

      // Only show preview if mouse is within page bounds
      if (
        currentPage &&
        pageX >= 0 &&
        pageY >= 0 &&
        pageX <= currentPage.format.width &&
        pageY <= currentPage.format.height
      ) {
        setShapePreviewPosition({ x: pageX, y: pageY });
      } else {
        setShapePreviewPosition(null);
      }
    } else {
      // Clear preview position for other tools
      setShapePreviewPosition(null);
    }
  };

  // Handle mouse enter/leave for keyboard event handling
  const handleCanvasMouseEnter = () => {
    setIsCanvasHovered(true);
  };

  const handleCanvasMouseLeave = () => {
    setIsCanvasHovered(false);
    setHoveredElementId(null); // Clear hover state when leaving canvas
    setShapePreviewPosition(null); // Clear shape preview when leaving canvas
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

        // Clear snap guidelines
        setActiveSnapGuidelines([]);
        snapGuidelineManager.clear();
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

        // Clear snap guidelines
        setActiveSnapGuidelines([]);
        snapGuidelineManager.clear();
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

      // Add text element and select it immediately
      const newElementId = addElement(currentPageId!, currentLayer || firstLayer.id, newText);

      // Select the newly created element and switch to select tool
      selectElements([newElementId]);
      setTool("select");
    } else if (tool === "shape") {
      if (selectedShapeType) {
        // Add new shape element
        const newShape: Omit<ShapeElement, "id"> = {
          type: "shape",
          shapeType: selectedShapeType,
          x: relativeX,
          y: relativeY,
          width: selectedShapeType === "rectangle" ? 400 : 250,
          height: selectedShapeType === "rectangle" ? 100 : 250,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          zIndex: 0,
          locked: false,
          visible: true,
          opacity: 1,
          fill: "#f63c3c", // Red fill
          stroke: "#AF1E1EFF", // Darker red stroke
          strokeWidth: 2,
          radius: 0, // Default radius for rounded corners
        };

        const firstLayer = currentPage.layers[0];

        // Add shape element and select it immediately
        const newElementId = addElement(currentPageId!, currentLayer || firstLayer.id, newShape);

        // Select the newly created element and switch to select tool
        selectElements([newElementId]);
        setTool("select");

        // Clear the selected shape type
        setSelectedShapeType(null);
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
