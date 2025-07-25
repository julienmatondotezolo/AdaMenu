import { MenuItem } from "../../../types/adamenudata";

export interface DrawMenuItemsListOptions {
  ctx: CanvasRenderingContext2D;
  element: any;
  x: number;
  y: number;
  width: number;
  height: number;
  scale?: number;
  isThumbnail?: boolean;
}

// Function to draw menu items list for menuitem data type
export const drawMenuItemsList = ({
  ctx,
  element,
  x,
  y,
  width,
  height,
  scale = 1,
  isThumbnail = false
}: DrawMenuItemsListOptions) => {
  try {
    // Use menu items from subcategory data that's already stored in the element
    const menuItems = element.subcategoryData?.menuItems || [];

    if (menuItems && menuItems.length > 0) {
      ctx.fillStyle = element.textColor || "#333";
      const baseFontSize = element.fontSize || 12;
      const fontSize = isThumbnail ? Math.max(baseFontSize * scale * 0.3, 2) : baseFontSize * scale;

      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const padding = isThumbnail ? Math.max(2 * scale, 1) : 10 * scale;
      const lineHeight = fontSize * 1.2;
      let currentY = y + padding;

      // Draw subcategory title (if enabled)
      const showTitle = element.showSubcategoryTitle !== false; // Default to true
      if (showTitle && height > fontSize * 2) {
        ctx.font = `bold ${Math.max(fontSize * 1.2, isThumbnail ? 3 : fontSize)}px Arial`;
        const subcategoryTitle = element.subcategoryData.names?.en || element.subcategoryData.name || "Menu Items";
        
        if (isThumbnail) {
          // Truncate title if too long for thumbnail
          const maxTitleWidth = width - (padding * 2);
          let displayTitle = subcategoryTitle;
          if (ctx.measureText(displayTitle).width > maxTitleWidth) {
            displayTitle = subcategoryTitle.substring(0, Math.floor(maxTitleWidth / fontSize)) + "...";
          }
          ctx.fillText(displayTitle, x + padding, currentY);
        } else {
          ctx.fillText(subcategoryTitle, x + padding, currentY);
        }
        currentY += lineHeight * 1.5;
      }

      // Draw menu items
      ctx.font = `${fontSize}px Arial`;
      let itemsDrawn = 0;
      const maxItems = isThumbnail ? Math.floor((height - currentY + y - padding) / lineHeight) : Infinity;

      const layout = element.menuLayout || "left"; // Default to left layout
      const showDescription = element.showMenuDescription === true; // Default to false
      const showCurrency = element.showCurrencySign !== false; // Default to true

      menuItems.forEach((menuItem: MenuItem, index: number) => {
        if ((!isThumbnail || itemsDrawn < maxItems) && currentY < y + height - padding) {
          const itemName = menuItem.names?.en || "Unnamed Item";
          const description = showDescription ? (menuItem.descriptions?.en || "") : "";
          const price = menuItem.price ? (showCurrency ? `€${menuItem.price.toFixed(2)}` : menuItem.price.toFixed(2)) : "";

          if (layout === "justified" && !isThumbnail) {
            // Justified layout: text on left, price on right
            const rightPadding = padding;
            const availableWidth = width - padding - rightPadding;
            
            // Draw item name on the left
            ctx.textAlign = "left";
            ctx.fillText(itemName, x + padding, currentY);
            
            // Draw price on the right
            if (price) {
              ctx.textAlign = "right";
              ctx.fillText(price, x + width - rightPadding, currentY);
            }
            
            currentY += lineHeight;
            
            // Draw description if enabled (left aligned, smaller font)
            if (description && showDescription) {
              const descriptionFontSize = fontSize * 0.8;
              ctx.font = `${descriptionFontSize}px Arial`;
              ctx.textAlign = "left";
              ctx.fillStyle = (element.textColor || "#333") + "80"; // Semi-transparent
              ctx.fillText(description, x + padding, currentY);
              ctx.fillStyle = element.textColor || "#333"; // Reset color
              ctx.font = `${fontSize}px Arial`; // Reset font
              currentY += descriptionFontSize * 1.1;
            }
          } else {
            // Left layout: all text on the left (current behavior)
            ctx.textAlign = "left";
            
            let itemText = itemName;
            if (price) {
              itemText = `${itemName} - ${price}`;
            }
            
            if (isThumbnail) {
              // Truncate item text if too long for thumbnail
              const maxItemWidth = width - (padding * 2);
              if (ctx.measureText(itemText).width > maxItemWidth) {
                const truncatedName = itemName.substring(0, Math.floor(maxItemWidth / (fontSize * 0.6))) + "...";
                itemText = price ? `${truncatedName} - ${price}` : truncatedName;
              }
            }

            ctx.fillText(itemText, x + padding, currentY);
            currentY += lineHeight;
            
            // Draw description if enabled (smaller font, slightly indented)
            if (description && showDescription && !isThumbnail) {
              const descriptionFontSize = fontSize * 0.8;
              ctx.font = `${descriptionFontSize}px Arial`;
              ctx.fillStyle = (element.textColor || "#333") + "80"; // Semi-transparent
              ctx.fillText(description, x + padding + 10, currentY);
              ctx.fillStyle = element.textColor || "#333"; // Reset color
              ctx.font = `${fontSize}px Arial`; // Reset font
              currentY += descriptionFontSize * 1.1;
            }
          }
          
          itemsDrawn++;
        }
      });

      // If there are more items in thumbnail, show indicator
      if (isThumbnail && menuItems.length > maxItems && maxItems > 0) {
        ctx.textAlign = "left";
        ctx.fillText("...", x + padding, Math.min(currentY, y + height - padding - fontSize));
      }
    } else {
      // No menu items available
      ctx.fillStyle = element.textColor || "#333";
      ctx.font = `${isThumbnail ? Math.max((element.fontSize || 12) * scale * 0.3, 2) : (element.fontSize || 12) * scale}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(isThumbnail ? "No items" : "No menu items available", x + width / 2, y + height / 2);
    }
  } catch (error) {
    console.warn("Error drawing menu items:", error);
    // Fallback display
    ctx.fillStyle = "#333";
    ctx.font = `${isThumbnail ? Math.max((element.fontSize || 12) * scale * 0.3, 2) : (element.fontSize || 12) * scale}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(isThumbnail ? "MENU" : "Error loading menu items", x + width / 2, y + height / 2);
  }
}; 