import { Label } from "@radix-ui/react-label";
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
  CardHeader,
  CardTitle,
  Dialog,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui";
import { CategoryItem } from "./CategoryItem";
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
      return;
    }

    setCategory(category);
    setCategoryId(category.id);
    // Reset the selected parent category
    setSelectedParentCategory("");
    // queryClient.setQueryData(["menuItems"], null);
    setSubCategoryId("");
    setSelectedMenuId("");
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
  };

  const openUpdateSubCategory = () => {
    setDialogMode("editCat");
    setOpenDialog(true);
  };

  const handleDeleteCategory = async () => {
    try {
      if (categoryId) await deleteCategoryMutation.mutateAsync({ categoryId });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`An error has occurred: ${error.message}`);
      }
    }
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
        <div className="h-full items-center border-r-2 dark:border-gray-800 overflow-y-scroll pb-16">
          <article className="flex flex-col">
            <Button
              onClick={() => {
                setDialogMode("addCat");
                setOpenDialog(true);
              }}
              className="my-4 mx-auto"
            >
              {!subCategoryId ? `${text("add")} category +` : `${text("add")} +`}
            </Button>
            {categories && (
              <CategoryItem
                categories={categories}
                categoryId={categoryId}
                onClick={(category) => openCategoryDetails(category)}
              />
            )}
          </article>
        </div>
        {category && category.names && (
          <div className="w-full overflow-y-scroll pb-12">
            <div className="w-full">
              {/* <h1 className="text-xl font-semibold p-4 border-b-2 dark:border-gray-800">Categories</h1> */}
              <Card className="w-full dark:border-gray-800">
                <form onSubmit={handleUpdateCategory}>
                  <CardHeader>
                    <CardTitle>{category.names[locale]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 w-full items-center gap-4 mb-4">
                      {Object.entries(category.names).map(([key, value]) => (
                        <div key={key} className="flex flex-col space-y-1.5">
                          <Label htmlFor="name">{key}</Label>
                          <Input
                            id="name"
                            value={String(value)}
                            placeholder={String(value)}
                            required
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
                    <div className="w-full space-y-1.5">
                      <Label htmlFor="name">Select a parent category</Label>
                      <Select value={selectedParentCategory} onValueChange={setSelectedParentCategory}>
                        <SelectTrigger className="w-full">
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
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      type="button"
                      onClick={handleDeleteCategory}
                      variant={"delete"}
                      disabled={deleteCategoryMutation.isLoading}
                    >
                      {deleteCategoryMutation.isLoading ? `Loading...` : `${text("delete")}`}
                    </Button>
                    <Button type="submit" disabled={updateCategoryMutation.isLoading}>
                      {updateCategoryMutation.isLoading ? `Loading...` : `${text("update")}`}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
            <section className="w-full p-5 border-x border-t-2 dark:border-gray-800">
              <article className="w-full flex flex-wrap items-center justify-between">
                <h3 className="text-lg font-semibold">Sub categories ({category?.subCategories.length})</h3>
                <section className="space-x-6">
                  {subCategoryId && (
                    <Button variant={"outline"} onClick={openUpdateSubCategory}>
                      {text("edit")} sub category
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setDialogMode("addSubCat");
                      setOpenDialog(true);
                    }}
                  >
                    {text("add")} sub category +
                  </Button>
                </section>
              </article>
              {categoryId && (
                <SubCategories
                  categories={categories}
                  // subCategories={category.subCategories}
                  parentCategoryId={categoryId}
                  selectedSubCategoryId={subCategoryId}
                  onClick={(subCategory) => handleSelectCategory(subCategory)}
                />
              )}
            </section>
          </div>
        )}
        {subCategoryId && (
          <div className="w-3/4 h-full border-l-2 dark:border-gray-800 p-6">
            <MenuItem
              items={menuItems}
              selectedMenuId={selectedMenuId}
              onClick={(dialogMode) => {
                setDialogMode(dialogMode);
                setOpenDialog(true);
              }}
              onPointerDown={(menuId) => handleSelectMenu(menuId)}
            />
          </div>
        )}
      </div>
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

export { Categories };
