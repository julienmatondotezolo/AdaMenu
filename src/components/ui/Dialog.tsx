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
      } fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 md:w-8/12 border-2 dark:border-gray-800 p-6 shadow-lg bg-white dark:bg-background max-h-[80vh] overflow-hidden`}
    >
      <article className="flex flex-wrap justify-end w-full">
        {/* <p className="font-bold text-xl">Invoice</p> */}
        <X className="cursor-pointer" onClick={handleClose} />
      </article>
      <div className="w-full h-[400px] overflow-y-scroll pb-6">{children}</div>
    </div>
  );
}

export { Dialog };
