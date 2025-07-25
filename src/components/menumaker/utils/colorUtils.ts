// Helper function to convert hex color to rgba with opacity
export const hexToRgba = (hex: string, opacity: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result) {
    return `rgba(255, 255, 255, ${opacity})`;
  }

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper function to get background style with opacity
export const getBackgroundStyle = (backgroundColor: string, backgroundOpacity?: number): string | null => {
  const opacity = backgroundOpacity !== undefined ? backgroundOpacity : 1;

  if (opacity <= 0) {
    return null; // No background to draw
  }

  return hexToRgba(backgroundColor, opacity);
};
