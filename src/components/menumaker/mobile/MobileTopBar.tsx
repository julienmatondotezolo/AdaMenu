import { ArrowLeft, CheckCircle2, Loader2, Save } from "lucide-react";
import React from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";

interface MobileTopBarProps {
  onBack: () => void;
}

export function MobileTopBar({ onBack }: MobileTopBarProps) {
  const { project, saveProject, isSaving, saveSuccess } = useMenuMakerStore();

  if (!project) return null;

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 safe-area-top">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium text-sm min-w-[44px] min-h-[44px] justify-center"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden xs:inline">Back</span>
      </button>

      {/* Project Name */}
      <div className="flex-1 text-center mx-2 min-w-0">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {project.name}
        </h1>
        <div className="flex items-center justify-center gap-1 text-xs">
          {isSaving ? (
            <span className="text-blue-600 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          ) : saveSuccess ? (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">Quick Edit</span>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={saveProject}
        disabled={isSaving}
        className="flex items-center gap-1 bg-blue-600 text-white font-medium text-sm px-3 py-2 rounded-lg min-h-[44px] hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        <span>Save</span>
      </button>
    </div>
  );
}
