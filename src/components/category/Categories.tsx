import { Label } from "@radix-ui/react-label";
import { ChevronDown, ChevronLeft, ChevronUp, Edit, Eye, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import {
  deleteCategory,
  fetchAllergen,
  fetchCategories,
  fetchCompleteMenu,
  fetchMenuItemByCategoryId,
  fetchSidedish,
  fetchSupplement,
  updateCategory,
} from "@/_services/ada/adaMenuService";
import { indexedDBService } from "@/lib/indexedDBService";
import { showActionToast } from "@/lib/utils";
import { useMenuMakerStore } from "@/stores/menumaker";

import { PreviewMode } from "../menumaker/PreviewMode";
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
  const router = useRouter();
  const { loadProject, setMenuData, setMenuLoading, setMenuError, clearMenuData } = useMenuMakerStore();
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
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(true);
  const [menuViewMode, setMenuViewMode] = useState<"grid" | "list">("grid");

  const queryClient = useQueryClient();
  const fetchAllCategories = () => fetchCategories();
  const fetchAllAllergen = () => fetchAllergen();

  // Listen to all mutations and refetch menu data when any mutation succeeds
  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe(async (mutation) => {
      if (mutation?.state?.status === "success") {
        try {
          setMenuLoading(true);
          setMenuError(null);
          // Clear existing menu data first
          clearMenuData();

          // Fetch the complete menu and save to store
          const menuResponse = await fetchCompleteMenu();

          if (menuResponse && Array.isArray(menuResponse)) {
            setMenuData(menuResponse);
          } else {
            setMenuError("Invalid menu data format received");
          }
          queryClient.invalidateQueries("menuItems");
        } catch (error) {
          console.error("Error fetching menu data:", error);
          setMenuError(error instanceof Error ? error.message : "Unknown error occurred");
        } finally {
          setMenuLoading(false);
        }
      }
    });

    // Cleanup subscription on component unmount
    return unsubscribe;
  }, [queryClient, clearMenuData, setMenuData, setMenuLoading, setMenuError]);

  // Define the query for fetching menu items based on the selected subCategoryId
  const { data: menuItems } = useQuery(
    ["menuItems", subCategoryId],
    () => fetchMenuItemByCategoryId({ categoryId: subCategoryId! }),
    {
      enabled: !!subCategoryId,
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

  // Check IndexedDB for menumaker projects on component mount
  useEffect(() => {
    const loadFirstProject = async () => {
      try {
        const project = await indexedDBService.getFirstProject();

        if (project) {
          loadProject(project);
        }
      } catch (error) {
        console.warn("Failed to load menumaker project from IndexedDB:", error);
      }
    };

    loadFirstProject();
  }, []); // Run only once on component mount

  // Fetch initial menu data when component mounts
  useEffect(() => {
    const fetchInitialMenuData = async () => {
      try {
        setMenuLoading(true);
        setMenuError(null);

        const menuResponse = await fetchCompleteMenu();

        if (menuResponse && Array.isArray(menuResponse)) {
          setMenuData(menuResponse);
        } else {
          setMenuError("Invalid menu data format received");
        }
      } catch (error) {
        console.error("Error fetching initial menu data:", error);
        setMenuError(error instanceof Error ? error.message : "Unknown error occurred");
      } finally {
        setMenuLoading(false);
      }
    };

    fetchInitialMenuData();
  }, []); // Run only once on component mount

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
        showActionToast({
          type: "success",
          action: "update",
          itemName: responseUpdateCategory.names[locale],
          locale,
        });
      }
    },
    onError: (error: Error) => {
      showActionToast({
        type: "error",
        action: "update",
        itemName: category?.names[locale],
        locale,
        error,
      });
    },
  });

  const deleteCategoryMutation = useMutation(deleteCategory, {
    onSuccess: async () => {
      showActionToast({
        type: "success",
        action: "delete",
        itemName: category?.names[locale],
        locale,
      });
      setCategory("");
      setCategoryId("");
      setSelectedParentCategory("");
      setSubCategoryId("");
      setSelectedMenuId("");
      await queryClient.invalidateQueries("categories");
    },
    onError: (error: Error) => {
      showActionToast({
        type: "error",
        action: "delete",
        itemName: category?.names[locale],
        locale,
        error,
      });
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
    // Reset subcategories expanded
    setIsSubcategoriesExpanded(true);
  };

  const handleSelectSubCategory = (subCategory: any) => {
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
      <div className="flex w-full h-[calc(100vh-56px)] md:h-[calc(100vh-56px)]">
        {/* Left sidebar with fixed header and scrollable categories */}
        {/* On mobile: full-width when no category selected, hidden when category selected */}
        <div
          className={`h-full flex flex-col border-r-2 dark:border-gray-800 transition-all duration-200
            ${categoryId && category ? "hidden md:flex" : "w-full md:w-auto"}
            ${isRightPanelExpanded ? "md:w-1/4" : "md:w-1/5"}
          `}
        >
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
        {/* On mobile: full-width when category is selected, hidden when no category */}
        <div className={`flex-1 h-full flex flex-col transition-all duration-200 ${
          !categoryId || !category ? "hidden md:flex" : "flex"
        }`}>
          {category && category.names && (
            <>
              {/* Collapsible category details */}
              <div className="flex-none">
                <div className="border-b dark:border-gray-800">
                  {/* Collapsible header — with mobile back button */}
                  <button
                    className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => setIsCategoryDetailsExpanded(!isCategoryDetailsExpanded)}
                    aria-expanded={isCategoryDetailsExpanded}
                    aria-controls="category-details-content"
                  >
                    <div className="flex items-center justify-between w-full pr-6">
                      <div className="flex items-center gap-2">
                        {/* Mobile back button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryId(undefined);
                            setCategory(undefined);
                            setSubCategoryId("");
                            setSelectedMenuId("");
                          }}
                          className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Back to categories"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <h2 className="text-lg md:text-xl font-semibold">{category.names[locale]}</h2>
                      </div>
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
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold">Sub categories ({category?.subCategories.length})</h3>
                        {subCategoryId && (
                          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              {category?.subCategories.find((sc: any) => sc.id === subCategoryId)?.names[locale]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-6">
                        <section className="flex items-center gap-2 sm:gap-6">
                          {subCategoryId && (
                            <Button
                              variant={"outline"}
                              onClick={(e) => {
                                e.stopPropagation();
                                openUpdateSubCategory();
                              }}
                              size="sm"
                              className="text-xs sm:text-sm"
                            >
                              <Edit className="w-4 h-4" />
                              <span className="hidden sm:inline">
                                {text("edit")} sub category{" "}
                                {category?.subCategories.find((sc: any) => sc.id === subCategoryId)?.names[locale]}
                              </span>
                              <span className="sm:hidden">{text("edit")}</span>
                            </Button>
                          )}
                          {isSubcategoriesExpanded && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDialogMode("addSubCat");
                                setOpenDialog(true);
                              }}
                              size="sm"
                              className="text-xs sm:text-sm"
                            >
                              + <span className="hidden sm:inline">{text("add")} sub category</span>
                              <span className="sm:hidden">{text("add")}</span>
                            </Button>
                          )}
                        </section>
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
                          setIsSubcategoriesExpanded={setIsSubcategoriesExpanded}
                          onClick={handleSelectSubCategory}
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

        {/* Right menu preview — hidden on mobile */}
        <div
          className={`hidden md:flex ${isRightPanelExpanded ? "w-[30%]" : "w-36"} h-full flex-col border-l-2 dark:border-gray-800 transition-all duration-200`}
        >
          {/* Right panel header */}
          <div className="flex-none border-b dark:border-gray-800">
            <button
              className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={() => setIsRightPanelExpanded(!isRightPanelExpanded)}
              aria-expanded={isRightPanelExpanded}
              aria-controls="right-panel-content"
            >
              <div className="flex items-center space-x-2">
                {isRightPanelExpanded ? (
                  <div className="flex items-center justify-between w-full pr-4 space-x-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Menu Preview</h3>
                    <Button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const project = await indexedDBService.getFirstProject();

                          if (project) {
                            loadProject(project);
                            router.push(`/${locale}/menumaker`);
                          } else {
                            alert("Project not found.");
                          }
                        } catch (error) {
                          console.error("Failed to load project:", error);
                          alert("Failed to load project. The project file may be corrupted.");
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Open Menu
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">View Menu</p>
                  </div>
                )}
              </div>
              {isRightPanelExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500 transform rotate-90" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 transform -rotate-90" />
              )}
            </button>
          </div>

          {/* Content when collapsed */}
          {!isRightPanelExpanded && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Click view menu to see the menu
                </p>
              </div>
            </div>
          )}

          {/* Collapsible content when expanded */}
          <div
            id="right-panel-content"
            role="region"
            aria-labelledby="right-panel-header"
            className={`flex-1 overflow-y-auto transition-all duration-200 ${isRightPanelExpanded ? "block" : "hidden"}`}
          >
            <PreviewMode
              onExit={() => {
                /* No action needed for categories component */
              }}
              showExitButton={false}
            />
          </div>
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
