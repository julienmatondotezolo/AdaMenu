/* eslint-disable no-unused-vars */
import { X } from "lucide-react";
import React, { useEffect, useRef } from "react";

type DialogProps = {
  open: boolean;
  children: React.ReactNode;
  setIsOpen: (value: boolean) => void;
};

function Dialog({ open, setIsOpen, children }: DialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, setIsOpen]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          open
            ? "bg-black/50 backdrop-blur-sm opacity-100"
            : "bg-black/0 backdrop-blur-none opacity-0 pointer-events-none"
        }`}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div
          ref={modalRef}
          className={`
            relative w-full max-w-4xl max-h-[90vh] 
            bg-white dark:bg-gray-900 
            rounded-2xl shadow-2xl 
            border border-gray-200 dark:border-gray-700
            overflow-hidden flex flex-col
            transform transition-all duration-300
            ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
          `}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 group"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
          </button>

          {/* Content */}
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </>
  );
}

export { Dialog };
