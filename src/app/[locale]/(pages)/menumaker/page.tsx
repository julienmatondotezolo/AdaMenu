"use client";

import React, { useState } from "react";

import { AdaHeader } from "@/components";
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
    <main className="relative h-screen overflow-hidden">
      <AdaHeader />
      <div className="h-[calc(100vh-48px)]">
        {currentView === "projects" && (
          <div className="h-full bg-gray-50 overflow-auto">
            <ProjectManager onCreateNew={handleCreateNew} onOpenProject={handleOpenProject} />
          </div>
        )}

        {currentView === "format" && (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <PageFormatSelector onFormatSelected={handleFormatSelected} />
          </div>
        )}

        {currentView === "editor" && <MenuMakerEditor onNewProject={handleNewProject} />}
      </div>
    </main>
  );
}
