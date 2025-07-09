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

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!modalRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={modalRef}
      className={`${
        open ? "block" : "hidden"
      } fixed inset-4 sm:top-[10vh] sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:inset-auto z-50 w-auto sm:w-11/12 md:w-8/12 sm:max-w-4xl border-2 dark:border-gray-800 shadow-lg bg-white dark:bg-background h-[calc(100vh-2rem)] sm:h-[80vh] overflow-hidden flex flex-col`}
    >
      <article className="flex flex-wrap justify-end w-full p-3 sm:p-4 pb-0">
        <X className="cursor-pointer w-6 h-6 sm:w-5 sm:h-5" onClick={handleClose} />
      </article>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

export { Dialog };
