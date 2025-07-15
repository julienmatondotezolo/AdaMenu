/* eslint-disable indent */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable no-unused-vars */

import { Folder, FolderOpen, MoveLeft, MoveRight } from "lucide-react";
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
  const locale = useLocale();
  const [orderedCategories, setOrderedCategories] = useState<any>();
  const [expandedSubCategoryId, setExpandedSubCategoryId] = useState<string | null>(null);

  const updateCategoryMutation = useMutation(updateCategory, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("categories");
    },
  });

  useEffect(() => {
    const fetchedSubCat = categories.filter((category: any) => category.id === parentCategoryId)[0];

    if (fetchedSubCat) setOrderedCategories(fetchedSubCat.subCategories);
  }, [categories, parentCategoryId]);

  const moveCategory = (e: any, index: number, direction: "up" | "down") => {
    e.preventDefault();
    e.stopPropagation(); // Prevent the click from triggering the parent button's onClick

    if (!orderedCategories) return;

    const newCategories: any = [...orderedCategories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newCategories.length) {
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

  const handleSubCategoryClick = (subCategory: any) => {
    if (selectedSubCategoryId === subCategory.id) {
      // If clicking the same subcategory that's already selected
      if (expandedSubCategoryId === subCategory.id) {
        // If it's expanded, collapse it
        setExpandedSubCategoryId(null);
      } else {
        // If it's collapsed, expand it
        setExpandedSubCategoryId(subCategory.id);
      }
    } else {
      // If clicking a different subcategory
      onClick(subCategory);
      setExpandedSubCategoryId(subCategory.id);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full mt-8">
      {orderedCategories
        ?.sort((a: any, b: any) => a.order - b.order)
        .map((subCategory: any, index: any) => (
          <button
            key={subCategory.id}
            type="button"
            className={`
              group relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer w-full text-left
              ${
                subCategory.id === selectedSubCategoryId
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                  : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700"
              }
              ${expandedSubCategoryId === subCategory.id ? "h-auto" : "h-24"}
            `}
            onClick={() => handleSubCategoryClick(subCategory)}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-16 h-16 transform translate-x-6 -translate-y-6">
                <div className="w-full h-full bg-gradient-to-br from-transparent to-white/20 rounded-full"></div>
              </div>
            </div>

            {/* Content */}
            <div className="relative p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div
                  className={`
                  flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200
                  ${
                    subCategory.id === selectedSubCategoryId
                      ? "bg-white/20"
                      : "bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50"
                  }
                `}
                >
                  {expandedSubCategoryId === subCategory.id ? (
                    <FolderOpen className="w-4 h-4 text-white" />
                  ) : (
                    <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className={`
                    font-medium text-sm truncate transition-colors duration-200
                    ${
                      subCategory.id === selectedSubCategoryId
                        ? "text-white"
                        : "text-gray-900 dark:text-white group-hover:text-gray-800 dark:group-hover:text-gray-100"
                    }
                  `}
                  >
                    {subCategory.names[locale]}
                  </h3>
                  <p
                    className={`
                    text-xs mt-0.5 transition-colors duration-200
                    ${
                      subCategory.id === selectedSubCategoryId
                        ? "text-blue-100"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    }
                  `}
                  >
                    Category
                  </p>
                </div>
              </div>

              {/* Order Controls */}
              {subCategory.id === selectedSubCategoryId && (
                <div className="flex flex-col space-y-1 ml-2">
                  <button
                    onClick={(e) => moveCategory(e, index, "up")}
                    className="p-1 rounded hover:bg-white/20 transition-colors duration-200"
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <MoveLeft className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={(e) => moveCategory(e, index, "down")}
                    className="p-1 rounded hover:bg-white/20 transition-colors duration-200"
                    disabled={index === orderedCategories.length - 1}
                    aria-label="Move down"
                  >
                    <MoveRight className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Expanded Content */}
            {expandedSubCategoryId === subCategory.id && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  {subCategory.menuItems?.map((menuItem: any) => (
                    <div
                      key={menuItem.id}
                      className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <span className="text-sm font-medium">{menuItem.names[locale]}</span>
                      <span className="text-sm text-gray-500">€{menuItem.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selection Indicator */}
            {subCategory.id === selectedSubCategoryId && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
            )}

            {/* Hover Indicator */}
            <div
              className={`
              absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 transform transition-transform duration-200
              ${subCategory.id === selectedSubCategoryId ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}
            `}
            ></div>
          </button>
        ))}
    </div>
  );
}

export { SubCategories };
