import { Loader2 } from "lucide-react";
import React from "react";

import { useMenuMakerStore } from "../../stores/menumaker";

export function ExportLoader() {
  const { isExportingPDF, project } = useMenuMakerStore();

  if (!isExportingPDF || !project) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center gap-3 z-50 min-w-[280px]">
      <div className="flex-shrink-0">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">Generating your Menu</p>
        <p className="text-xs text-gray-600 truncate">&quot;{project.name}&quot;</p>
      </div>
    </div>
  );
}
