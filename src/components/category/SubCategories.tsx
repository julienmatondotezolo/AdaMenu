/* eslint-disable no-unused-vars */

import { useLocale } from "next-intl";
import React from "react";

interface SubCategoriesItemProps {
  category: any;
  selectedSubCategoryId: string | undefined;
  onClick: (category: string) => void;
}

function SubCategories({ category, selectedSubCategoryId, onClick }: SubCategoriesItemProps) {
  const locale = useLocale();
  const isSelected = selectedSubCategoryId == category.id;

  return (
    <button
      onClick={() => onClick(category.id)}
      className={`cursor-pointer h-10 md:h-16  ${isSelected ? "bg-primary-color text-white" : "bg-gray-200 dark:bg-gray-800"}`}
    >
      <h3 className="text-xs md:text-sm">{category.names[locale]}</h3>
    </button>
  );
}

export { SubCategories };
