"use client";

import React, { useState } from "react";

import { AdaHeader, Categories } from "@/components";
import PasswordPrompt from "@/components/PasswordPrompt";

export default function Index() {
  const [authenticated, setAuthenticated] = useState(false);

  // Check if the environment is local development
  const isLocal = process.env.NODE_ENV === "development";

  if (!isLocal && !authenticated) {
    return <PasswordPrompt onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <main className="relative h-screen overflow-hidden">
      <AdaHeader />
      <Categories />
    </main>
  );
}
