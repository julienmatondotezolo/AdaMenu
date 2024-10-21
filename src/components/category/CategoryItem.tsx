/* eslint-disable no-unused-vars */
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";

interface CategoryItemProps {
  categories: any;
  categoryId: string | undefined;
  onClick: (category: any) => void;
}

const CategoryItem = ({ categories, categoryId, onClick }: CategoryItemProps) => {
  const locale = useLocale();
  const indexPageText = useTranslations("Index");

  return (
    <div className="h-full border-t-2 dark:border-gray-800 overflow-x-scroll">
      <section className="flex flex-col w-fit text-neutral-800 dark:text-neutral-200">
        <button
          onClick={() => onClick("ALL")}
          className={`text-sm px-6 py-4 ${categoryId === "ALL" ? "text-white bg-primary border-primary box-content" : "border-b dark:border-gray-800"}`}
        >
          <p className="w-max">{indexPageText("all")}</p>
        </button>
        {categories.map((category: any, index: any) => (
          <button
            key={index}
            onClick={() => onClick(category)}
            className={`text-sm px-6 py-4 ${category.id == categoryId ? "text-white bg-primary font-semibold border-primary box-content" : "border-b dark:border-gray-800"}`}
          >
            <p className="w-max">{category.names[locale]}</p>
          </button>
        ))}
      </section>
    </div>
  );
};

export { CategoryItem };
