/* eslint-disable no-unused-vars */
import { Eye, EyeOff, LoaderCircle, MoveDown, MoveUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { toggleMenuItemVisibility, updateMenuItem } from "@/_services";
import { mapMenu } from "@/lib";

import { Button } from "../ui";

interface menuProps {
  items: any;
  selectedMenuId: string | undefined;
  onClick: (dialogMode: "addCat" | "addSubCat" | "addMenu" | "editMenu" | "editCat") => void;
  onPointerDown: (menuId: string) => void;
}

function MenuItem({ items, selectedMenuId, onClick, onPointerDown }: menuProps) {
  const text = useTranslations("Index");
  const locale = useLocale();
  const [orderedMenuItems, setOrderedMenuItems] = useState<any[]>([]);
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
    },
    onError: (error) => {
      console.error("Failed to toggle visibility:", error);
      alert("Failed to update menu item visibility. Please try again.");
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

    if (toggleVisibilityMutation.isLoading) {
      return;
    }

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
    <div className="w-full h-full">
      <article className="w-full flex flex-wrap items-center justify-between">
        <h3 className="text-lg font-semibold">Menu ({items.length})</h3>
        <section className="space-x-4">
          {selectedMenuId && (
            <Button onClick={() => onClick("editMenu")} variant={"outline"}>
              {text("edit")} menu
            </Button>
          )}
          <Button onClick={() => onClick("addMenu")}>{text("add")} menu + </Button>
        </section>
      </article>

      <div className="text-sm mt-8 h-full">
        <section className="grid grid-cols-[25px_3fr_1fr_2fr] font-semibold py-2 border-b mb-4 dark:border-gray-800">
          <p>Nr.</p>
          <p>Name</p>
          <p>Price</p>
          <p>{`Visible (${visibleCount})`}</p>
        </section>
        <div className="h-full overflow-y-scroll pb-60">
          <div className="w-full">
            {items
              ?.sort((a: any, b: any) => a.order - b.order)
              .map((menu: any, index: any) => {
                const bgColor =
                  selectedMenuId === menu.id
                    ? "bg-primary-color text-white"
                    : index % 2 === 1
                      ? "bg-gray-100 dark:bg-gray-800/60"
                      : "bg-gray-200 dark:bg-gray-800";

                return (
                  <section
                    onPointerDown={() => onPointerDown(menu.id)}
                    className={`relative cursor-pointer grid grid-cols-[20px_3fr_1fr_2fr] py-2 mt-2 px-2 ${bgColor} ${menu.hidden === true && selectedMenuId !== menu.id && "opacity-40"} hover:bg-primary-color/50`}
                    key={menu.id}
                  >
                    <p>{index + 1}.</p>
                    <div className="flex flex-col">
                      <p className="font-medium">{menu.names[locale]}</p>
                      <p
                        className={`text-xs mt-1 ${
                          menu.descriptions && menu.descriptions[locale]
                            ? "text-gray-600 dark:text-gray-400"
                            : "text-orange-500 dark:text-orange-400"
                        }`}
                      >
                        {menu.descriptions && menu.descriptions[locale]
                          ? menu.descriptions[locale]
                          : text("no_description")}
                      </p>
                    </div>
                    <p>{menu.price} EUR</p>
                    <div
                      className={`${selectedMenuId === menu.id && menu.hidden === false ? "flex" : "hidden"} absolute top-0 right-2 space-x-4 h-full items-center`}
                    >
                      {updateMenuMutation.isLoading ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <>
                          <MoveUp onClick={() => moveCategory(index, "up")} className="ml-2 left-0" size={20} />
                          <MoveDown onClick={() => moveCategory(index, "down")} className="right-0" size={20} />
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-start">
                      <button
                        className="flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 w-6 h-6 rounded transition-colors bg-transparent border-none"
                        onClick={(e) => handleToggleVisibility(menu, e)}
                        title={menu.hidden ? "Click to show" : "Click to hide"}
                        aria-label={menu.hidden ? "Show menu item" : "Hide menu item"}
                        disabled={toggleVisibilityMutation.isLoading}
                      >
                        {toggleVisibilityMutation.isLoading ? (
                          <LoaderCircle className="animate-spin" size={16} />
                        ) : menu.hidden ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </section>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { MenuItem };
