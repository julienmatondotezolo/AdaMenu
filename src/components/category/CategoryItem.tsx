/* eslint-disable indent */
/* eslint-disable no-unused-vars */
import { ChevronRight, Eye, EyeOff, GripVertical, LoaderCircle } from "lucide-react";
import { useLocale } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { toggleCategoryVisibility, updateCategory } from "@/_services/ada/adaMenuService";
import { mapCategories } from "@/lib";

interface CategoryItemProps {
  categories: any;
  categoryId: string | undefined;
  onClick: (category: any) => void;
}

export default function CategoryItem({ categories, categoryId, onClick }: CategoryItemProps) {
  const queryClient = useQueryClient();
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);
  const locale = useLocale();
  const [orderedCategories, setOrderedCategories] = useState<any[]>([]);
  const [draggedItem, setDraggedItem] = useState<any>(null);

  useEffect(() => {
    if (categories) {
      const sorted = [...categories].sort((a: any, b: any) => a.order - b.order);

      setOrderedCategories(sorted);
    }
  }, [categories]);

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

  const handleDragStart = (e: React.DragEvent, category: any, index: number) => {
    setDraggedItem(category);
    e.dataTransfer.effectAllowed = "move";
    // Add some styling to the dragged element
    if (e.target instanceof HTMLElement) {
      e.target.classList.add("opacity-50");
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
    // Remove the styling
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove("opacity-50");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetCategory: any, targetIndex: number) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.id === targetCategory.id) return;

    const items = [...orderedCategories];
    const draggedIndex = items.findIndex((item) => item.id === draggedItem.id);

    // Remove the dragged item from its original position
    items.splice(draggedIndex, 1);
    // Insert it at the new position
    items.splice(targetIndex, 0, draggedItem);

    // Update the order property of each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setOrderedCategories(updatedItems);

    const newCategoryObject = mapCategories(updatedItems);

    updateCategoryMutation.mutate({
      categoryObject: newCategoryObject,
    });
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

  if (!orderedCategories || orderedCategories.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-full border-r border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <nav className="space-y-1">
          {orderedCategories.map((category: any, index: number) => (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart(e, category, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category, index)}
              className={`
                relative transition-all duration-200
                ${draggedItem?.id === category.id ? "opacity-50" : ""}
              `}
            >
              <button
                onClick={() => onClick(category)}
                className={`
                  group relative w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${category.hidden ? "opacity-60" : "opacity-100"}
                  ${
                    category.id === categoryId
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  }
                `}
              >
                {/* Drag Handle */}
                <div
                  className={`
                    flex-shrink-0 mr-3 w-5 h-5 flex items-center justify-center
                    ${
                      category.id === categoryId
                        ? "text-blue-200"
                        : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                    }
                    cursor-grab active:cursor-grabbing
                  `}
                >
                  <GripVertical className="w-4 h-4" />
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
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
