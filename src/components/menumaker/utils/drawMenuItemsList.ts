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

// Helper function to break text into lines based on character count
const breakTextIntoLines = (text: string, maxCharsPerLine: number): string[] => {
  if (!text || maxCharsPerLine <= 0) return [text || ""];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than maxCharsPerLine, break it
        if (word.length > maxCharsPerLine) {
          lines.push(word.substring(0, maxCharsPerLine));
          currentLine = word.substring(maxCharsPerLine);
        } else {
          currentLine = word;
        }
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

// Function to draw menu items list for menuitem data type
export const drawMenuItemsList = ({
  ctx,
  element,
  x,
  y,
  width,
  height,
  scale = 1,
  isThumbnail = false,
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

      const padding = isThumbnail ? Math.max(2 * scale, 1) : 10 * 0;
      const lineHeight = fontSize * 1.2;
      let currentY = y + padding;

      // Draw subcategory title (if enabled)
      const showTitle = element.showSubcategoryTitle !== false; // Default to true

      if (showTitle && height > fontSize * 2) {
        // Use custom subcategory title properties if available
        const titleColor = element.subcategoryTitleTextColor || element.textColor || "#333";
        const titleFontSize = isThumbnail
          ? Math.max((element.subcategoryTitleTextFontSize || fontSize * 1.2) * scale * 0.3, 3)
          : (element.subcategoryTitleTextFontSize || fontSize * 1.2) * scale;

        // Apply margins (scaled)
        const titleMarginTop = isThumbnail ? 0 : (element.subcategoryTitleTextMarginTop || 0) * scale;
        const titleMarginLeft = isThumbnail
          ? Math.max(2 * scale, 1)
          : element.subcategoryTitleTextMarginLeft || padding;
        const titleMarginBottom = isThumbnail
          ? Math.max(2 * scale, 1)
          : (element.subcategoryTitleTextMarginBottom || 10) * scale;

        ctx.fillStyle = titleColor;
        const titleFontWeight = element.subcategoryTitleTextFontWeight || "bold";

        ctx.font = `${titleFontWeight} ${titleFontSize}px Arial`;

        // Get title text in specified language
        const titleLanguage = element.subcategoryTitleLanguage || "en";
        let subcategoryTitle = "Menu Items";

        if (element.subcategoryData) {
          if (element.subcategoryData.names && element.subcategoryData.names[titleLanguage]) {
            subcategoryTitle = element.subcategoryData.names[titleLanguage];
          } else {
            subcategoryTitle = element.subcategoryData.names?.en || element.subcategoryData.name || "Menu Items";
          }
        }

        // Adjust currentY position with top margin
        currentY = y + padding + titleMarginTop;

        if (isThumbnail) {
          // Truncate title if too long for thumbnail
          const maxTitleWidth = width - titleMarginLeft * 2;
          let displayTitle = subcategoryTitle;

          if (ctx.measureText(displayTitle).width > maxTitleWidth) {
            displayTitle = subcategoryTitle.substring(0, Math.floor(maxTitleWidth / titleFontSize)) + "...";
          }
          ctx.fillText(displayTitle, x + titleMarginLeft, currentY);
        } else {
          ctx.fillText(subcategoryTitle, x + titleMarginLeft, currentY);
        }

        // Reset fillStyle back to original text color after drawing title
        ctx.fillStyle = element.textColor || "#333";

        currentY += titleFontSize + titleMarginBottom;
      }

      // Draw menu items
      ctx.font = `${fontSize}px Arial`;
      let itemsDrawn = 0;
      const maxItems = isThumbnail ? Math.floor((height - currentY + y - padding) / lineHeight) : Infinity;

      const layout = element.menuLayout || "left"; // Default to left layout
      const showDescription = element.showMenuDescription === true; // Default to false
      const showCurrency = element.showCurrencySign !== false; // Default to true

      menuItems.forEach((menuItem: MenuItem) => {
        if ((!isThumbnail || itemsDrawn < maxItems) && currentY < y + height - padding) {
          const itemName = menuItem.names?.en || "Unnamed Item";
          const description = showDescription ? menuItem.descriptions?.en || "" : "";
          const price = menuItem.price
            ? showCurrency
              ? `€${menuItem.price.toFixed(2)}`
              : menuItem.price.toFixed(2)
            : "";

          if (layout === "justified" && !isThumbnail) {
            // Justified layout: text on left, price on right
            const rightPadding = padding;

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
              // Use custom description properties if available
              const descriptionColor = element.showMenuDescriptionTextColor || element.textColor + "80" || "#66666680";
              const descriptionFontSize = isThumbnail
                ? Math.max((element.showMenuDescriptionTextFontSize || fontSize * 0.8) * scale * 0.3, 2)
                : (element.showMenuDescriptionTextFontSize || fontSize * 0.8) * scale;

              // Apply margins (scaled)
              const descMarginTop = isThumbnail ? 0 : (element.showMenuDescriptionTextMarginTop || 2) * scale;
              const descMarginLeft = isThumbnail
                ? Math.max(2 * scale, 1)
                : (element.showMenuDescriptionTextMarginLeft || 0) * scale;
              const descMarginBottom = isThumbnail ? 0 : (element.showMenuDescriptionTextMarginBottom || 5) * scale;

              // Get description text in specified language
              const descLanguage = element.showMenuDescriptionLanguage || "en";
              let descriptionText = "";

              if (menuItem.descriptions) {
                if (descLanguage === "en" && menuItem.descriptions.en) {
                  descriptionText = menuItem.descriptions.en;
                } else if (descLanguage === "fr" && menuItem.descriptions.fr) {
                  descriptionText = menuItem.descriptions.fr;
                } else if (descLanguage === "it" && menuItem.descriptions.it) {
                  descriptionText = menuItem.descriptions.it;
                } else if (descLanguage === "nl" && menuItem.descriptions.nl) {
                  descriptionText = menuItem.descriptions.nl;
                } else {
                  descriptionText = menuItem.descriptions.en || "";
                }
              }

              if (descriptionText) {
                const descriptionFontWeight = element.showMenuDescriptionTextFontWeight || "normal";

                ctx.font = `${descriptionFontWeight} ${descriptionFontSize}px Arial`;
                ctx.textAlign = "left";
                ctx.fillStyle = descriptionColor;

                currentY += descMarginTop;

                // Break description into lines based on character limit
                const lineBreakChars = element.showMenuDescriptionLineBreakChars || 50;
                const descriptionLines = breakTextIntoLines(descriptionText, lineBreakChars);

                // Draw each line of the description
                descriptionLines.forEach((line, lineIndex) => {
                  ctx.fillText(line, x + descMarginLeft, currentY);
                  if (lineIndex < descriptionLines.length - 1) {
                    currentY += descriptionFontSize * 1.1; // Line spacing
                  }
                });

                ctx.fillStyle = element.textColor || "#333"; // Reset color
                ctx.font = `${fontSize}px Arial`; // Reset font
                currentY += descriptionFontSize + descMarginBottom;
              }
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
              const maxItemWidth = width - padding * 2;

              if (ctx.measureText(itemText).width > maxItemWidth) {
                const truncatedName = itemName.substring(0, Math.floor(maxItemWidth / (fontSize * 0.6))) + "...";

                itemText = price ? `${truncatedName} - ${price}` : truncatedName;
              }
            }

            ctx.fillText(itemText, x + padding, currentY);
            currentY += lineHeight;

            // Draw description if enabled (smaller font, slightly indented)
            if (description && showDescription && !isThumbnail) {
              // Use custom description properties if available
              const descriptionColor = element.showMenuDescriptionTextColor || element.textColor + "80" || "#66666680";
              const descriptionFontSize = (element.showMenuDescriptionTextFontSize || fontSize * 0.8) * scale;

              // Apply margins (scaled)
              const descMarginTop = (element.showMenuDescriptionTextMarginTop || 2) * scale;
              const descMarginLeft = (element.showMenuDescriptionTextMarginLeft || 0) * scale;
              const descMarginBottom = (element.showMenuDescriptionTextMarginBottom || 5) * scale;

              // Get description text in specified language
              const descLanguage = element.showMenuDescriptionLanguage || "en";
              let descriptionText = "";

              if (menuItem.descriptions) {
                if (descLanguage === "en" && menuItem.descriptions.en) {
                  descriptionText = menuItem.descriptions.en;
                } else if (descLanguage === "fr" && menuItem.descriptions.fr) {
                  descriptionText = menuItem.descriptions.fr;
                } else if (descLanguage === "it" && menuItem.descriptions.it) {
                  descriptionText = menuItem.descriptions.it;
                } else if (descLanguage === "nl" && menuItem.descriptions.nl) {
                  descriptionText = menuItem.descriptions.nl;
                } else {
                  descriptionText = menuItem.descriptions.en || "";
                }
              }

              if (descriptionText) {
                const descriptionFontWeight = element.showMenuDescriptionTextFontWeight || "normal";

                ctx.font = `${descriptionFontWeight} ${descriptionFontSize}px Arial`;
                ctx.fillStyle = descriptionColor;

                currentY += descMarginTop;

                // Break description into lines based on character limit
                const lineBreakChars = element.showMenuDescriptionLineBreakChars || 50;
                const descriptionLines = breakTextIntoLines(descriptionText, lineBreakChars);

                // Draw each line of the description
                descriptionLines.forEach((line, lineIndex) => {
                  ctx.fillText(line, x + padding + descMarginLeft, currentY);
                  if (lineIndex < descriptionLines.length - 1) {
                    currentY += descriptionFontSize * 1.1; // Line spacing
                  }
                });

                ctx.fillStyle = element.textColor || "#333"; // Reset color
                ctx.font = `${fontSize}px Arial`; // Reset font
                currentY += descriptionFontSize + descMarginBottom;
              }
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
