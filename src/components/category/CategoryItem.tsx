/* eslint-disable no-unused-vars */
import { MoveDown, MoveUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { updateCategory } from "@/_services";
import { mapCategories } from "@/lib";

interface CategoryItemProps {
  categories: any;
  categoryId: string | undefined;
  onClick: (category: any) => void;
}

const CategoryItem = ({ categories, categoryId, onClick }: CategoryItemProps) => {
  const queryClient = useQueryClient();

  const updateCategoryMutation = useMutation(updateCategory, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("categories");
    },
  });

  const locale = useLocale();
  const [orderedCategories, setOrderedCategories] = useState<any>();

  useEffect(() => {
    setOrderedCategories(categories);
  }, [categories]);

  const moveCategory = (index: number, direction: "up" | "down") => {
    if (!orderedCategories) return;

    const newCategories = [...orderedCategories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newCategories.length) {
      // Swap the order of the categories
      const tempOrder = newCategories[index].order;

      newCategories[index].order = newCategories[targetIndex].order;
      newCategories[targetIndex].order = tempOrder;

      setOrderedCategories(newCategories);

      const newCategoryObject = mapCategories(newCategories);

      updateCategoryMutation.mutate({
        categoryObject: newCategoryObject,
      });
    }
  };

  return (
    <div className="w-full h-full border-t-2 dark:border-gray-800">
      <section className="flex flex-col w-fit text-neutral-800 dark:text-neutral-200">
        {orderedCategories
          ?.sort((a: any, b: any) => a.order - b.order)
          .map((category: any, index: number) => (
            <button
              key={category.id}
              onClick={() => onClick(category)}
              className={`relative text-sm px-6 py-4 ${category.id == categoryId ? "text-white bg-primary font-semibold border-primary box-content" : "border-b dark:border-gray-800"}`}
            >
              <div
                className={`${category.id == categoryId ? "flex" : "hidden"} absolute top-0 left-0 w-full h-full items-center`}
              >
                <MoveUp onClick={() => moveCategory(index, "up")} className="ml-2 left-0" size={20} />
                <MoveDown onClick={() => moveCategory(index, "down")} className="right-0" size={20} />
              </div>
              <p className="whitespace-nowrap overflow-hidden text-ellipsis w-[135px]">{category.names[locale]}</p>
              {/* <button
              onClick={() => moveCategory(index, "up")}
              disabled={index === 0} // Disable if it's the first category
            >
              Up
            </button>
            <button
              onClick={() => moveCategory(index, "down")}
              disabled={index === orderedCategories.length - 1} // Disable if it's the last category
            >
              Down
            </button> */}
            </button>
          ))}
      </section>
    </div>
  );
};

export { CategoryItem };
