import "../../assets/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import React from "react";

const dmSans = DM_Sans({ subsets: ["latin"] });

const APP_NAME = "Ada menu";
const APP_DEFAULT_TITLE = "Adaptive Menu app";
const APP_TITLE_TEMPLATE = "%s - Ada menu";
const APP_DESCRIPTION = "Adaptive Menu manager system working on multiple devices";

export const metadata: Metadata = {
  // title: "ADA - Menu manager",
  // description: "Adaptive Menu manager system working on multiple devices",
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
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
