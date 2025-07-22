"use client";

import { AdaHeader } from "@/components";
import { PDFViewer } from "@/components/pdf/PDFViewer";

export default function MenuPage() {
  return (
    <main className="relative h-screen overflow-hidden">
      <AdaHeader />
      <div className="h-[calc(100vh-48px)] p-4">
        <PDFViewer />
      </div>
    </main>
  );
}
