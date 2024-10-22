import { Label } from "@radix-ui/react-label";
import { useLocale } from "next-intl";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { deleteCategory, updateCategory } from "@/_services";
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Input } from "@/components/ui";

type UpdateSubCategoryProps = {
  category: any;
  setCategory: any;
  categories: any;
  parentCategoryId: string | undefined;
};

function UpdateSubCategory({ category, setCategory, categories, parentCategoryId }: UpdateSubCategoryProps) {
  const queryClient = useQueryClient();
  const locale = useLocale();
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | undefined>(parentCategoryId);

  const updateCategoryMutation = useMutation(updateCategory, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("categories");
    },
  });

  const deleteCategoryMutation = useMutation(deleteCategory, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("categories");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newCategory = category;

    newCategory.parentCategoryId = selectedParentCategory;

    updateCategoryMutation.mutate({
      categoryObject: newCategory,
      categoryId: newCategory.id,
    });
  };

  const handleDeleteCategory = () => {
    try {
      if (category.id) deleteCategoryMutation.mutate({ categoryId: category.id });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`An error has occurred: ${error.message}`);
      }
    }
  };

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
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
                  value={value}
                  placeholder={value}
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
            <select
              id="parent-category"
              value={selectedParentCategory || ""}
              onChange={(e) => setSelectedParentCategory(e.target.value || undefined)}
              className="w-full p-2 border"
            >
              <option value="">Select a parent category</option>
              <option value={""}>NO CATEGORY</option>
              {categories.map((category: any, index: any) => (
                <option key={index} value={category.id}>
                  {category.names[locale]}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            onClick={handleDeleteCategory}
            variant={"delete"}
            disabled={deleteCategoryMutation.isLoading}
          >
            {deleteCategoryMutation.isLoading ? `Loading` : `Delete`}
          </Button>
          <Button type="submit">Update</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export { UpdateSubCategory };
