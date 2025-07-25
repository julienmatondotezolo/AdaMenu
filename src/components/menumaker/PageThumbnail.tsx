import React, { useEffect, useRef } from "react";

import { MenuPage } from "../../types/menumaker";

interface PageThumbnailProps {
  page: MenuPage;
  width: number;
  height: number;
}

// Function to draw menu items list for menuitem data type in thumbnail
const drawMenuItemsListThumbnail = (ctx: CanvasRenderingContext2D, element: any, x: number, y: number, elementWidth: number, elementHeight: number, scale: number) => {
  try {
    // Use menu items from subcategory data that's already stored in the element
    const menuItems = element.subcategoryData?.menuItems || [];

    if (menuItems && menuItems.length > 0) {
      ctx.fillStyle = element.textColor || "#333";
      const fontSize = Math.max((element.fontSize || 12) * scale * 0.3, 2); // Smaller font for thumbnails

      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const padding = Math.max(2 * scale, 1);
      const lineHeight = fontSize * 1.2;
      let currentY = y + padding;

      // Draw subcategory title if there's space
      if (elementHeight > fontSize * 2) {
        ctx.font = `bold ${Math.max(fontSize * 1.2, 3)}px Arial`;
        const subcategoryTitle = element.subcategoryData.names?.en || element.subcategoryData.name || "Menu Items";
        
        // Truncate title if too long
        const maxTitleWidth = elementWidth - (padding * 2);
        let displayTitle = subcategoryTitle;
        if (ctx.measureText(displayTitle).width > maxTitleWidth) {
          displayTitle = subcategoryTitle.substring(0, Math.floor(maxTitleWidth / fontSize)) + "...";
        }

        ctx.fillText(displayTitle, x + padding, currentY);
        currentY += lineHeight * 1.5;
      }

      // Draw menu items
      ctx.font = `${fontSize}px Arial`;
      let itemsDrawn = 0;
      const maxItems = Math.floor((elementHeight - currentY + y - padding) / lineHeight);

      menuItems.forEach((menuItem: any, index: number) => {
        if (itemsDrawn < maxItems && currentY < y + elementHeight - padding) {
          const itemName = menuItem.names?.en || menuItem.name || "Item";
          const price = menuItem.price ? `€${menuItem.price.toFixed(2)}` : "";
          
          // Truncate item name if too long
          const maxItemWidth = elementWidth - (padding * 2);
          let displayText = price ? `${itemName} - ${price}` : itemName;
          if (ctx.measureText(displayText).width > maxItemWidth) {
            const truncatedName = itemName.substring(0, Math.floor(maxItemWidth / (fontSize * 0.6))) + "...";
            displayText = price ? `${truncatedName} - ${price}` : truncatedName;
          }

          ctx.fillText(displayText, x + padding, currentY);
          currentY += lineHeight;
          itemsDrawn++;
        }
      });

      // If there are more items, show indicator
      if (menuItems.length > maxItems && maxItems > 0) {
        ctx.fillText("...", x + padding, Math.min(currentY, y + elementHeight - padding - fontSize));
      }
    } else {
      // No menu items available
      ctx.fillStyle = element.textColor || "#333";
      ctx.font = `${Math.max((element.fontSize || 12) * scale * 0.3, 2)}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("No items", x + elementWidth / 2, y + elementHeight / 2);
    }
  } catch (error) {
    console.warn("Error drawing menu items in thumbnail:", error);
    // Fallback to simple text
    ctx.fillStyle = "#333";
    ctx.font = `${Math.max((element.fontSize || 12) * scale * 0.3, 2)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("MENU", x + elementWidth / 2, y + elementHeight / 2);
  }
};

export function PageThumbnail({ page, width, height }: PageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        ctx.drawImage(img, 0, 0, width, height);
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
            // Draw image element placeholder
            const x = element.x * scale;
            const y = element.y * scale;
            const elementWidth = element.width * scale;
            const elementHeight = element.height * scale;

            // Draw placeholder background
            ctx.fillStyle = "#f0f0f0";
            ctx.fillRect(x, y, elementWidth, elementHeight);

            // Draw border
            ctx.strokeStyle = "#ccc";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, elementWidth, elementHeight);

            // Only draw "Image" text if element is large enough
            if (elementWidth > 20 && elementHeight > 10) {
              ctx.fillStyle = "#666";
              ctx.font = `${Math.min(elementHeight * 0.3, 8)}px Arial`;
              ctx.textAlign = "center";
              ctx.fillText("Img", x + elementWidth / 2, y + elementHeight / 2);
            }
          } else if (element.type === "data") {
            // Draw data element
            const dataElement = element as any;
            const x = dataElement.x * scale;
            const y = dataElement.y * scale;
            const elementWidth = dataElement.width * scale;
            const elementHeight = dataElement.height * scale;

            // Draw background
            ctx.fillStyle = dataElement.backgroundColor || "#ffffff";
            ctx.fillRect(x, y, elementWidth, elementHeight);

            // Draw border if large enough
            const borderSize = (dataElement.borderSize || 1) * scale;

            if (borderSize > 0 && elementWidth > 2 && elementHeight > 2) {
              ctx.strokeStyle = dataElement.borderColor || "#000000";
              ctx.lineWidth = Math.max(borderSize, 0.5);
              ctx.strokeRect(x, y, elementWidth, elementHeight);
            }

            // Draw data type text if element is large enough
            if (elementWidth > 15 && elementHeight > 8) {
              // Handle different data types
              if (dataElement.dataType === "menuitem" && dataElement.subcategoryData) {
                // Draw menu items list for menu item data elements
                drawMenuItemsListThumbnail(ctx, dataElement, x, y, elementWidth, elementHeight, scale);
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
                const subcategoryName = dataElement.subcategoryData.names?.en || dataElement.subcategoryData.name || "Subcategory";
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
