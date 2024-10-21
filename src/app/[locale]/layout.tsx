import "../../assets/styles/globals.css";

import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import React from "react";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ADA - Menu manager",
  description: "Adaptive Menu manager system working on multiple devices",
};

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html suppressHydrationWarning={true} lang={locale}>
      <body className={`${dmSans.className}`}>{children}</body>
    </html>
  );
}
