/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
import { Edit, Eye, EyeOff, LoaderCircle, MoveDown, MoveUp, Plus, ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { toggleMenuItemVisibility, updateMenuItem } from "@/_services";
import { mapMenu } from "@/lib";

import { Button, FloatingActionButton } from "../ui";

interface menuProps {
  items: any;
  selectedMenuId: string | undefined;
  onClick: (dialogMode: "addCat" | "addSubCat" | "addMenu" | "editMenu" | "editCat") => void;
  onPointerDown: (menuId: string) => void;
  viewMode?: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

function MenuItem({ items, selectedMenuId, onClick, onPointerDown, viewMode = 'grid', setViewMode }: menuProps) {
  const text = useTranslations("Index");
  const locale = useLocale();
  const [orderedMenuItems, setOrderedMenuItems] = useState<any[]>([]);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const visibleCount = Array.isArray(items) ? items.filter((item: any) => !item.hidden).length : 0;

  useEffect(() => {
    if (Array.isArray(items)) {
      setOrderedMenuItems(items);
    }
  }, [items]);

  const updateMenuMutation = useMutation(updateMenuItem, {
    onSuccess: async () => {
      // Invalidate and refetch both queries
      await queryClient.invalidateQueries(["menuItems"]);
      await queryClient.invalidateQueries("menu-items-details");
    },
  });

  const toggleVisibilityMutation = useMutation(toggleMenuItemVisibility, {
    onSuccess: async () => {
      // Invalidate and refetch both queries
      await queryClient.invalidateQueries(["menuItems"]);
      await queryClient.invalidateQueries("menu-items-details");
      setToggleLoadingId(null);
    },
    onError: (error) => {
      console.error("Failed to toggle visibility:", error);
      alert("Failed to update menu item visibility. Please try again.");
      setToggleLoadingId(null);
    },
  });

  const moveCategory = (index: number, direction: "up" | "down") => {
    if (updateMenuMutation.isLoading) {
      alert("Wait still loading...");
      return;
    }

    const newMenuItems = [...orderedMenuItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newMenuItems.length) {
      // Swap the order of the categories
      const tempOrder = newMenuItems[index].order;

      newMenuItems[index].order = newMenuItems[targetIndex].order;
      newMenuItems[targetIndex].order = tempOrder;

      setOrderedMenuItems(newMenuItems);

      const menuObject = mapMenu(newMenuItems);

      updateMenuMutation.mutate({
        menuObject,
      });
    }
  };

  const handleToggleVisibility = (menuItem: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering row selection

    if (toggleLoadingId === menuItem.id) {
      return;
    }

    setToggleLoadingId(menuItem.id);

    // Toggle visibility using the new API endpoint
    toggleVisibilityMutation.mutate({
      menuId: menuItem.id,
      hidden: !menuItem.hidden,
    });
  };

  if (!items) {
    return (
      <div className="flex h-full overflow-scroll pb-12">
        <p className="m-auto">Loading menus...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Menu Items ({items.length})</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {visibleCount} visible of {items.length} total
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FloatingActionButton
              onClick={() => onClick("addMenu")}
              label={text("add")}
              icon={<Plus className="w-4 h-4" />}
              size="sm"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 inline-flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              aria-label="Grid view"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors duration-200 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              aria-label="List view"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <div className="h-full overflow-y-auto space-y-3 pb-12">
          <div className={viewMode === 'grid' ? 
            "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4" : 
            "flex flex-col space-y-3"
          }>
            {items
              ?.sort((a: any, b: any) => a.order - b.order)
              .map((menu: any, index: any) => (
                <div
                  key={menu.id}
                  onClick={() => onPointerDown(menu.id)}
                  className={`
                    group relative cursor-pointer p-4 rounded-xl border transition-all duration-300
                    ${menu.hidden ? "opacity-60" : "opacity-100"}
                    ${
                selectedMenuId === menu.id
                  ? "bg-blue-50 border-blue-200 shadow-md shadow-blue-500/10 dark:bg-blue-900/20 dark:border-blue-700"
                  : "bg-white border-gray-200 hover:shadow-md hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600"
                }
                    ${viewMode === 'list' ? 'flex items-center justify-between' : ''}
                  `}
                >
                  {/* Header */}
                  <div className={`flex items-start justify-between ${viewMode === 'list' ? 'flex-1 mr-4' : 'mb-3'}`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          menu.hidden
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {menu.hidden ? "Hidden" : "Visible"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1">
                      {selectedMenuId === menu.id && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClick("editMenu");
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>{text("edit")}</span>
                        </Button>
                      )}
                      <button
                        onClick={(e) => handleToggleVisibility(menu, e)}
                        className={`p-1.5 rounded-lg transition-colors duration-200 ${
                          menu.hidden
                            ? "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : "text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        }`}
                        title={menu.hidden ? "Show item" : "Hide item"}
                        disabled={toggleLoadingId === menu.id}
                      >
                        {toggleLoadingId === menu.id ? (
                          <LoaderCircle className="w-4 h-4 animate-spin" />
                        ) : menu.hidden ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={viewMode === 'list' ? 'flex-1' : 'space-y-2'}>
                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">{menu.names[locale]}</h4>
                    {viewMode === 'grid' && (
                      <p
                        className={`text-sm line-clamp-2 ${
                          menu.descriptions && menu.descriptions[locale]
                            ? "text-gray-600 dark:text-gray-400"
                            : "text-orange-500 dark:text-orange-400 italic"
                        }`}
                      >
                        {menu.descriptions && menu.descriptions[locale]
                          ? menu.descriptions[locale]
                          : text("no_description")}
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className={`${viewMode === 'list' ? 'flex items-center ml-4' : 'flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700'}`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{menu.price} EUR</span>
                    </div>

                    {/* Order Controls - Only show for selected item */}
                    {selectedMenuId === menu.id && (
                      <div className="flex items-center space-x-1">
                        {updateMenuMutation.isLoading ? (
                          <LoaderCircle className="w-4 h-4 animate-spin text-blue-600" />
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveCategory(index, "up");
                              }}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Move up"
                            >
                              <MoveUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveCategory(index, "down");
                              }}
                              disabled={index === items.length - 1}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Move down"
                            >
                              <MoveDown className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            <div className="h-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { MenuItem };
