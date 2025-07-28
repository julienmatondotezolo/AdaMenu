import { Loader2 } from "lucide-react";
import React from "react";

import { useMenuMakerStore } from "../../stores/menumaker";

export function ExportLoader() {
  const { isExportingPDF, project, exportProgress } = useMenuMakerStore();

  if (!isExportingPDF || !project) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center gap-6 max-w-md mx-4">
        <div className="flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Generating your Menu</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Please wait while we create your PDF...</p>
          <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mt-2 truncate">
            &quot;{project.name}&quot;
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{exportProgress}% complete</p>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${exportProgress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
