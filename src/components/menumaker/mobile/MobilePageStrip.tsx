import React, { useEffect, useRef } from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";

export function MobilePageStrip() {
  const { project, currentPageId, setCurrentPage } = useMenuMakerStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active page into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const active = activeRef.current;
      const scrollLeft = active.offsetLeft - container.offsetWidth / 2 + active.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
    }
  }, [currentPageId]);

  if (!project || project.pages.length <= 1) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {project.pages.map((page, index) => {
          const isActive = page.id === currentPageId;
          return (
            <button
              key={page.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => setCurrentPage(page.id)}
              className={`flex-shrink-0 flex items-center justify-center min-w-[56px] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
              }`}
            >
              <span className="mr-1">📄</span>
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
