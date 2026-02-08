import { X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function MobileBottomSheet({ isOpen, onClose, title, children }: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startTranslate: number } | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Reset position when opening
  useEffect(() => {
    if (isOpen) {
      setTranslateY(0);
    }
  }, [isOpen]);

  const handleDragStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      dragRef.current = {
        startY: touch.clientY,
        startTranslate: translateY,
      };
      setIsDragging(true);
    },
    [translateY]
  );

  const handleDragMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragRef.current) return;
      const touch = e.touches[0];
      const dy = touch.clientY - dragRef.current.startY;
      // Only allow dragging down (positive translateY)
      const newTranslate = Math.max(0, dragRef.current.startTranslate + dy);
      setTranslateY(newTranslate);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (!dragRef.current) return;

    // If dragged more than 100px down, close the sheet
    if (translateY > 100) {
      onClose();
    } else {
      // Snap back to open position
      setTranslateY(0);
    }
    dragRef.current = null;
  }, [translateY, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        style={{ opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl"
        style={{
          maxHeight: "70vh",
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: "calc(70vh - 80px)" }}>
          {children}
        </div>
      </div>
    </>
  );
}
