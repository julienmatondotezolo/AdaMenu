/* eslint-disable indent */
/* eslint-disable no-unused-vars */
import { ChevronRight, Eye, EyeOff, Grid, LoaderCircle, MoveDown, MoveUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { toggleCategoryVisibility, updateCategory } from "@/_services/ada/adaMenuService";
import { mapCategories } from "@/lib";

interface CategoryItemProps {
  categories: any;
  categoryId: string | undefined;
  onClick: (category: any) => void;
}

const CategoryItem = ({ categories, categoryId, onClick }: CategoryItemProps) => {
  const queryClient = useQueryClient();
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  const updateCategoryMutation = useMutation(updateCategory, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("categories");
    },
  });

  const toggleVisibilityMutation = useMutation(toggleCategoryVisibility, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("categories");
      setToggleLoadingId(null);
    },
    onError: (error) => {
      console.error("Failed to toggle visibility:", error);
      alert("Failed to update category visibility. Please try again.");
      setToggleLoadingId(null);
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

  const handleToggleVisibility = (category: any, event: React.MouseEvent) => {
    event.stopPropagation();

    if (toggleLoadingId === category.id) {
      return;
    }

    setToggleLoadingId(category.id);

    toggleVisibilityMutation.mutate({
      categoryId: category.id,
      hidden: !category.hidden,
    });
  };

  return (
    <div className="w-full h-full border-r border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <nav className="space-y-1">
          {orderedCategories
            ?.sort((a: any, b: any) => a.order - b.order)
            .map((category: any, index: number) => (
              <div key={category.id} className="relative">
                <button
                  onClick={() => onClick(category)}
                  className={`
                    group relative w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${category.hidden ? "opacity-60" : "opacity-100"}
                    ${
                      category.id === categoryId
                        ? "bg-blue-600 text-white shadow-md cursor-grab active:cursor-grabbing"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white cursor-grab active:cursor-grabbing"
                    }
                  `}
                >
                  {/* Icon */}
                  <div
                    className={`
                    flex-shrink-0 mr-3 w-5 h-5 flex items-center justify-center
                    ${category.id === categoryId ? "text-blue-200" : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"}
                  `}
                  >
                    <Grid className="w-4 h-4" />
                  </div>

                  {/* Category Name */}
                  <span className="flex-1 text-left truncate">{category.names[locale]}</span>

                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => handleToggleVisibility(category, e)}
                    className={`p-1.5 rounded-lg transition-colors duration-200 ${
                      category.hidden
                        ? "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    }`}
                    title={category.hidden ? "Show category" : "Hide category"}
                    disabled={toggleLoadingId === category.id}
                  >
                    {toggleLoadingId === category.id ? (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    ) : category.hidden ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                  {/* Arrow */}
                  {category.id === categoryId && <ChevronRight className="w-4 h-4 text-blue-200 ml-2" />}

                  {/* Active indicator */}
                  {category.id === categoryId && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 rounded-r-full" />
                  )}
                </button>

                {/* Order Controls - Only show for selected category */}
                {category.id === categoryId && (
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center space-y-1 mr-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveCategory(index, "up");
                      }}
                      disabled={index === 0}
                      className="p-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Move category up"
                    >
                      <MoveUp className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveCategory(index, "down");
                      }}
                      disabled={index === orderedCategories.length - 1}
                      className="p-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Move category down"
                    >
                      <MoveDown className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
              </div>
            ))}
        </nav>
      </div>
    </div>
  );
};

export { CategoryItem };
