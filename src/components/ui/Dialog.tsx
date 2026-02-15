/* eslint-disable no-unused-vars */
import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type DialogProps = {
  open: boolean;
  children: React.ReactNode;
  setIsOpen: (value: boolean) => void;
};

function Dialog({ open, setIsOpen, children }: DialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
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
  }, [open]);

  if (!open && !closing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm ${
          closing ? "overlay-fade-out" : "overlay-fade-in"
        }`}
        onClick={handleClose}
      />

      {/* ═══ Desktop: centered modal ═══ */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            relative w-full max-w-4xl max-h-[90vh]
            bg-white dark:bg-gray-900
            rounded-2xl shadow-2xl
            border border-gray-200 dark:border-gray-700
            overflow-hidden flex flex-col
            transform transition-all duration-300
            ${open && !closing ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"}
          `}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)",
            backdropFilter: "blur(10px)",
          }}
          onClick={(e) => e.stopPropagation()}
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

      {/* ═══ Mobile: full-screen bottom sheet ═══ */}
      <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end" onClick={handleClose}>
        <div
          ref={modalRef}
          className={`
            relative w-full h-[95vh]
            bg-white dark:bg-gray-900
            rounded-t-3xl shadow-2xl
            overflow-hidden flex flex-col
            ${closing ? "sheet-slide-down" : "sheet-slide-up"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle + close */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex-1 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content — full height scrollable */}
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </>
  );
}

export { Dialog };
