import React, { useEffect, useRef } from "react";

import { indexedDBService } from "../../lib/indexedDBService";
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
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Helper function to calculate image fitting (like CSS object-fit: cover)
  const calculateImageFit = (
    imageWidth: number,
    imageHeight: number,
    containerWidth: number,
    containerHeight: number,
    containerX: number,
    containerY: number
  ) => {
    const imageAspect = imageWidth / imageHeight;
    const containerAspect = containerWidth / containerHeight;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    if (imageAspect > containerAspect) {
      // Image is wider than container - fit by height (cover effect)
      drawHeight = containerHeight;
      drawWidth = drawHeight * imageAspect;
      drawX = containerX - (drawWidth - containerWidth) / 2;
      drawY = containerY;
    } else {
      // Image is taller than container - fit by width (cover effect)
      drawWidth = containerWidth;
      drawHeight = drawWidth / imageAspect;
      drawX = containerX;
      drawY = containerY - (drawHeight - containerHeight) / 2;
    }

    return { drawX, drawY, drawWidth, drawHeight };
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Calculate scale factor for cover effect (fills entire thumbnail)
    const scaleX = width / page.format.width;
    const scaleY = height / page.format.height;
    const scale = Math.max(scaleX, scaleY); // Use max for cover effect

    // Calculate centering offsets
    const scaledPageWidth = page.format.width * scale;
    const scaledPageHeight = page.format.height * scale;
    const offsetX = (width - scaledPageWidth) / 2;
    const offsetY = (height - scaledPageHeight) / 2;

    // Track if we're currently drawing to prevent infinite loops
    let isDrawing = false;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw page background to fill entire thumbnail
    ctx.fillStyle = page.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Set up clipping to thumbnail bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    // Load and draw background image if available
    const loadBackgroundImage = async () => {
      let backgroundImageSrc = page.backgroundImage;

      // If we have a backgroundImageId, always load fresh blob from IndexedDB
      // This ensures we get a valid blob URL even if the stored one became invalid
      if (page.backgroundImageId) {
        try {
          const blobUrl = await indexedDBService.getImage(page.backgroundImageId);

          if (blobUrl) {
            backgroundImageSrc = blobUrl;
          }
        } catch (error) {
          console.warn("Failed to load background image from IndexedDB:", error);
        }
      }

      if (backgroundImageSrc) {
        const img = new Image();

        img.crossOrigin = "anonymous"; // Enable CORS to prevent canvas tainting

        img.onload = () => {
          ctx.save();
          ctx.globalAlpha = page.backgroundImageOpacity ?? 1;
          
          // Calculate proper background image fitting to maintain aspect ratio
          const bgFit = calculateImageFit(
            img.naturalWidth,
            img.naturalHeight,
            scaledPageWidth,
            scaledPageHeight,
            offsetX,
            offsetY
          );

          // Draw background image with proper fitting
          ctx.drawImage(img, bgFit.drawX, bgFit.drawY, bgFit.drawWidth, bgFit.drawHeight);
          
          ctx.restore();
          // Redraw elements after background image loads
          if (!isDrawing) {
            drawElements();
          }
        };
        img.onerror = () => {
          console.warn("Failed to load background image for thumbnail");
          if (!isDrawing) {
            drawElements();
          }
        };
        img.src = backgroundImageSrc;
      } else {
        drawElements();
      }
    };

    loadBackgroundImage();

    function drawElements() {
      if (!ctx || isDrawing) return;

      // Set drawing flag to prevent infinite loops
      isDrawing = true;

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
            const x = element.x * scale + offsetX;
            const y = element.y * scale + offsetY;

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
            const x = element.x * scale + offsetX;
            const y = element.y * scale + offsetY;
            const elementWidth = element.width * scale;
            const elementHeight = element.height * scale;

            // Load and draw actual image if available
            const loadElementImage = async () => {
              let imageSrc = element.src;

              // If we have an imageId, always load fresh blob from IndexedDB
              // This ensures we get a valid blob URL even if the stored one became invalid
              if ((element as any).imageId) {
                try {
                  const blobUrl = await indexedDBService.getImage((element as any).imageId);

                  if (blobUrl) {
                    imageSrc = blobUrl;
                  }
                } catch (error) {
                  console.warn("Failed to load element image from IndexedDB:", error);
                }
              }

              if (imageSrc) {
                const cachedImage = imageCacheRef.current.get(imageSrc);

                if (cachedImage && cachedImage.complete) {
                  // Image is loaded and ready to draw
                  ctx.save();
                  ctx.globalAlpha = (element.opacity ?? 1) * layer.opacity;

                  // Calculate proper image fitting to maintain aspect ratio
                  const fit = calculateImageFit(
                    cachedImage.naturalWidth,
                    cachedImage.naturalHeight,
                    elementWidth,
                    elementHeight,
                    x,
                    y
                  );

                  // Clip to element bounds to prevent overflow
                  ctx.beginPath();
                  ctx.rect(x, y, elementWidth, elementHeight);
                  ctx.clip();

                  // Draw the image with proper fitting
                  ctx.drawImage(cachedImage, fit.drawX, fit.drawY, fit.drawWidth, fit.drawHeight);

                  ctx.restore();
                } else if (!cachedImage) {
                  // Load the image and cache it
                  const img = new Image();

                  img.crossOrigin = "anonymous"; // Enable CORS to prevent canvas tainting

                  img.onload = () => {
                    imageCacheRef.current.set(imageSrc!, img);
                    // Draw this specific image element instead of redrawing everything
                    ctx.save();
                    ctx.globalAlpha = (element.opacity ?? 1) * layer.opacity;

                    // Calculate proper image fitting to maintain aspect ratio
                    const fit = calculateImageFit(
                      img.naturalWidth,
                      img.naturalHeight,
                      elementWidth,
                      elementHeight,
                      x,
                      y
                    );

                    // Clip to element bounds to prevent overflow
                    ctx.beginPath();
                    ctx.rect(x, y, elementWidth, elementHeight);
                    ctx.clip();

                    // Draw the image with proper fitting
                    ctx.drawImage(img, fit.drawX, fit.drawY, fit.drawWidth, fit.drawHeight);

                    ctx.restore();
                  };
                  img.onerror = () => {
                    console.warn("Failed to load image for thumbnail:", imageSrc);
                    // Remove failed image from cache to allow retry
                    imageCacheRef.current.delete(imageSrc!);
                  };
                  img.src = imageSrc;

                  // Store the loading image in cache to prevent multiple loads
                  imageCacheRef.current.set(imageSrc, img);

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
                // No src available, draw placeholder
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
            };

            if (element.src || (element as any).imageId) {
              // Call the async function and handle it properly
              loadElementImage().catch((error) => {
                console.warn("Error loading element image:", error);
                // Draw placeholder on error
                ctx.fillStyle = "#f0f0f0";
                ctx.fillRect(x, y, elementWidth, elementHeight);
                ctx.strokeStyle = "#ccc";
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, elementWidth, elementHeight);
                if (elementWidth > 20 && elementHeight > 10) {
                  ctx.fillStyle = "#666";
                  ctx.font = `${Math.min(elementHeight * 0.3, 8)}px Arial`;
                  ctx.textAlign = "center";
                  ctx.fillText("Error", x + elementWidth / 2, y + elementHeight / 2);
                }
              });
            } else {
              // No src or imageId, draw placeholder
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
          } else if (element.type === "shape") {
            // Draw shape element
            const shapeElement = element as any;
            const x = shapeElement.x * scale + offsetX;
            const y = shapeElement.y * scale + offsetY;
            const elementWidth = shapeElement.width * scale;
            const elementHeight = shapeElement.height * scale;

            // Set fill and stroke styles
            if (shapeElement.fill) {
              ctx.fillStyle = shapeElement.fill;
            }
            if (shapeElement.stroke) {
              ctx.strokeStyle = shapeElement.stroke;
              ctx.lineWidth = Math.max((shapeElement.strokeWidth || 1) * scale, 0.5);
            }

            // Draw the shape based on its type
            switch (shapeElement.shapeType) {
              case "rectangle":
                if (shapeElement.radius > 0) {
                  // Rounded rectangle
                  const radius = Math.max(shapeElement.radius * scale, 1);

                  ctx.beginPath();
                  ctx.roundRect(x, y, elementWidth, elementHeight, radius);
                } else {
                  // Regular rectangle
                  ctx.beginPath();
                  ctx.rect(x, y, elementWidth, elementHeight);
                }
                break;

              case "circle": {
                // Draw circle/ellipse
                const centerX = x + elementWidth / 2;
                const centerY = y + elementHeight / 2;
                const radiusX = elementWidth / 2;
                const radiusY = elementHeight / 2;

                ctx.beginPath();
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                break;
              }

              case "triangle":
                // Draw triangle
                ctx.beginPath();
                ctx.moveTo(x + elementWidth / 2, y); // Top point
                ctx.lineTo(x, y + elementHeight); // Bottom left
                ctx.lineTo(x + elementWidth, y + elementHeight); // Bottom right
                ctx.closePath();
                break;
            }

            // Fill and stroke the shape
            if (shapeElement.fill) {
              ctx.fill();
            }
            if (shapeElement.stroke && (shapeElement.strokeWidth || 0) > 0) {
              ctx.stroke();
            }
          } else if (element.type === "data") {
            // Draw data element
            const dataElement = element as any;
            const x = dataElement.x * scale + offsetX;
            const y = dataElement.y * scale + offsetY;
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
              } else if (dataElement.dataType === "category") {
                // Show category name
                ctx.fillStyle = dataElement.titleTextColor || dataElement.textColor || "#333";
                const fontSize = Math.min(elementHeight * 0.3, 8);
                const fontFamily = dataElement.titleTextFontFamily || "Arial";
                const fontWeight = dataElement.titleTextFontWeight || "normal";

                ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                ctx.textAlign = "center";

                let categoryName = "Select category";

                if (dataElement.categoryData) {
                  const lang = dataElement.titleLanguage || dataElement.itemNameLanguage || "en";

                  categoryName =
                    dataElement.categoryData.names?.[lang] ||
                    dataElement.categoryData.names?.en ||
                    dataElement.categoryData.names?.fr ||
                    dataElement.categoryData.names?.it ||
                    dataElement.categoryData.names?.nl ||
                    dataElement.categoryData.name ||
                    "Category";
                }

                ctx.fillText(categoryName, x + elementWidth / 2, y + elementHeight / 2);
              } else if (dataElement.dataType === "subcategory") {
                // Show subcategory name
                ctx.fillStyle = dataElement.titleTextColor || dataElement.textColor || "#333";
                const fontSize = Math.min(elementHeight * 0.3, 8);
                const fontFamily = dataElement.titleTextFontFamily || "Arial";
                const fontWeight = dataElement.titleTextFontWeight || "normal";

                ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                ctx.textAlign = "center";

                let subcategoryName = "Select subcategory";

                if (dataElement.subcategoryData) {
                  const lang = dataElement.titleLanguage || dataElement.itemNameLanguage || "en";

                  subcategoryName =
                    dataElement.subcategoryData.names?.[lang] ||
                    dataElement.subcategoryData.names?.en ||
                    dataElement.subcategoryData.names?.fr ||
                    dataElement.subcategoryData.names?.it ||
                    dataElement.subcategoryData.names?.nl ||
                    dataElement.subcategoryData.name ||
                    "Subcategory";
                }

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

      // Reset drawing flag
      isDrawing = false;

      // Restore canvas context (removes clipping)
      ctx.restore();
    }
  }, [page, width, height]);

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
