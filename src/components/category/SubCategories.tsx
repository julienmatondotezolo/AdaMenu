import { useLocale } from "next-intl";
import React from "react";

function SubCategories({ category }: { category: any }) {
  const locale = useLocale();

  return (
    <div className="p-4 h-20 bg-gray-200 dark:bg-gray-700">
      <h3 className="text-md">{category.names[locale]}</h3>
      {/* <p className="hidden md:block text-xs">{category.id}</p> */}
    </div>
  );
}

export { SubCategories };
