import { Label } from "@radix-ui/react-label";
import { FolderTree, Loader2, Save, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { deleteCategory, updateCategory } from "@/_services";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { showActionToast } from "@/lib/utils";

type UpdateSubCategoryProps = {
  category: any;
  setCategory: any;
  categories: any;
  parentCategoryId: string | undefined;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
};

function UpdateSubCategory({
  category,
  setCategory,
  categories,
  parentCategoryId,
  setOpenDialog,
}: UpdateSubCategoryProps) {
  const text = useTranslations("Index");
  const queryClient = useQueryClient();
  const locale = useLocale();
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | undefined>(parentCategoryId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const updateCategoryMutation = useMutation(updateCategory, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("categories");
      showActionToast({
        type: "success",
        action: "update",
        itemName: category.names[locale],
        locale,
      });
    },
    onError: (error: Error) => {
      showActionToast({
        type: "error",
        action: "update",
        itemName: category.names[locale],
        locale,
        error,
      });
    },
  });

  const deleteCategoryMutation = useMutation(deleteCategory, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("categories");
      showActionToast({
        type: "success",
        action: "delete",
        itemName: category.names[locale],
        locale,
      });
      setOpenDialog(false);
    },
    onError: (error: Error) => {
      showActionToast({
        type: "error",
        action: "delete",
        itemName: category.names[locale],
        locale,
        error,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const selectedSubCatLength = categories.filter((category: any) => category.id === selectedParentCategory)[0];

      const newCategoryObject = {
        [category.id]: {
          names: category.names,
          parentCategoryId: selectedParentCategory,
          order: selectedSubCatLength ? selectedSubCatLength.subCategories.length : category.order,
        },
      };

      await updateCategoryMutation.mutateAsync({
        categoryObject: newCategoryObject,
      });

      setOpenDialog(false);
    } catch (error) {
      console.error("error updating category:", error);
    }
  };

  const handleDeleteCategory = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (category.id) {
        await deleteCategoryMutation.mutateAsync({ categoryId: category.id });
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FolderTree className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{category.names[locale]}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Edit category details and parent relationship</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="dark:bg-gray-900 flex-1 overflow-y-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Language Names Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Category Names</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(category.names).map(([key, value]) => (
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
                    placeholder={`Enter ${key} name`}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) =>
                      setCategory((prev: any) => ({
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

          {/* Parent Category Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Parent Category</h3>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select parent category</Label>
              <Select
                value={selectedParentCategory || "NO_CATEGORY"}
                onValueChange={(value) => setSelectedParentCategory(value === "NO_CATEGORY" ? undefined : value)}
              >
                <SelectTrigger className="w-full transition-all duration-200 focus:ring-2 focus:ring-green-500">
                  <SelectValue placeholder="Choose a parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_CATEGORY">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>NO CATEGORY</span>
                    </div>
                  </SelectItem>
                  {categories
                    .filter((cat: any) => cat.id !== category.id)
                    .map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span>{cat.names[locale]}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between space-x-4">
          <Button
            type="button"
            onClick={handleDeleteCategory}
            variant="outline"
            size="lg"
            disabled={deleteCategoryMutation.isLoading}
            className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
          >
            {deleteCategoryMutation.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{deleteCategoryMutation.isLoading ? "Deleting..." : text("delete")}</span>
          </Button>

          <Button
            type="submit"
            size="lg"
            disabled={updateCategoryMutation.isLoading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          >
            {updateCategoryMutation.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{updateCategoryMutation.isLoading ? "Updating..." : text("update")}</span>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
              <p className="text-gray-600 dark:text-gray-300 ml-13">{text("delete_category_warning")}</p>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancelDelete} className="min-w-[80px]">
                  {text("cancel") || "Cancel"}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteCategoryMutation.isLoading}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
                >
                  {deleteCategoryMutation.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>{deleteCategoryMutation.isLoading ? `${text("delete")}...` : text("delete")}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { UpdateSubCategory };
