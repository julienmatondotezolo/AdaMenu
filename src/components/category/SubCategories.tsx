import { useLocale } from "next-intl";
import React from "react";

function SubCategories({ category }: { category: any }) {
  const locale = useLocale();

  return (
    <div className="cursor-pointer p-2 h-10 md:h-16 bg-gray-200 dark:bg-gray-800">
      <h3 className="text-xs md:text-sm">{category.names[locale]}</h3>
    </div>
  );
}

export { SubCategories };
