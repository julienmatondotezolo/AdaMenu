import { MenuElement, MenuPage } from "../../../types/menumaker";

export interface SnapPoint {
  value: number;
  type: "x" | "y";
  elementId: string;
  edge: "left" | "right" | "center" | "top" | "bottom" | "middle";
}

export interface ActiveGuideline {
  value: number;
  type: "x" | "y";
  elementIds: string[];
}

export interface SnapResult {
  snappedX?: number;
  snappedY?: number;
  guidelines: ActiveGuideline[];
}

export class SnapGuidelineManager {
  private snapPoints: SnapPoint[] = [];
  private snapDistance: number = 8; // pixels
  private guidelineColor: string = "#ff69b4"; // pink
  private guidelineWidth: number = 1;

  /**
   * Initialize snap points from all elements except the ones being dragged
   */
  initializeSnapPoints(page: MenuPage, excludeElementIds: string[]): void {
    this.snapPoints = [];
    const excludeSet = new Set(excludeElementIds);

    // Add canvas edge snap points
    this.addCanvasEdgeSnapPoints(page);

    page.layers.forEach((layer) => {
      if (!layer.visible) return;

      layer.elements.forEach((element) => {
        if (!element.visible || excludeSet.has(element.id)) return;

        // Add snap points for this element
        this.addElementSnapPoints(element);
      });
    });
  }

  /**
   * Add snap points for canvas edges
   */
  private addCanvasEdgeSnapPoints(page: MenuPage): void {
    const { width, height } = page.format;

    // X-axis snap points (vertical guidelines) - left and right edges
    this.snapPoints.push(
      { value: 0, type: "x", elementId: "canvas-left", edge: "left" },
      { value: width, type: "x", elementId: "canvas-right", edge: "right" },
      { value: width / 2, type: "x", elementId: "canvas-center", edge: "center" },
    );

    // Y-axis snap points (horizontal guidelines) - top and bottom edges
    this.snapPoints.push(
      { value: 0, type: "y", elementId: "canvas-top", edge: "top" },
      { value: height, type: "y", elementId: "canvas-bottom", edge: "bottom" },
      { value: height / 2, type: "y", elementId: "canvas-middle", edge: "middle" },
    );
  }

  /**
   * Add snap points for a single element
   */
  private addElementSnapPoints(element: MenuElement): void {
    const { x, y, width, height } = element;

    // X-axis snap points (vertical guidelines)
    this.snapPoints.push(
      { value: x, type: "x", elementId: element.id, edge: "left" },
      { value: x + width / 2, type: "x", elementId: element.id, edge: "center" },
      { value: x + width, type: "x", elementId: element.id, edge: "right" },
    );

    // Y-axis snap points (horizontal guidelines)
    this.snapPoints.push(
      { value: y, type: "y", elementId: element.id, edge: "top" },
      { value: y + height / 2, type: "y", elementId: element.id, edge: "middle" },
      { value: y + height, type: "y", elementId: element.id, edge: "bottom" },
    );
  }

  /**
   * Calculate snapping for elements being dragged - simplified version
   */
  calculateSnap(
    draggedElements: { id: string; x: number; y: number; width: number; height: number }[],
    zoom: number,
  ): SnapResult {
    if (draggedElements.length === 0) {
      return { guidelines: [] };
    }

    const snapDistanceInPageSpace = this.snapDistance / zoom;
    const activeGuidelines: ActiveGuideline[] = [];
    let snappedX: number | undefined;
    let snappedY: number | undefined;

    const firstElement = draggedElements[0];

    // Calculate snap points for the first element
    const elementSnapPointsX = [
      firstElement.x, // left edge
      firstElement.x + firstElement.width / 2, // center
      firstElement.x + firstElement.width, // right edge
    ];

    const elementSnapPointsY = [
      firstElement.y, // top edge
      firstElement.y + firstElement.height / 2, // middle
      firstElement.y + firstElement.height, // bottom edge
    ];

    let bestXDistance = Infinity;
    let bestYDistance = Infinity;
    let bestXValue: number | undefined;
    let bestYValue: number | undefined;

    // Find closest X snap
    elementSnapPointsX.forEach((snapX) => {
      this.snapPoints.forEach((snapPoint) => {
        if (snapPoint.type !== "x") return;

        const distance = Math.abs(snapX - snapPoint.value);

        if (distance <= snapDistanceInPageSpace && distance < bestXDistance) {
          bestXDistance = distance;
          bestXValue = snapPoint.value;
          snappedX = snapPoint.value - (snapX - firstElement.x);
        }
      });
    });

    // Find closest Y snap
    elementSnapPointsY.forEach((snapY) => {
      this.snapPoints.forEach((snapPoint) => {
        if (snapPoint.type !== "y") return;

        const distance = Math.abs(snapY - snapPoint.value);

        if (distance <= snapDistanceInPageSpace && distance < bestYDistance) {
          bestYDistance = distance;
          bestYValue = snapPoint.value;
          snappedY = snapPoint.value - (snapY - firstElement.y);
        }
      });
    });

    // Add guidelines for active snaps
    if (bestXValue !== undefined) {
      activeGuidelines.push({
        value: bestXValue,
        type: "x",
        elementIds: [firstElement.id],
      });
    }

    if (bestYValue !== undefined) {
      activeGuidelines.push({
        value: bestYValue,
        type: "y",
        elementIds: [firstElement.id],
      });
    }

    return {
      snappedX,
      snappedY,
      guidelines: activeGuidelines,
    };
  }

  /**
   * Calculate snapping for specific edges during resize operations
   */
  calculateEdgeSnap(
    edgePoints: { x?: number[]; y?: number[] },
    zoom: number,
  ): {
    snapOffsetX: number;
    snapOffsetY: number;
    foundXSnap: boolean;
    foundYSnap: boolean;
    guidelines: ActiveGuideline[];
  } {
    const snapDistanceInPageSpace = this.snapDistance / zoom;
    let snapOffsetX = 0;
    let snapOffsetY = 0;
    let foundXSnap = false;
    let foundYSnap = false;
    const activeGuidelines: ActiveGuideline[] = [];

    // Check X snapping
    if (edgePoints.x) {
      let bestXDistance = Infinity;
      let bestXValue: number | undefined;

      edgePoints.x.forEach((edgeX) => {
        this.snapPoints.forEach((snapPoint) => {
          if (snapPoint.type !== "x") return;

          const distance = Math.abs(edgeX - snapPoint.value);

          if (distance <= snapDistanceInPageSpace && distance < bestXDistance) {
            bestXDistance = distance;
            bestXValue = snapPoint.value;
            snapOffsetX = snapPoint.value - edgeX;
            foundXSnap = true;
          }
        });
      });

      if (bestXValue !== undefined) {
        activeGuidelines.push({
          value: bestXValue,
          type: "x",
          elementIds: [],
        });
      }
    }

    // Check Y snapping
    if (edgePoints.y) {
      let bestYDistance = Infinity;
      let bestYValue: number | undefined;

      edgePoints.y.forEach((edgeY) => {
        this.snapPoints.forEach((snapPoint) => {
          if (snapPoint.type !== "y") return;

          const distance = Math.abs(edgeY - snapPoint.value);

          if (distance <= snapDistanceInPageSpace && distance < bestYDistance) {
            bestYDistance = distance;
            bestYValue = snapPoint.value;
            snapOffsetY = snapPoint.value - edgeY;
            foundYSnap = true;
          }
        });
      });

      if (bestYValue !== undefined) {
        activeGuidelines.push({
          value: bestYValue,
          type: "y",
          elementIds: [],
        });
      }
    }

    return {
      snapOffsetX,
      snapOffsetY,
      foundXSnap,
      foundYSnap,
      guidelines: activeGuidelines,
    };
  }

  /**
   * Draw guidelines on canvas
   */
  drawGuidelines(
    ctx: CanvasRenderingContext2D,
    guidelines: ActiveGuideline[],
    pageOffset: { x: number; y: number },
    pageFormat: { width: number; height: number },
    zoom: number,
  ): void {
    if (guidelines.length === 0) return;

    ctx.save();
    ctx.strokeStyle = this.guidelineColor;
    ctx.lineWidth = this.guidelineWidth;
    ctx.setLineDash([5, 5]);

    guidelines.forEach((guideline) => {
      if (guideline.type === "x") {
        // Vertical guideline
        const x = pageOffset.x + guideline.value * zoom;
        const startY = pageOffset.y;
        const endY = pageOffset.y + pageFormat.height * zoom;

        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      } else {
        // Horizontal guideline
        const y = pageOffset.y + guideline.value * zoom;
        const startX = pageOffset.x;
        const endX = pageOffset.x + pageFormat.width * zoom;

        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  /**
   * Update snap distance (useful for different zoom levels)
   */
  setSnapDistance(distance: number): void {
    this.snapDistance = Math.max(1, distance);
  }

  /**
   * Clear all snap points (call when not dragging)
   */
  clear(): void {
    this.snapPoints = [];
  }
}

// Export a singleton instance for global use
export const snapGuidelineManager = new SnapGuidelineManager();
