import { Label } from "@radix-ui/react-label";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { createCategory } from "@/_services";

import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Input } from "../../ui";

type CreateCategoryProps = {
  categories: any;
  parentCategoryId?: string | undefined;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
};

function CreateCategory({ categories, parentCategoryId, setOpenDialog }: CreateCategoryProps) {
  const text = useTranslations("Index");
  const queryClient = useQueryClient();
  const locale = useLocale();
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | undefined>();
  const [subCategoryLength, setSubCategoryLength] = useState<number | undefined>();

  const buttonText = parentCategoryId ? `${text("add")} sub category +` : text("add");

  useEffect(() => {
    if (parentCategoryId) {
      setSelectedParentCategory(parentCategoryId);
      const subCat = categories.filter((category: any) => category.id === parentCategoryId)[0].subCategories;

      setSubCategoryLength(subCat.length);
    }
  }, [categories, parentCategoryId, selectedParentCategory]);

  // New state for input values
  const [nameEn, setNameEn] = useState<string>("");
  const [nameIt, setNameIt] = useState<string>("");
  const [nameFr, setNameFr] = useState<string>("");
  const [nameNl, setNameNl] = useState<string>("");

  const createCategoryMutation = useMutation(createCategory, {
    onSuccess: () => {
      queryClient.invalidateQueries("categories");
      setNameEn("");
      setNameIt("");
      setNameFr("");
      setNameNl("");
      setSelectedParentCategory("");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newCategoryObject: any = {};

    newCategoryObject.names = {
      en: nameEn,
      it: nameIt,
      fr: nameFr,
      nl: nameNl,
    };

    newCategoryObject.parentCategoryId = selectedParentCategory;
    newCategoryObject.order = subCategoryLength ? subCategoryLength + 1 : categories.length + 1;

    try {
      await createCategoryMutation.mutateAsync({ categoryObject: newCategoryObject });
      setOpenDialog(false);
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
          <CardTitle>
            {text("add")} {parentCategoryId && "Sub "}Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 w-full items-center gap-4 mb-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">en</Label>
              <Input
                id="name"
                value={nameEn}
                placeholder="Name en"
                onChange={(e) => setNameEn(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">it</Label>
              <Input
                id="name"
                value={nameIt}
                placeholder="Name it"
                onChange={(e) => setNameIt(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">fr</Label>
              <Input
                id="name"
                value={nameFr}
                placeholder="Name fr"
                onChange={(e) => setNameFr(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">nl</Label>
              <Input
                id="name"
                value={nameNl}
                placeholder="Name nl"
                onChange={(e) => setNameNl(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="w-full space-y-1.5">
            <Label htmlFor="name">Select a parent category</Label>
            <select
              id="parent-category"
              value={selectedParentCategory || ""}
              onChange={(e) => setSelectedParentCategory(e.target.value || undefined)}
              className="w-full p-2 border"
              disabled={parentCategoryId ? true : false}
            >
              <option value="">Select a parent category</option>
              <option value={""}>NO CATEGORY</option>
              {categories?.map((category: any, index: any) => (
                <option key={index} value={category.id}>
                  {category.names[locale]}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="submit">{createCategoryMutation.isLoading ? "Loading..." : buttonText}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export { CreateCategory };
