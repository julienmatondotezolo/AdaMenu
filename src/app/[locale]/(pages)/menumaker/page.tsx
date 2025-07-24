"use client";

import React, { useEffect, useState } from "react";

import { AdaHeader } from "@/components";
import { MenuMakerEditor } from "@/components/menumaker/MenuMakerEditor";
import { PageFormatSelector } from "@/components/menumaker/PageFormatSelector";
import { useMenuMakerStore } from "@/stores/menumaker";

export default function MenuMakerPage() {
  const [showFormatSelector, setShowFormatSelector] = useState(true);

  const handleFormatSelected = () => {
    // Project creation is now handled in PageFormatSelector
    setShowFormatSelector(false);
  };

  const handleNewProject = () => {
    setShowFormatSelector(true);
  };

  if (showFormatSelector) {
    return (
      <main className="relative h-screen overflow-hidden">
        <AdaHeader />
        <div className="h-[calc(100vh-48px)] flex items-center justify-center bg-gray-50">
          <PageFormatSelector onFormatSelected={handleFormatSelected} />
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen overflow-hidden">
      <AdaHeader />
      <div className="h-[calc(100vh-48px)]">
        <MenuMakerEditor onNewProject={handleNewProject} />
      </div>
    </main>
  );
}
