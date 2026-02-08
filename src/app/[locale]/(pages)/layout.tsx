"use client";

import React from "react";
import { Toaster } from "sonner";

import { AppLayout } from "@/components/layout";

import Providers from "../providers";

export default function PagesLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <Providers locale={locale}>
      <AppLayout>{children}</AppLayout>
      <Toaster richColors position="bottom-right" />
    </Providers>
  );
}
