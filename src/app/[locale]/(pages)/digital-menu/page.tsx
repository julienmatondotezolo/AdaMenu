"use client";

import { AdaHeader } from "@/components";
import { DigitalMenu } from "@/components/digitalMenu";

export default function DigitalMenuPage() {
  return (
    <main className="relative h-screen overflow-hidden">
      <AdaHeader />
      <div className="h-[calc(100vh-48px)]">
        <DigitalMenu />
      </div>
    </main>
  );
}
