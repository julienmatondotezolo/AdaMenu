import React from "react";

interface DrawPageBackgroundParams {
  ctx: CanvasRenderingContext2D;
  page: any;
  canvas: any;
  pageOffset: { x: number; y: number };
  backgroundImageCache: Map<string, HTMLImageElement>;
  setBackgroundImageCache: React.Dispatch<React.SetStateAction<Map<string, HTMLImageElement>>>;
  failedBackgroundImages: Set<string>;
  setFailedBackgroundImages: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const drawPageBackground = ({
  ctx,
  page,
  canvas,
  pageOffset,
  backgroundImageCache,
  setBackgroundImageCache,
  failedBackgroundImages,
  setFailedBackgroundImages,
}: DrawPageBackgroundParams) => {
  const pageWidth = page.format.width * canvas.zoom;
  const pageHeight = page.format.height * canvas.zoom;

  // Draw page shadow
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillRect(pageOffset.x + 3, pageOffset.y + 3, pageWidth, pageHeight);

  // Draw page background color
  ctx.fillStyle = page.backgroundColor;
  ctx.fillRect(pageOffset.x, pageOffset.y, pageWidth, pageHeight);

  // Draw background image if available
  if (page.backgroundImage && !failedBackgroundImages.has(page.backgroundImage)) {
    const cachedImage = backgroundImageCache.get(page.backgroundImage);

    if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0) {
      // Image is loaded successfully and ready to draw
      ctx.save();
      ctx.globalAlpha = page.backgroundImageOpacity ?? 1;
      ctx.drawImage(cachedImage, pageOffset.x, pageOffset.y, pageWidth, pageHeight);
      ctx.restore();
    } else if (cachedImage && cachedImage.complete && cachedImage.naturalWidth === 0) {
      // Image is broken, add to failed list and remove from cache
      console.warn("Adding broken background image to failed list:", page.backgroundImage);
      setFailedBackgroundImages((prev) => new Set(prev).add(page.backgroundImage));
      setBackgroundImageCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(page.backgroundImage);
        return newCache;
      });
    } else if (!cachedImage) {
      // Load the image and cache it
      const img = new Image();

      img.crossOrigin = "anonymous"; // Enable CORS to prevent canvas tainting

      img.onload = () => {
        setBackgroundImageCache((prev) => new Map(prev.set(page.backgroundImage, img)));
        // Trigger a full canvas redraw when image loads
        // This will be handled by the useEffect that redraws the canvas
      };
      img.onerror = () => {
        console.warn("Failed to load background image:", page.backgroundImage);
        // Add to failed list and remove from cache to prevent future attempts
        setFailedBackgroundImages((prev) => new Set(prev).add(page.backgroundImage));
        setBackgroundImageCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(page.backgroundImage);
          return newCache;
        });
      };
      img.src = page.backgroundImage;

      // Store the loading image in cache to prevent multiple loads
      setBackgroundImageCache((prev) => new Map(prev.set(page.backgroundImage, img)));
    }
  }
};
