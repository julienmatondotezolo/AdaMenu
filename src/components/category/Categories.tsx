import { Label } from "@radix-ui/react-label";
import { ChevronDown, ChevronUp, Edit, Loader2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import {
  deleteCategory,
  fetchAllergen,
  fetchCategories,
  fetchMenuItemByCategoryId,
  fetchSidedish,
  fetchSupplement,
  updateCategory,
} from "@/_services/ada/adaMenuService";

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Dialog,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "../ui";
import CategoryItem from "./CategoryItem";
import { CreateCategory, CreateMenu } from "./create";
import { MenuItem } from "./MenuItem";
import { SubCategories } from "./SubCategories";
import { UpdateMenu, UpdateSubCategory } from "./update";

function Categories() {
  const locale = useLocale();
  const text = useTranslations("Index");
  const [dialogMode, setDialogMode] = useState<"addCat" | "addSubCat" | "addMenu" | "editMenu" | "editCat">("addCat");
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [categoryId, setCategoryId] = useState<string>();
  const [category, setCategory] = useState<any>();
  const [subCategoryId, setSubCategoryId] = useState<string>();
  const [subCategory, setSubCategory] = useState<any>();
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | undefined>();
  const [selectedMenuId, setSelectedMenuId] = useState<string>();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isCategoryDetailsExpanded, setIsCategoryDetailsExpanded] = useState(false);
  const [isSubcategoriesExpanded, setIsSubcategoriesExpanded] = useState(true);
  const [menuViewMode, setMenuViewMode] = useState<"grid" | "list">("grid");

  const queryClient = useQueryClient();
  const fetchAllCategories = () => fetchCategories();
  const fetchAllAllergen = () => fetchAllergen();

  // Define the mutation for fetching menu items
  // const { mutate: fetchMenuItems, data: menuItems } = useMutation("menuItems", fetchMenuItemByCategoryId, {
  //   onSuccess: () => {
  //     // Store the current subCategory for reference
  //     queryClient.setQueryData("currentSubCategory", subCategoryId);
  //   },
  // });

  // Define the query for fetching menu items based on the selected subCategoryId
  const { data: menuItems } = useQuery(
    ["menuItems", subCategoryId],
    () => fetchMenuItemByCategoryId({ categoryId: subCategoryId! }),
    {
      enabled: !!subCategoryId, // Only run the query if subCategoryId is defined
      refetchOnWindowFocus: false,
    },
  );

  const { isLoading, data: categories } = useQuery("categories", fetchAllCategories, {
    refetchOnWindowFocus: false,
    select: (data) => data.sort((a: any, b: any) => a.order - b.order),
  });

  const { data: allergens } = useQuery("allergens", fetchAllAllergen, {
    refetchOnWindowFocus: false,
  });

  const { data: sidedish } = useQuery("sidedish", fetchSidedish, {
    refetchOnWindowFocus: false,
  });

  const { data: supplement } = useQuery("supplement", fetchSupplement, {
    refetchOnWindowFocus: false,
  });

  // Auto-select the first category when categories are loaded
  useEffect(() => {
    if (categories && categories.length > 0 && !categoryId) {
      openCategoryDetails(categories[0]);
    }
  }, [categories, categoryId]);

  const updateCategoryMutation = useMutation(updateCategory, {
    onSuccess: async (responseUpdateCategory) => {
      await queryClient.invalidateQueries("categories");
      if (responseUpdateCategory) {
        setCategory(responseUpdateCategory);
        setCategoryId(responseUpdateCategory.id);
      }
    },
  });

  const deleteCategoryMutation = useMutation(deleteCategory, {
    onSuccess: async () => {
      setCategory("");
      setCategoryId("");
      // Reset the selected parent category
      setSelectedParentCategory("");
      // queryClient.setQueryData(["menuItems"], null);
      setSubCategoryId("");
      setSelectedMenuId("");

      await queryClient.invalidateQueries("categories");
    },
  });

  const openCategoryDetails = (category: any) => {
    if (category === "ALL") {
      setCategoryId("ALL");
      setCategory("");
      // Reset the selected parent category
      setSelectedParentCategory("");
      // Reset edit mode when switching categories
      setIsEditMode(false);
      return;
    }

    setCategory(category);
    setCategoryId(category.id);
    // Reset the selected parent category
    setSelectedParentCategory("");
    // queryClient.setQueryData(["menuItems"], null);
    setSubCategoryId("");
    setSelectedMenuId("");
    // Reset edit mode when switching categories
    setIsEditMode(false);
  };

  const handleSelectCategory = (subCategory: any) => {
    setSubCategoryId(subCategory.id);
    setSubCategory(subCategory);
    setSelectedMenuId("");
    // fetchMenuItems({ categoryId: subCategory.id });
  };

  const handleUpdateCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const selectedSubCatLength = categories.filter((category: any) => category.id === selectedParentCategory)[0];

    const newCategoryObject = {
      [category.id]: {
        names: category.names,
        parentCategoryId: selectedParentCategory,
        order: selectedSubCatLength ? selectedSubCatLength.subCategories.length : category.order,
      },
    };

    updateCategoryMutation.mutate({
      categoryObject: newCategoryObject,
    });

    // Exit edit mode after successful update
    setIsEditMode(false);
  };

  const openUpdateSubCategory = () => {
    setDialogMode("editCat");
    setOpenDialog(true);
  };

  const handleDeleteCategory = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (categoryId) {
        await deleteCategoryMutation.mutateAsync({ categoryId });
        setShowDeleteConfirm(false);
      }
      // Exit edit mode after successful delete
      setIsEditMode(false);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`An error has occurred: ${error.message}`);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setIsCategoryDetailsExpanded(false);
    // Reset the category data to original state if needed
    // You might want to refetch the category data here
  };

  const handleSelectMenu = (menuId: string) => {
    queryClient.invalidateQueries("menu-items-details");
    setSelectedMenuId(menuId);
  };

  if (isLoading)
    return (
      <div className="flex h-full overflow-scroll pb-12">
        <p className="m-auto">Loading categories</p>
      </div>
    );

  return (
    <>
      <div className="flex w-full h-full">
        {/* Left sidebar with fixed header and scrollable categories */}
        <div className="h-full w-1/4 flex flex-col border-r-2 dark:border-gray-800">
          {/* Fixed header */}
          <div className="flex-none p-4 border-b dark:border-gray-800 space-y-4">
            <Button
              onClick={() => {
                setDialogMode("addCat");
                setOpenDialog(true);
              }}
              className="w-full"
            >
              {!subCategoryId ? `+ ${text("add")} category` : `+ ${text("add")}`}
            </Button>
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Categories
            </h2>
          </div>
          {/* Scrollable categories */}
          <div className="flex-1 overflow-y-auto">
            {categories && (
              <CategoryItem
                categories={categories}
                categoryId={categoryId}
                onClick={(category) => openCategoryDetails(category)}
              />
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 h-full flex flex-col">
          {category && category.names && (
            <>
              {/* Collapsible category details */}
              <div className="flex-none">
                <div className="border-b dark:border-gray-800">
                  {/* Collapsible header */}
                  <button
                    className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => setIsCategoryDetailsExpanded(!isCategoryDetailsExpanded)}
                    aria-expanded={isCategoryDetailsExpanded}
                    aria-controls="category-details-content"
                  >
                    <div className="flex items-center space-x-6">
                      <h2 className="text-xl font-semibold">{category.names[locale]}</h2>
                      {!isEditMode && (
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick();
                            if (!isCategoryDetailsExpanded) {
                              setIsCategoryDetailsExpanded(true);
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Edit className="w-4 h-4" />
                          <span>{text("edit")}</span>
                        </Button>
                      )}
                    </div>
                    {isCategoryDetailsExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {/* Collapsible content */}
                  <div id="category-details-content" role="region" aria-labelledby="category-details-header">
                    {isCategoryDetailsExpanded && (
                      <Card className="rounded-none border-0">
                        <form onSubmit={handleUpdateCategory}>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 w-full items-center gap-4 mb-4">
                              {Object.entries(category.names).map(([key, value]) => (
                                <div key={key} className="flex flex-col space-y-1.5">
                                  <Label htmlFor="name">{key}</Label>
                                  <Input
                                    id="name"
                                    value={String(value)}
                                    placeholder={String(value)}
                                    required
                                    disabled={!isEditMode}
                                    onChange={(e) =>
                                      setCategory((prev: any) => ({
                                        ...prev,
                                        names: {
                                          ...prev.names,
                                          [key]: e.target.value,
                                        },
                                      }))
                                    }
                                    className={!isEditMode ? "cursor-not-allowed opacity-75" : ""}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="w-full space-y-1.5">
                              <Label htmlFor="name">Select a parent category</Label>
                              <Select
                                value={selectedParentCategory}
                                onValueChange={setSelectedParentCategory}
                                disabled={!isEditMode}
                              >
                                <SelectTrigger
                                  className={`w-full ${!isEditMode ? "cursor-not-allowed opacity-75" : ""}`}
                                >
                                  <SelectValue placeholder="Select a parent category" />
                                </SelectTrigger>
                                <SelectContent className="w-full bg-white dark:bg-background">
                                  <SelectGroup>
                                    <SelectItem value="NO_CATEGORY">NO CATEGORY</SelectItem>
                                    {categories.map(
                                      (category: any, index: any) =>
                                        // Check if category.id is not equal to categoryId before rendering
                                        category.id !== categoryId && (
                                          <SelectItem key={index} value={category.id}>
                                            {category.names[locale]}
                                          </SelectItem>
                                        ),
                                    )}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-full space-y-1.5 mt-4">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</Label>
                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {category.hidden ? "Hidden" : "Visible"}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {category.hidden
                                      ? "Category won't appear in menu"
                                      : "Category will be visible to customers"}
                                  </span>
                                </div>
                                <Switch
                                  checked={!category.hidden}
                                  onCheckedChange={(checked) =>
                                    setCategory((prev: any) => ({
                                      ...prev,
                                      hidden: !checked,
                                    }))
                                  }
                                  disabled={!isEditMode}
                                  className={!isEditMode ? "cursor-not-allowed opacity-75" : ""}
                                />
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            {isEditMode && (
                              <>
                                <div className="flex space-x-3">
                                  <Button
                                    type="button"
                                    onClick={handleDeleteCategory}
                                    variant="delete"
                                    disabled={deleteCategoryMutation.isLoading}
                                  >
                                    {deleteCategoryMutation.isLoading ? `Loading...` : `${text("delete")}`}
                                  </Button>
                                  <Button type="button" onClick={handleCancelEdit} variant="outline">
                                    {text("cancel")}
                                  </Button>
                                </div>
                                <Button type="submit" disabled={updateCategoryMutation.isLoading}>
                                  {updateCategoryMutation.isLoading ? `Loading...` : `${text("update")}`}
                                </Button>
                              </>
                            )}
                          </CardFooter>
                        </form>
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                <section className="sticky top-0 bg-white dark:bg-[#121212] border-b dark:border-gray-800 z-10">
                  <button
                    className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => setIsSubcategoriesExpanded(!isSubcategoriesExpanded)}
                    aria-expanded={isSubcategoriesExpanded}
                    aria-controls="subcategories-content"
                  >
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-lg font-semibold">Sub categories ({category?.subCategories.length})</h3>
                      <div className="flex items-center space-x-6">
                        {isSubcategoriesExpanded && (
                          <section className="space-x-6">
                            {subCategoryId && (
                              <Button
                                variant={"outline"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openUpdateSubCategory();
                                }}
                              >
                                {text("edit")} sub category
                              </Button>
                            )}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDialogMode("addSubCat");
                                setOpenDialog(true);
                              }}
                            >
                              + {text("add")} sub category
                            </Button>
                          </section>
                        )}
                        {isSubcategoriesExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Collapsible subcategories content */}
                  <div
                    id="subcategories-content"
                    role="region"
                    aria-labelledby="subcategories-header"
                    className={`transition-all duration-200 ${isSubcategoriesExpanded ? "block" : "hidden"}`}
                  >
                    {categoryId && (
                      <div className="p-4">
                        <SubCategories
                          categories={categories}
                          parentCategoryId={categoryId}
                          selectedSubCategoryId={subCategoryId}
                          onClick={(subCategory) => handleSelectCategory(subCategory)}
                        />
                      </div>
                    )}
                  </div>
                </section>

                {subCategoryId && (
                  <div className="p-5">
                    <MenuItem
                      items={menuItems}
                      selectedMenuId={selectedMenuId}
                      onClick={(dialogMode) => {
                        setDialogMode(dialogMode);
                        setOpenDialog(true);
                      }}
                      onPointerDown={(menuId) => handleSelectMenu(menuId)}
                      viewMode={menuViewMode}
                      setViewMode={setMenuViewMode}
                    />
                  </div>
                )}
              </div>
            </>
          )}
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{text("confirm_delete")}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{text("action_cannot_be_undone")}</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 ml-13">{text("delete_category_warning")}</p>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancelDelete} className="min-w-[80px]">
                  {text("cancel")}
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

      <Dialog open={openDialog} setIsOpen={setOpenDialog}>
        {(() => {
          switch (dialogMode) {
            case "editCat":
              return (
                <UpdateSubCategory
                  category={subCategory}
                  setCategory={setSubCategory}
                  categories={categories}
                  parentCategoryId={categoryId}
                  setOpenDialog={setOpenDialog}
                />
              );
            case "addSubCat":
              return (
                <CreateCategory categories={categories} parentCategoryId={categoryId} setOpenDialog={setOpenDialog} />
              );
            case "addMenu":
              return (
                <CreateMenu
                  subCategoryId={subCategoryId}
                  allergens={allergens}
                  sidedish={sidedish}
                  supplement={supplement}
                  items={menuItems}
                  setOpenDialog={setOpenDialog}
                />
              );
            case "editMenu":
              return (
                <UpdateMenu
                  selectedMenuId={selectedMenuId}
                  allergens={allergens}
                  sidedish={sidedish}
                  supplement={supplement}
                  setOpenDialog={setOpenDialog}
                />
              );
            case "addCat":
              return <CreateCategory categories={categories} setOpenDialog={setOpenDialog} />;
            default:
              return <></>;
          }
        })()}
      </Dialog>
    </>
  );
}

export default Categories;
