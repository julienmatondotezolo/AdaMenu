"use client";

import React, { useEffect, useRef, useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { TextElement } from "../../types/menumaker";

// Simplified canvas without React Konva for now to avoid DevTools errors
export function CanvasArea() {
  const { project, currentPageId, editorState, selectElements, addElement } = useMenuMakerStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [pageOffset, setPageOffset] = useState({ x: 0, y: 0 });

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
  }, [currentPage, canvasSize, pageOffset, ui.showGrid, ui.gridSize, canvas, editorState.selectedElementIds]);

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
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(pageOffset.x + 3, pageOffset.y + 3, pageWidth, pageHeight);

    // Draw page background
    ctx.fillStyle = page.backgroundColor;
    ctx.fillRect(pageOffset.x, pageOffset.y, pageWidth, pageHeight);

    // Draw page border
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.strokeRect(pageOffset.x, pageOffset.y, pageWidth, pageHeight);
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

  // Handle canvas click
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

    // Clear selection first
    selectElements([]);

    if (tool === "text") {
      // Add text element
      const newText: Omit<TextElement, "id"> = {
        type: "text",
        x: relativeX,
        y: relativeY,
        width: 200,
        height: 40,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: 0,
        locked: false,
        visible: true,
        opacity: 1,
        content: "Double click to edit",
        fontSize: 16,
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
        onClick={handleCanvasClick}
        className="cursor-crosshair"
        style={{ display: "block" }}
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
