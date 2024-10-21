"use client";

import { useTranslations } from "next-intl";

export default function Index() {
  const indexPageText = useTranslations("Index");

  return (
    <main className="relative">
      <p>{indexPageText("welcome")}</p>
    </main>
  );
}
