import React from "react";

import { drawDataElement } from "./drawDataElement";
import { drawImageElement } from "./drawImageElement";
import { drawShapeElement } from "./drawShapeElement";
import { drawTextElement } from "./drawTextElement";

interface DrawElementsParams {
  ctx: CanvasRenderingContext2D;
  page: any;
  canvas: any;
  selectedIds: string[];
  pageOffset: { x: number; y: number };
  tempElementPositions: Record<string, { x: number; y: number }>;
  tempElementDimensions: Record<string, { width: number; height: number; x?: number; y?: number }>;
  imageElementCache: Map<string, HTMLImageElement>;
  setImageElementCache: React.Dispatch<React.SetStateAction<Map<string, HTMLImageElement>>>;
}

export const drawElements = ({
  ctx,
  page,
  canvas,
  selectedIds,
  pageOffset,
  tempElementPositions,
  tempElementDimensions,
  imageElementCache,
  setImageElementCache,
}: DrawElementsParams) => {
  page.layers.forEach((layer: any) => {
    if (!layer.visible) return;

    layer.elements.forEach((element: any) => {
      const isSelected = selectedIds.includes(element.id);

      if (element.type === "text") {
        drawTextElement({
          ctx,
          element,
          canvas,
          isSelected,
          pageOffset,
          tempElementPositions,
          tempElementDimensions,
        });
      } else if (element.type === "image") {
        drawImageElement({
          ctx,
          element,
          canvas,
          isSelected,
          pageOffset,
          tempElementPositions,
          tempElementDimensions,
          imageElementCache,
          setImageElementCache,
        });
      } else if (element.type === "data") {
        drawDataElement({
          ctx,
          element,
          canvas,
          isSelected,
          pageOffset,
          tempElementPositions,
          tempElementDimensions,
        });
      } else if (element.type === "shape") {
        drawShapeElement({
          ctx,
          element,
          canvas,
          isSelected,
          pageOffset,
          tempElementPositions,
          tempElementDimensions,
        });
      }
    });
  });
};
