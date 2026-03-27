/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Edit, Eye, EyeOff, GripVertical, LoaderCircle, Plus, ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { toggleMenuItemVisibility, updateMenuItem } from "@/_services";
import { mapMenu } from "@/lib";
import { showActionToast } from "@/lib/utils";

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
      await queryClient.invalidateQueries(["menuItems"]);
      await queryClient.invalidateQueries("menu-items-details");
    },
  });

  const toggleVisibilityMutation = useMutation(toggleMenuItemVisibility, {
    onSuccess: async () => {
      await queryClient.invalidateQueries(["menuItems"]);
      await queryClient.invalidateQueries("menu-items-details");
      showActionToast({
        type: 'success',
        action: 'update',
        itemName: orderedMenuItems.find((item: any) => item.id === toggleLoadingId)?.names[locale],
        locale,
      });
      setToggleLoadingId(null);
    },
    onError: (error: Error) => {
      showActionToast({
        type: 'error',
        action: 'update',
        itemName: orderedMenuItems.find((item: any) => item.id === toggleLoadingId)?.names[locale],
        locale,
        error,
      });
      setToggleLoadingId(null);
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    if (updateMenuMutation.isLoading) return;

    const sorted = [...orderedMenuItems].sort((a: any, b: any) => a.order - b.order);
    const [moved] = sorted.splice(result.source.index, 1);

    sorted.splice(result.destination.index, 0, moved);

    // Reassign order values based on new positions
    const reordered = sorted.map((item: any, i: number) => ({ ...item, order: i }));

    setOrderedMenuItems(reordered);

    const menuObject = mapMenu(reordered);

    updateMenuMutation.mutate({ menuObject }, {
      onSuccess: () => {
        showActionToast({
          type: 'success',
          action: 'update',
          itemName: moved.names[locale],
          locale,
        });
      },
      onError: (error: unknown) => {
        showActionToast({
          type: 'error',
          action: 'update',
          itemName: moved.names[locale],
          locale,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      },
    });
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
        <p className="m-auto">{text("loading_menu_items")}</p>
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
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="menu-items" direction={viewMode === 'grid' ? 'horizontal' : 'vertical'}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={viewMode === 'grid' ?
                    "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4" :
                    "flex flex-col space-y-3"
                  }
                >
                  {items
                    ?.sort((a: any, b: any) => a.order - b.order)
                    .map((menu: any, index: any) => (
                      <Draggable key={menu.id} draggableId={menu.id} index={index}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            onClick={() => onPointerDown(menu.id)}
                            className={`
                              group relative cursor-pointer p-4 rounded-xl border transition-all duration-300
                              ${menu.hidden ? "opacity-60" : "opacity-100"}
                              ${snapshot.isDragging
                                ? "shadow-xl border-blue-400 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400/30"
                                : selectedMenuId === menu.id
                                  ? "bg-blue-50 border-blue-200 shadow-md shadow-blue-500/10 dark:bg-blue-900/20 dark:border-blue-700"
                                  : "bg-white border-gray-200 hover:shadow-md hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600"
                              }
                              ${viewMode === 'list' ? 'flex items-center justify-between' : ''}
                            `}
                          >
                            {/* Drag Handle */}
                            <div
                              {...dragProvided.dragHandleProps}
                              className={`flex-shrink-0 ${viewMode === 'list' ? 'mr-3' : 'absolute top-3 left-3'} p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Header */}
                            <div className={`flex items-start justify-between ${viewMode === 'list' ? 'flex-1 mr-4' : `mb-3 ${viewMode === 'grid' ? 'ml-6' : ''}`}`}>
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
                              {updateMenuMutation.isLoading && selectedMenuId === menu.id && (
                                <LoaderCircle className="w-4 h-4 animate-spin text-blue-600" />
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                  <div className="h-10"></div>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}

export { MenuItem };
