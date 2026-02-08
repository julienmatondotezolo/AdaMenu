"use client";

import React, { useState } from "react";

import { MenuMakerEditor, PageFormatSelector, ProjectManager } from "@/components/menumaker";
import { useMenuMakerStore } from "@/stores/menumaker";

type ViewState = "projects" | "format" | "editor";

export default function MenuMakerPage() {
  const [currentView, setCurrentView] = useState<ViewState>("projects");
  const { project, clearProject } = useMenuMakerStore();

  const handleCreateNew = () => {
    setCurrentView("format");
  };

  const handleOpenProject = () => {
    setCurrentView("editor");
  };

  const handleFormatSelected = () => {
    setCurrentView("editor");
  };

  const handleNewProject = () => {
    clearProject();
    setCurrentView("projects");
  };

  // If we have a project loaded, go directly to editor
  React.useEffect(() => {
    if (project && currentView === "projects") {
      setCurrentView("editor");
    }
  }, [project, currentView]);

  return (
    <div className="h-full bg-white dark:bg-[#121212]">
      {currentView === "projects" && (
        <div className="h-full overflow-auto">
          <ProjectManager onCreateNew={handleCreateNew} onOpenProject={handleOpenProject} />
        </div>
      )}

      {currentView === "format" && (
        <div className="h-full overflow-auto">
          <PageFormatSelector onFormatSelected={handleFormatSelected} onReturn={handleNewProject} />
        </div>
      )}

      {currentView === "editor" && <MenuMakerEditor onNewProject={handleNewProject} />}
    </div>
  );
}
