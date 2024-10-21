import { useLocale } from "next-intl";
import React from "react";

import { usePathname, useRouter } from "@/navigation";

function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const menuStyle = `flex text-xs py-2 px-4 hover:bg-white/20 dark:text-white cursor-pointer group rounded-xl`;

  const changeLanguage = (language: any) => {
    router.push(pathname, { locale: language });
  };

  return (
    <div className="flex flex-row w-full">
      <button className={`${menuStyle} ${locale == "en" ? "bg-black/20" : ""}`} onClick={() => changeLanguage("en")}>
        <p className={`group-hover:underline ${locale == "en" ? "font-bold" : "font-light"}`}>ENG</p>
      </button>
      <button className={`${menuStyle} ${locale == "fr" ? "bg-black/20" : ""}`} onClick={() => changeLanguage("fr")}>
        <p className={`group-hover:underline ${locale == "fr" ? "font-bold" : "font-light"}`}>FR</p>
      </button>
      <button className={`${menuStyle} ${locale == "nl" ? "bg-black/20" : ""}`} onClick={() => changeLanguage("nl")}>
        <p className={`group-hover:underline ${locale == "nl" ? "font-bold" : "font-light"}`}>NL</p>
      </button>
      <button className={`${menuStyle} ${locale == "it" ? "bg-black/20" : ""}`} onClick={() => changeLanguage("it")}>
        <p className={`group-hover:underline ${locale == "it" ? "font-bold" : "font-light"}`}>IT</p>
      </button>
    </div>
  );
}

export { LanguageSwitcher };
