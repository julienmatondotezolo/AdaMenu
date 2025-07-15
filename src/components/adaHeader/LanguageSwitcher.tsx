import { useLocale } from "next-intl";
import React, { useEffect } from "react";

import { usePathname, useRouter } from "@/navigation";

type Locale = "en" | "fr" | "nl";

const STORAGE_KEY = "ada-menu-language";

function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const menuStyle =
    "flex items-center w-full text-sm py-2 px-4 hover:bg-white/10 rounded-lg cursor-pointer transition-colors";

  const changeLanguage = (language: Locale) => {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, language);
    router.push(pathname, { locale: language });
  };

  // Set language based on localStorage or default to French
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem(STORAGE_KEY) as Locale | null;

      // If there's a saved language and it's different from current
      if (savedLanguage && savedLanguage !== locale) {
        changeLanguage(savedLanguage);
      }
      // If no saved language and current is not French
      else if (!savedLanguage && locale !== "fr") {
        changeLanguage("fr");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col w-full space-y-1">
      <button
        className={`${menuStyle} ${locale === "fr" ? "bg-white/20 font-semibold" : ""}`}
        onClick={() => changeLanguage("fr")}
      >
        Français
      </button>
      <button
        className={`${menuStyle} ${locale === "en" ? "bg-white/20 font-semibold" : ""}`}
        onClick={() => changeLanguage("en")}
      >
        English
      </button>
      <button
        className={`${menuStyle} ${locale === "nl" ? "bg-white/20 font-semibold" : ""}`}
        onClick={() => changeLanguage("nl")}
      >
        Nederlands
      </button>
    </div>
  );
}

export { LanguageSwitcher };
