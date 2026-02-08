import { Download, Loader2, Redo, Undo } from "lucide-react";
import React from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";

export function MobileActionBar() {
  const { undo, redo, exportToPDF, isExportingPDF } = useMenuMakerStore();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      {/* Undo/Redo */}
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          className="flex items-center justify-center w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Undo"
        >
          <Undo className="w-5 h-5" />
        </button>
        <button
          onClick={redo}
          className="flex items-center justify-center w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Redo"
        >
          <Redo className="w-5 h-5" />
        </button>
      </div>

      {/* Export */}
      <button
        onClick={exportToPDF}
        disabled={isExportingPDF}
        className="flex items-center gap-2 bg-green-600 text-white font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors min-h-[44px]"
      >
        {isExportingPDF ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export PDF
          </>
        )}
      </button>
    </div>
  );
}
