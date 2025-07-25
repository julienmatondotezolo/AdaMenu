import { Check, Clock, Download, Edit2, Loader2, Save, X } from "lucide-react";
import React, { useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface ToolbarProps {
  onNewProject: () => void;
}

export function TopNavBar({ onNewProject }: ToolbarProps) {
  const { project, saveProject, exportToPDF, isExportingPDF, isSaving, updateProjectName } = useMenuMakerStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");

  const formatSavedDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleStartRename = () => {
    if (project) {
      setIsEditingName(true);
      setEditingName(project.name);
    }
  };

  const handleCancelRename = () => {
    setIsEditingName(false);
    setEditingName("");
  };

  const handleSaveRename = () => {
    if (editingName.trim() && project && editingName.trim() !== project.name) {
      updateProjectName(editingName.trim());
    }
    setIsEditingName(false);
    setEditingName("");
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      {/* Left Section - File Actions */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onNewProject}>
          Go to Dashboard
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-2" />
      </div>

      <div className="flex items-center space-x-2">
        {/* Project Name with inline editing */}
        {project && (
          <>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="h-8 w-48"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveRename();
                    } else if (e.key === "Escape") {
                      handleCancelRename();
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={handleSaveRename} className="h-8 w-8 p-0">
                  <Check className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelRename} className="h-8 w-8 p-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900" title={project.name}>
                    {project.name.length > 25 ? `${project.name.substring(0, 25)}...` : project.name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleStartRename} className="h-6 w-6 p-0">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Saved: {formatSavedDate(project.updatedAt)}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Section - View Controls */}
      <div className="flex items-center space-x-2">
        <div className="w-px h-6 bg-gray-300 mx-2" />

        <Button variant="outline" size="sm" onClick={saveProject} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          {isSaving ? "Saving menu..." : "Save"}
        </Button>
        <Button variant="outline" size="sm" onClick={exportToPDF} disabled={isExportingPDF} title="Export to PDF">
          {isExportingPDF ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
          {isExportingPDF ? "Exporting..." : "Export"}
        </Button>
      </div>
    </div>
  );
}
