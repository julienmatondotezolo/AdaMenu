import { Label } from "@radix-ui/react-label";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { createMenuItem } from "@/_services";

import { Button, Checkbox, Input, Switch } from "../../ui";

type CreateMenuProps = {
  subCategoryId?: string;
  allergens: any;
  sidedish: any;
  supplement: any;
  items: any;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
};

function CreateMenu({ subCategoryId, allergens, sidedish, supplement, items, setOpenDialog }: CreateMenuProps) {
  const text = useTranslations("Index");
  const locale = useLocale();
  const queryClient = useQueryClient();

  // New state for input values
  const [nameEn, setNameEn] = useState<string>("");
  const [nameIt, setNameIt] = useState<string>("");
  const [nameFr, setNameFr] = useState<string>("");
  const [nameNl, setNameNl] = useState<string>("");

  // New state for description values
  const [descriptionEn, setDescriptionEn] = useState<string>("");
  const [descriptionIt, setDescriptionIt] = useState<string>("");
  const [descriptionFr, setDescriptionFr] = useState<string>("");
  const [descriptionNl, setDescriptionNl] = useState<string>("");

  // New state for price values
  const [price, setPrice] = useState<string>();

  // New state for hidden values
  const [hidden, setHidden] = useState<boolean>(false);

  // New state for selected allergen IDs
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedSideDishes, setSelectedSideDishes] = useState<string[]>([]);

  const handleVisibilityChange = (checked: boolean) => {
    setHidden(checked);
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(id) ? prev.filter((allergenId) => allergenId !== id) : [...prev, id],
    );
  };

  const handleSideDishChange = (id: string) => {
    setSelectedSideDishes((prev) =>
      prev.includes(id) ? prev.filter((sidedishId) => sidedishId !== id) : [...prev, id],
    );
  };

  const createMenuMutation = useMutation(createMenuItem, {
    onSuccess: () => {
      queryClient.invalidateQueries("menuItems");
      setNameEn("");
      setNameIt("");
      setNameFr("");
      setNameNl("");
      setDescriptionEn("");
      setDescriptionIt("");
      setDescriptionFr("");
      setDescriptionNl("");
      setPrice("");
      setHidden(false);
      setSelectedAllergens([]);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate descriptions: if any description is filled, all must be filled
    const descriptions = [descriptionEn, descriptionIt, descriptionFr, descriptionNl];
    const hasAnyDescription = descriptions.some((desc) => desc.trim() !== "");
    const hasAllDescriptions = descriptions.every((desc) => desc.trim() !== "");

    if (hasAnyDescription && !hasAllDescriptions) {
      alert(text("description_validation_error"));
      return;
    }

    const newMenuObject: any = {};

    newMenuObject.names = {
      en: nameEn,
      it: nameIt,
      fr: nameFr,
      nl: nameNl,
    };

    newMenuObject.descriptions = {
      en: descriptionEn,
      it: descriptionIt,
      fr: descriptionFr,
      nl: descriptionNl,
    };

    newMenuObject.categoryId = subCategoryId;
    newMenuObject.price = price;
    newMenuObject.hidden = hidden;
    newMenuObject.allergenIds = selectedAllergens;
    newMenuObject.sideDishIds = selectedSideDishes;
    newMenuObject.order = items.length + 1;

    try {
      await createMenuMutation.mutateAsync({ menuObject: newMenuObject });
      setOpenDialog(false);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`An error has occurred: ${error.message}`);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b">
          <h2 className="text-xl sm:text-2xl font-semibold">{text("add")} Menu item</h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 w-full items-center gap-4 mb-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 w-full items-center gap-4 mb-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">description en</Label>
              <Input
                id="description"
                value={descriptionEn}
                placeholder="description en"
                onChange={(e) => setDescriptionEn(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">description it</Label>
              <Input
                id="description"
                value={descriptionIt}
                placeholder="description it"
                onChange={(e) => setDescriptionIt(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">description fr</Label>
              <Input
                id="description"
                value={descriptionFr}
                placeholder="description fr"
                onChange={(e) => setDescriptionFr(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">description nl</Label>
              <Input
                id="description"
                value={descriptionNl}
                placeholder="description nl"
                onChange={(e) => setDescriptionNl(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 w-full items-center gap-4 mb-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">price</Label>
              <Input
                id="price"
                value={price}
                placeholder="price"
                onChange={(e) => {
                  const value = parseFloat(e.target.value);

                  if (value >= 0 || e.target.value === "") {
                    setPrice(e.target.value);
                  }
                }}
                type="number"
                min="0"
                step="1"
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label className="flex items-center" htmlFor="name">
                {text("hidden")}
                {hidden && <p className="text-red-500 text-xs ml-4">{text("menu_item_not_visible")}</p>}
              </Label>
              <Switch checked={hidden} onCheckedChange={handleVisibilityChange} />
            </div>
          </div>
          <div className="w-full">
            <p>Supplement</p>
            <div className="grid grid-cols-4 md:grid-cols-4 w-full items-center gap-4 mb-4 border dark:border-gray-800 p-4 mt-2 bg-gray-100 dark:bg-slate-800">
              {supplement.map((supplementItem: any, index: any) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={supplementItem.id}
                    value={supplementItem.id}
                    onCheckedChange={() => handleCheckboxChange(supplementItem.id)}
                  />
                  <Label htmlFor={supplementItem.names[locale]}>{supplementItem.names[locale]}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full">
            <p>Sidedish</p>
            <div className="grid grid-cols-4 md:grid-cols-4 w-full items-center gap-4 mb-4 border dark:border-gray-800 p-4 mt-2 bg-gray-100 dark:bg-slate-800">
              {sidedish.map((sidedishItem: any, index: any) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={sidedishItem.id}
                    value={sidedishItem.id}
                    onCheckedChange={() => handleSideDishChange(sidedishItem.id)}
                  />
                  <Label htmlFor={sidedishItem.names[locale]}>{sidedishItem.names[locale]}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full">
            <p>Allergens</p>
            <div className="grid grid-cols-4 md:grid-cols-4 w-full items-center gap-4 mb-4 border dark:border-gray-800 p-4 mt-2 bg-gray-100 dark:bg-slate-800">
              {allergens.map((allergen: any, index: any) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={allergen.id}
                    value={allergen.id}
                    onCheckedChange={() => handleCheckboxChange(allergen.id)}
                  />
                  <Label htmlFor={allergen.names[locale]}>{allergen.names[locale]}</Label>
                </div>
              ))}
            </div>
          </div>
          {/* <div className="w-full space-y-1.5">
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
              {categories.map((category: any, index: any) => (
                <option key={index} value={category.id}>
                  {category.names[locale]}
                </option>
              ))}
            </select>
          </div> */}
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t p-4 sm:p-6 bg-white dark:bg-background">
          <div className="flex justify-end">
            <Button type="submit" className="min-w-[100px]" disabled={createMenuMutation.isLoading}>
              {createMenuMutation.isLoading ? "Loading..." : text("add")} +
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export { CreateMenu };
