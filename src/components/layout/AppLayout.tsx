"use client";

import React, { useState } from "react";

import PasswordPrompt from "@/components/PasswordPrompt";

import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [authenticated, setAuthenticated] = useState(false);

  // Check if the environment is local development
  const isLocal = process.env.NODE_ENV === "development";

  if (!isLocal && !authenticated) {
    return <PasswordPrompt onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#EFF4F8] dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* pb-bottom-nav adds bottom padding on mobile for the bottom navigation */}
        <div className="flex-1 overflow-y-auto pb-bottom-nav md:pb-0 scroll-touch">{children}</div>
      </main>
    </div>
  );
}
