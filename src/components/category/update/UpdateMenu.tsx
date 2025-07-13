import { Label } from "@radix-ui/react-label";
import { Edit, Loader2, Save, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { deleteMenu, fetchMenuById, updateMenuItem } from "@/_services";

import { Button, Checkbox, Input, Switch } from "../../ui";

type UpdateMenuProps = {
  selectedMenuId: string | undefined;
  allergens: any;
  sidedish: any;
  supplement: any;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
};

function UpdateMenu({ selectedMenuId, allergens, sidedish, supplement, setOpenDialog }: UpdateMenuProps) {
  const text = useTranslations("Index");
  const locale = useLocale();
  const [menuState, setMenuState] = useState<any>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const { mutate: fetchMenuItems, isLoading } = useMutation("menu-items-details", fetchMenuById, {
    onSuccess(data) {
      if (data) setMenuState(data);
    },
  });

  const updateMenuMutation = useMutation(updateMenuItem, {
    onSuccess: async () => {
      // Invalidate and refetch both queries
      await queryClient.invalidateQueries(["menuItems"]);
      await queryClient.invalidateQueries("menu-items-details");
    },
  });

  const deleteMenuMutation = useMutation(deleteMenu, {
    onSuccess: async () => {
      await queryClient.invalidateQueries(["menuItems"]);
      await queryClient.invalidateQueries("menu-items-details");
      setShowDeleteConfirm(false);
      setOpenDialog(false);
    },
  });

  // Refetch when selectedMenuId changes
  useEffect(() => {
    if (selectedMenuId) fetchMenuItems({ menuId: selectedMenuId });
  }, [fetchMenuItems, selectedMenuId]);

  const handleCheckboxChange = (type: "allergens" | "supplements" | "sideDishes", id: string) => {
    setMenuState((prev: any) => {
      const currentItems = prev[type] || [];
      const itemExists = currentItems.some((item: any) => item.id === id);

      // If item exists, remove it; if it doesn't exist, add it
      const updatedItems = itemExists ? currentItems.filter((item: any) => item.id !== id) : [...currentItems, { id }];

      return {
        ...prev,
        [type]: updatedItems,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMenuId) return;

    // Validate descriptions: if any description is filled, all must be filled
    const descriptions = Object.values(menuState.descriptions || {}) as string[];
    const hasAnyDescription = descriptions.some((desc) => desc && desc.trim() !== "");
    const hasAllDescriptions = descriptions.every((desc) => desc && desc.trim() !== "");

    if (hasAnyDescription && !hasAllDescriptions) {
      alert(text("description_validation_error"));
      return;
    }

    try {
      const menuObject = {
        [selectedMenuId]: {
          names: menuState.names,
          descriptions: menuState.descriptions,
          categoryId: menuState.category.id,
          allergenIds: menuState.allergens.map((a: any) => a.id),
          sideDishIds: menuState.sideDishes.map((s: any) => s.id),
          supplementIds: menuState.supplements.map((s: any) => s.id),
          price: menuState.price,
          order: menuState.order,
          hidden: menuState.hidden,
        },
      };

      await updateMenuMutation.mutateAsync({
        menuObject,
      });

      setOpenDialog(false);
    } catch (error) {
      console.error("error updating menu:", error);
    }
  };

  const handleDeleteMenu = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    try {
      if (selectedMenuId) {
        deleteMenuMutation.mutate({ menuId: selectedMenuId });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`An error has occurred: ${error.message}`);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading menu details...</p>
        </div>
      </div>
    );

  if (menuState)
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          {/* Fixed Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Update Menu Item</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Modify the menu item details and options</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 max-h-[calc(100vh-280px)]">
            {/* Names Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Menu Item Names</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(menuState.names).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label
                      htmlFor={`name-${key}`}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                    >
                      {key}
                    </Label>
                    <Input
                      id={`name-${key}`}
                      value={value as string}
                      placeholder={`Name in ${key}`}
                      required
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                      onChange={(e) =>
                        setMenuState((prev: any) => ({
                          ...prev,
                          names: {
                            ...prev.names,
                            [key]: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Descriptions Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Descriptions</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">(optional)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(menuState.descriptions).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label
                      htmlFor={`desc-${key}`}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                    >
                      {key}
                    </Label>
                    <Input
                      id={`desc-${key}`}
                      value={value as string}
                      placeholder={`Description in ${key}`}
                      className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl"
                      onChange={(e) =>
                        setMenuState((prev: any) => ({
                          ...prev,
                          descriptions: {
                            ...prev.descriptions,
                            [key]: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Price and Visibility Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pricing & Visibility</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Price (EUR)
                  </Label>
                  <Input
                    id="price"
                    value={menuState.price}
                    placeholder="0.00"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);

                      if (value >= 0 || e.target.value === "") {
                        setMenuState((prev: any) => ({
                          ...prev,
                          price: e.target.value,
                        }));
                      }
                    }}
                    type="number"
                    min="0"
                    step="0.01"
                    className="transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</Label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {menuState.hidden ? "Hidden" : "Visible"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {menuState.hidden ? "Item won't appear in menu" : "Item will be visible to customers"}
                      </span>
                    </div>
                    <Switch
                      checked={menuState.hidden}
                      onCheckedChange={(bool) =>
                        setMenuState((prev: any) => ({
                          ...prev,
                          hidden: bool,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Supplements Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Supplements</h3>
                <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full">
                  {menuState.supplements?.length || 0} selected
                </span>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {supplement.map((item: any, index: any) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-2 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-xl transition-colors duration-200"
                    >
                      <Checkbox
                        id={`supplement-${item.id}`}
                        checked={menuState.supplements.some((s: any) => s.id === item.id)}
                        onCheckedChange={() => handleCheckboxChange("supplements", item.id)}
                        className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Label
                        htmlFor={`supplement-${item.id}`}
                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        {item.names[locale]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side Dishes Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Side Dishes</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-full">
                  {menuState.sideDishes?.length || 0} selected
                </span>
              </div>
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {sidedish.map((item: any, index: any) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded-xl transition-colors duration-200"
                    >
                      <Checkbox
                        id={`sidedish-${item.id}`}
                        checked={menuState.sideDishes.some((s: any) => s.id === item.id)}
                        onCheckedChange={() => handleCheckboxChange("sideDishes", item.id)}
                        className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                      />
                      <Label
                        htmlFor={`sidedish-${item.id}`}
                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        {item.names[locale]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Allergens Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Allergens</h3>
                <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">
                  Important for dietary restrictions
                </span>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {allergens.map((item: any, index: any) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
                    >
                      <Checkbox
                        id={`allergen-${item.id}`}
                        checked={menuState.allergens.some((a: any) => a.id === item.id)}
                        onCheckedChange={() => handleCheckboxChange("allergens", item.id)}
                        className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      />
                      <Label
                        htmlFor={`allergen-${item.id}`}
                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        {item.names[locale]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer with Action Buttons */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-xl">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                onClick={handleDeleteMenu}
                disabled={deleteMenuMutation.isLoading}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 rounded-xl"
              >
                {deleteMenuMutation.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{deleteMenuMutation.isLoading ? "Deleting..." : text("delete")}</span>
              </Button>
              <Button
                type="submit"
                disabled={updateMenuMutation.isLoading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                {updateMenuMutation.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{updateMenuMutation.isLoading ? "Updating..." : text("update")}</span>
              </Button>
            </div>
          </div>
        </form>

        {/* Modern Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-200 scale-100">
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {text("confirm_delete") || "Confirm Delete"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{text("action_cannot_be_undone")}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 ml-13">
                  {text("delete_warning") ||
                    "Are you sure you want to delete this menu item? This will permanently remove it from your menu."}
                </p>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancelDelete} className="min-w-[80px]">
                    {text("cancel") || "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleConfirmDelete}
                    disabled={deleteMenuMutation.isLoading}
                    className="flex items-center space-x-2 min-w-[120px]"
                  >
                    {deleteMenuMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>{deleteMenuMutation.isLoading ? "Deleting..." : "Delete"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}

export { UpdateMenu };
