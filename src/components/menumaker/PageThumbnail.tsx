import React, { useEffect, useRef, useState } from "react";

import { MenuPage } from "../../types/menumaker";
import { getBackgroundStyle } from "./utils/colorUtils";
import { drawMenuItemsList } from "./utils/drawMenuItemsList";

interface PageThumbnailProps {
  page: MenuPage;
  width: number;
  height: number;
}

export function PageThumbnail({ page, width, height }: PageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Calculate scale factor
    const scaleX = width / page.format.width;
    const scaleY = height / page.format.height;
    const scale = Math.min(scaleX, scaleY);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw page background
    ctx.fillStyle = page.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw background image if available
    if (page.backgroundImage) {
      const img = new Image();

      img.onload = () => {
        ctx.save();
        ctx.globalAlpha = page.backgroundImageOpacity ?? 1;
        ctx.drawImage(img, 0, 0, width, height);
        ctx.restore();
        // Redraw elements after background image loads
        drawElements();
      };
      img.onerror = () => {
        console.warn("Failed to load background image for thumbnail");
        drawElements();
      };
      img.src = page.backgroundImage;
    } else {
      drawElements();
    }

    function drawElements() {
      if (!ctx) return;

      // Draw all elements from all layers
      page.layers.forEach((layer) => {
        if (!layer.visible) return;

        layer.elements.forEach((element) => {
          if (!element.visible) return;

          ctx.save();
          ctx.globalAlpha = element.opacity * layer.opacity;

          if (element.type === "text") {
            // Draw text element
            const fontSize = Math.max(element.fontSize * scale, 1); // Minimum 1px font size
            const x = element.x * scale;
            const y = element.y * scale;

            ctx.font = `${element.fontStyle} ${fontSize}px ${element.fontFamily}`;
            ctx.fillStyle = element.fill;
            ctx.textAlign = element.align as "left" | "center" | "right" | "start" | "end";

            // Ensure text is visible even at small scales
            if (fontSize >= 2) {
              ctx.fillText(element.content, x, y + fontSize);
            } else {
              // For very small text, just draw a colored rectangle
              const textWidth = element.content.length * fontSize * 0.6;

              ctx.fillRect(x, y, Math.max(textWidth, 2), Math.max(fontSize, 1));
            }
          } else if (element.type === "image") {
            // Draw image element
            const x = element.x * scale;
            const y = element.y * scale;
            const elementWidth = element.width * scale;
            const elementHeight = element.height * scale;

            // Draw actual image if available
            if (element.src) {
              const cachedImage = imageCache.get(element.src);

              if (cachedImage && cachedImage.complete) {
                // Image is loaded and ready to draw
                ctx.save();
                ctx.globalAlpha = (element.opacity ?? 1) * layer.opacity;

                // Draw the image scaled to fit the element dimensions
                ctx.drawImage(cachedImage, x, y, elementWidth, elementHeight);

                ctx.restore();
              } else if (!cachedImage) {
                // Load the image and cache it
                const img = new Image();

                img.onload = () => {
                  setImageCache((prev) => new Map(prev.set(element.src, img)));
                  // Trigger a redraw when image loads
                  drawElements();
                };
                img.onerror = () => {
                  console.warn("Failed to load image for thumbnail:", element.src);
                };
                img.src = element.src;

                // Store the loading image in cache to prevent multiple loads
                setImageCache((prev) => new Map(prev.set(element.src, img)));

                // Draw placeholder while loading
                ctx.fillStyle = "#f0f0f0";
                ctx.fillRect(x, y, elementWidth, elementHeight);

                // Draw border
                ctx.strokeStyle = "#ccc";
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, elementWidth, elementHeight);

                // Only draw loading text if element is large enough
                if (elementWidth > 20 && elementHeight > 10) {
                  ctx.fillStyle = "#666";
                  ctx.font = `${Math.min(elementHeight * 0.3, 8)}px Arial`;
                  ctx.textAlign = "center";
                  ctx.fillText("...", x + elementWidth / 2, y + elementHeight / 2);
                }
              } else {
                // Image is loading, show placeholder
                ctx.fillStyle = "#f0f0f0";
                ctx.fillRect(x, y, elementWidth, elementHeight);

                // Draw border
                ctx.strokeStyle = "#ccc";
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, elementWidth, elementHeight);

                // Only draw loading text if element is large enough
                if (elementWidth > 20 && elementHeight > 10) {
                  ctx.fillStyle = "#666";
                  ctx.font = `${Math.min(elementHeight * 0.3, 8)}px Arial`;
                  ctx.textAlign = "center";
                  ctx.fillText("...", x + elementWidth / 2, y + elementHeight / 2);
                }
              }
            } else {
              // No src, draw placeholder
              ctx.fillStyle = "#f0f0f0";
              ctx.fillRect(x, y, elementWidth, elementHeight);

              // Draw border
              ctx.strokeStyle = "#ccc";
              ctx.lineWidth = 0.5;
              ctx.strokeRect(x, y, elementWidth, elementHeight);

              // Only draw "No Image" text if element is large enough
              if (elementWidth > 20 && elementHeight > 10) {
                ctx.fillStyle = "#666";
                ctx.font = `${Math.min(elementHeight * 0.3, 8)}px Arial`;
                ctx.textAlign = "center";
                ctx.fillText("Img", x + elementWidth / 2, y + elementHeight / 2);
              }
            }
          } else if (element.type === "data") {
            // Draw data element
            const dataElement = element as any;
            const x = dataElement.x * scale;
            const y = dataElement.y * scale;
            const elementWidth = dataElement.width * scale;
            const elementHeight = dataElement.height * scale;

            // Draw background with opacity
            const backgroundStyle = getBackgroundStyle(
              dataElement.backgroundColor || "#ffffff",
              dataElement.backgroundOpacity,
            );

            if (backgroundStyle) {
              ctx.fillStyle = backgroundStyle;
              ctx.fillRect(x, y, elementWidth, elementHeight);
            }

            // Draw border if large enough
            const borderSize = (dataElement.borderSize || 0) * scale;

            if (borderSize > 0 && elementWidth > 2 && elementHeight > 2) {
              ctx.strokeStyle = dataElement.borderColor || "#000000";
              ctx.lineWidth = Math.max(borderSize, 0.1);
              ctx.strokeRect(x, y, elementWidth, elementHeight);
            }

            // Draw data type text if element is large enough
            if (elementWidth > 15 && elementHeight > 8) {
              // Handle different data types
              if (dataElement.dataType === "menuitem" && dataElement.subcategoryData) {
                // Draw menu items list for menu item data elements
                drawMenuItemsList({
                  ctx,
                  element: dataElement,
                  x,
                  y,
                  width: elementWidth,
                  height: elementHeight,
                  scale,
                  isThumbnail: true,
                });
              } else if (dataElement.dataType === "category" && dataElement.categoryData) {
                // Show category name
                ctx.fillStyle = dataElement.textColor || "#333";
                ctx.font = `${Math.min(elementHeight * 0.3, 8)}px Arial`;
                ctx.textAlign = "center";
                const categoryName = dataElement.categoryData.names?.en || dataElement.categoryData.name || "Category";

                ctx.fillText(categoryName, x + elementWidth / 2, y + elementHeight / 2);
              } else if (dataElement.dataType === "subcategory" && dataElement.subcategoryData) {
                // Show subcategory name
                ctx.fillStyle = dataElement.textColor || "#333";
                ctx.font = `${Math.min(elementHeight * 0.3, 8)}px Arial`;
                ctx.textAlign = "center";
                const subcategoryName =
                  dataElement.subcategoryData.names?.en || dataElement.subcategoryData.name || "Subcategory";

                ctx.fillText(subcategoryName, x + elementWidth / 2, y + elementHeight / 2);
              } else {
                // Default data type text for other cases
                ctx.fillStyle = "#333";
                ctx.font = `${Math.min(elementHeight * 0.2, 6)}px Arial`;
                ctx.textAlign = "center";
                const dataTypeText = dataElement.dataType ? dataElement.dataType.substring(0, 4).toUpperCase() : "DATA";

                ctx.fillText(dataTypeText, x + elementWidth / 2, y + elementHeight / 2);
              }
            }
          }

          ctx.restore();
        });
      });
    }
  }, [page, width, height, imageCache]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full rounded"
      style={{ backgroundColor: page.backgroundColor }}
    />
  );
}
