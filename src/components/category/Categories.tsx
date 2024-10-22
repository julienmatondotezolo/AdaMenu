import { Label } from "@radix-ui/react-label";
import { useLocale } from "next-intl";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { deleteCategory, fetchCategories, fetchMenuItemByCategoryId } from "@/_services/ada/adaMenuService";

import { CreateCategory } from "../create";
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
import { MenuItem } from "./MenuItem";
import { SubCategories } from "./SubCategories";

function Categories() {
  const locale = useLocale();
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [categoryId, setCategoryId] = useState<string>();
  const [category, setCategory] = useState<any>();
  const [subCategoryId, setSubCategoryId] = useState<string>();
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | undefined>();

  const queryClient = useQueryClient();
  const fetchAllCategories = () => fetchCategories();

  // Define the mutation for fetching menu items
  const { mutate: fetchMenuItems, data: menuItems } = useMutation(fetchMenuItemByCategoryId, {
    onSuccess: () => {
      queryClient.invalidateQueries("menuItems");
    },
  });

  const { mutate: fetchDeleteCategory } = useMutation(deleteCategory, {
    mutationKey: "DELETE_CATEGORY",
    onSuccess: () => {
      queryClient.invalidateQueries("categories");
    },
  });

  const { isLoading, data: categories } = useQuery("categories", fetchAllCategories, {
    refetchOnWindowFocus: false,
    onSuccess(data) {
      if (data) {
        const firstCategory = data[0];

        setCategory(firstCategory);
        setCategoryId(firstCategory.id);
        // fetchMenuItems({ categoryId: firstCategory.id });
      }
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
  };

  const handleSelectCategory = (category: any) => {
    setSubCategoryId(category.id);
    fetchMenuItems({ categoryId: category.id });
  };

  const handleDeleteCategory = async () => {
    try {
      if (categoryId) fetchDeleteCategory({ categoryId });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`An error has occurred: ${error.message}`);
      }
    }
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
        <div className="h-full items-center border-r-2 dark:border-gray-800">
          <article className="flex flex-col">
            <Button onClick={() => setOpenDialog(true)} className="my-4 mx-auto">
              Create category +{" "}
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
        <div className="w-full overflow-y-scroll pb-12">
          {category && (
            <div className="w-full">
              {/* <h1 className="text-xl font-semibold p-4 border-b-2 dark:border-gray-800">Categories</h1> */}
              <Card className="w-full dark:border-gray-800">
                <form>
                  <CardHeader>
                    <CardTitle>{category.names[locale]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 w-full items-center gap-4 mb-4">
                      {Object.entries(category.names).map(([key, value]) => (
                        <div key={key} className="flex flex-col space-y-1.5">
                          <Label htmlFor="name">{key}</Label>
                          <Input id="name" value={value} placeholder={value} />
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
                            <SelectItem value={null}>NO CATEGORY</SelectItem>
                            {categories.map((category: any, index: any) => (
                              <SelectItem key={index} value={category.id}>
                                {category.names[locale]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button onClick={handleDeleteCategory} variant={"delete"}>
                      Delete
                    </Button>
                    <Button type="submit">Update</Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}
          <section className="w-full p-5 border-x border-t-2 dark:border-gray-800">
            <article className="w-full flex flex-wrap items-center justify-between">
              <h3 className="text-lg font-semibold">Sub categories ({category?.subCategories.length})</h3>
              <Button variant={"outline"}>Edit sub categories</Button>
            </article>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-8">
              {category?.subCategories.map((category: any, index: any) => (
                <SubCategories
                  key={index}
                  category={category}
                  selectedSubCategoryId={subCategoryId}
                  onClick={() => handleSelectCategory(category)}
                />
              ))}
            </div>
          </section>
        </div>
        {menuItems && menuItems.length > 0 && (
          <div className="w-3/4 h-full border-l-2 dark:border-gray-800 p-6 box-border overflow-y-scroll pb-16">
            <MenuItem items={menuItems} />
          </div>
        )}
      </div>
      <Dialog open={openDialog} setIsOpen={setOpenDialog}>
        <CreateCategory categories={categories} />
      </Dialog>
    </>
  );
}

export { Categories };
