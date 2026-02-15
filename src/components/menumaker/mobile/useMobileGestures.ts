import React, { useCallback, useRef, useState } from "react";

interface PinchState {
  initialDistance: number;
  initialScale: number;
}

interface PanState {
  startX: number;
  startY: number;
  initialOffsetX: number;
  initialOffsetY: number;
}

interface UseMobileGesturesOptions {
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: () => void;
  minScale?: number;
  maxScale?: number;
}

export function useMobileGestures(options: UseMobileGesturesOptions = {}) {
  const { onTap, onDoubleTap, minScale = 0.5, maxScale = 4 } = options;

  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const pinchRef = useRef<PinchState | null>(null);
  const panRef = useRef<PanState | null>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouchMoving = useRef(false);

  const getDistance = (touches: React.TouchList): number => {
    const [t1, t2] = [touches[0], touches[1]];
    return Math.sqrt(
      Math.pow(t2.clientX - t1.clientX, 2) + Math.pow(t2.clientY - t1.clientY, 2)
    );
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isTouchMoving.current = false;

      if (e.touches.length === 2) {
        // Start pinch
        const distance = getDistance(e.touches);
        pinchRef.current = {
          initialDistance: distance,
          initialScale: scale,
        };
        panRef.current = null;
      } else if (e.touches.length === 1 && scale > 1) {
        // Start pan (only when zoomed in)
        const touch = e.touches[0];
        panRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          initialOffsetX: offsetX,
          initialOffsetY: offsetY,
        };
        pinchRef.current = null;
      }
    },
    [scale, offsetX, offsetY]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      isTouchMoving.current = true;

      if (e.touches.length === 2 && pinchRef.current) {
        // Pinch zoom
        e.preventDefault();
        const distance = getDistance(e.touches);
        const scaleRatio = distance / pinchRef.current.initialDistance;
        const newScale = Math.min(
          maxScale,
          Math.max(minScale, pinchRef.current.initialScale * scaleRatio)
        );
        setScale(newScale);
      } else if (e.touches.length === 1 && panRef.current && scale > 1) {
        // Pan
        const touch = e.touches[0];
        const dx = touch.clientX - panRef.current.startX;
        const dy = touch.clientY - panRef.current.startY;
        setOffsetX(panRef.current.initialOffsetX + dx);
        setOffsetY(panRef.current.initialOffsetY + dy);
      }
    },
    [scale, minScale, maxScale]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      pinchRef.current = null;
      panRef.current = null;

      // Handle taps (only if no movement occurred and single touch ended)
      if (!isTouchMoving.current && e.changedTouches.length === 1 && e.touches.length === 0) {
        const touch = e.changedTouches[0];
        const now = Date.now();

        // Double-tap detection (300ms window)
        if (now - lastTapRef.current < 300 && onDoubleTap) {
          if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
            tapTimeoutRef.current = null;
          }
          onDoubleTap();
          lastTapRef.current = 0;
        } else {
          // Single tap with delay (to distinguish from double-tap)
          lastTapRef.current = now;
          if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
          }
          tapTimeoutRef.current = setTimeout(() => {
            if (onTap) {
              onTap(touch.clientX, touch.clientY);
            }
            tapTimeoutRef.current = null;
          }, 300);
        }
      }
    },
    [onTap, onDoubleTap]
  );

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  }, []);

  return {
    scale,
    offsetX,
    offsetY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetZoom,
    setScale,
    setOffsetX,
    setOffsetY,
  };
}
