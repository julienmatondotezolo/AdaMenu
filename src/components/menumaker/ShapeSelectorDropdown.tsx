import { Circle, Square, Triangle } from "lucide-react";
import React from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { ShapeType } from "../../types/menumaker";

interface ShapeSelectorDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export function ShapeSelectorDropdown({ isOpen, onClose, buttonRef }: ShapeSelectorDropdownProps) {
  const { setTool } = useMenuMakerStore();

  if (!isOpen) return null;

  const handleShapeSelect = (shapeType: ShapeType) => {
    // Set a temporary shape type in sessionStorage so CanvasArea can pick it up
    sessionStorage.setItem("selectedShapeType", shapeType);
    setTool("shape");
    onClose();
  };

  // Calculate position relative to the shapes button
  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0 };

    const buttonRect = buttonRef.current.getBoundingClientRect();

    return {
      top: buttonRect.bottom + 8, // 8px gap below the button
      left: buttonRect.left + buttonRect.width / 2 - 100, // Center the dropdown (200px width / 2 = 100px)
    };
  };

  const position = getDropdownPosition();

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const shapeOptions = [
    {
      id: "rectangle" as ShapeType,
      label: "Rectangle",
      icon: Square,
    },
    {
      id: "circle" as ShapeType,
      label: "Circle",
      icon: Circle,
    },
    {
      id: "triangle" as ShapeType,
      label: "Triangle",
      icon: Triangle,
    },
  ];

  return (
    <>
      {/* Invisible backdrop to close dropdown when clicking outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleBackdropClick}
        onKeyDown={handleBackdropKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close dropdown"
      />

      {/* Dropdown menu */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.07)",
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Shapes</span>
        </div>

        {/* Shape options */}
        <div className="py-1">
          {shapeOptions.map((shape) => (
            <button
              key={shape.id}
              onClick={() => handleShapeSelect(shape.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex items-center space-x-3">
                <shape.icon className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{shape.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
