/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable no-unused-vars */

import { MoveLeft, MoveRight } from "lucide-react";
import { useLocale } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { updateCategory } from "@/_services";
import { mapCategories } from "@/lib/helpers";

interface SubCategoriesItemProps {
  categories: any;
  parentCategoryId: string | undefined;
  selectedSubCategoryId: string | undefined;
  onClick: (categoryId: string) => void;
}

function SubCategories({ categories, parentCategoryId, selectedSubCategoryId, onClick }: SubCategoriesItemProps) {
  const queryClient = useQueryClient();

  const updateCategoryMutation = useMutation(updateCategory, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("categories");
    },
  });

  const locale = useLocale();
  const [orderedCategories, setOrderedCategories] = useState<any>();

  useEffect(() => {
    const fetchedSubCat = categories.filter((category: any) => category.id === parentCategoryId)[0];

    if (fetchedSubCat) setOrderedCategories(fetchedSubCat.subCategories);
  }, [categories, parentCategoryId]);

  const moveCategory = (e: any, index: number, direction: "up" | "down") => {
    e.preventDefault();

    if (!orderedCategories) return;

    const newCategories: any = [...orderedCategories];

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newCategories.length) {
      // Swap the order of the categories
      const tempOrder = newCategories[index].order;

      newCategories[index].order = newCategories[targetIndex].order;
      newCategories[targetIndex].order = tempOrder;

      setOrderedCategories(newCategories);

      const newCategoryObject = mapCategories(newCategories, parentCategoryId);

      updateCategoryMutation.mutate({
        categoryObject: newCategoryObject,
      });
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-8">
      {orderedCategories
        ?.sort((a: any, b: any) => a.order - b.order)
        .map((subCategory: any, index: any) => (
          <button
            key={subCategory.id}
            onClick={() => onClick(subCategory)}
            className={`relative cursor-pointer h-10 md:h-16  ${subCategory.id == selectedSubCategoryId ? "bg-primary-color text-white" : "bg-gray-200 dark:bg-gray-800"}`}
          >
            <div
              className={`${subCategory.id == selectedSubCategoryId ? "flex" : "hidden"} absolute flex-col top-0 left-0 w-full h-full items-left justify-center`}
            >
              <MoveLeft onClick={(e) => moveCategory(e, index, "up")} className="ml-2" size={20} />
              <MoveRight onClick={(e) => moveCategory(e, index, "down")} className="ml-2" size={20} />
            </div>
            <h3 className="text-xs md:text-sm">{subCategory.names[locale]}</h3>
          </button>
        ))}
    </div>
  );
}

export { SubCategories };
