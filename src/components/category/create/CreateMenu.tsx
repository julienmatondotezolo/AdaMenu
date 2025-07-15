import { Label } from "@radix-ui/react-label";
import { Plus, Save } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { createMenuItem } from "@/_services";
import { formatPrice, showActionToast } from "@/lib/utils";

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
    onSuccess: (response) => {
      // Invalidate all menu item queries (including those with subCategoryId)
      queryClient.invalidateQueries(["menuItems"]);
      showActionToast({
        type: "success",
        action: "create",
        itemName: nameEn,
        locale,
      });
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
    onError: (error: Error) => {
      showActionToast({
        type: "error",
        action: "create",
        itemName: nameEn,
        locale,
        error,
      });
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
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{text("add")} Menu Item</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create a new menu item with details and options
                </p>
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
              <div className="space-y-2">
                <Label
                  htmlFor="name-en"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                >
                  EN
                </Label>
                <Input
                  id="name-en"
                  value={nameEn}
                  placeholder="Name in English"
                  onChange={(e) => setNameEn(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="name-it"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                >
                  IT
                </Label>
                <Input
                  id="name-it"
                  value={nameIt}
                  placeholder="Name in Italian"
                  onChange={(e) => setNameIt(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="name-fr"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                >
                  FR
                </Label>
                <Input
                  id="name-fr"
                  value={nameFr}
                  placeholder="Name in French"
                  onChange={(e) => setNameFr(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="name-nl"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                >
                  NL
                </Label>
                <Input
                  id="name-nl"
                  value={nameNl}
                  placeholder="Name in Dutch"
                  onChange={(e) => setNameNl(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl"
                  required
                />
              </div>
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
              <div className="space-y-2">
                <Label
                  htmlFor="desc-en"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                >
                  EN
                </Label>
                <Input
                  id="desc-en"
                  value={descriptionEn}
                  placeholder="Description in English"
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="desc-it"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                >
                  IT
                </Label>
                <Input
                  id="desc-it"
                  value={descriptionIt}
                  placeholder="Description in Italian"
                  onChange={(e) => setDescriptionIt(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="desc-fr"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                >
                  FR
                </Label>
                <Input
                  id="desc-fr"
                  value={descriptionFr}
                  placeholder="Description in French"
                  onChange={(e) => setDescriptionFr(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="desc-nl"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide"
                >
                  NL
                </Label>
                <Input
                  id="desc-nl"
                  value={descriptionNl}
                  placeholder="Description in Dutch"
                  onChange={(e) => setDescriptionNl(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl"
                />
              </div>
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
                  value={price}
                  placeholder="0.00"
                  onChange={(e) => {
                    const formattedValue = formatPrice(e.target.value);
                    const value = parseFloat(formattedValue);

                    if (value >= 0 || e.target.value === "") {
                      setPrice(formattedValue);
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
                      {hidden ? "Hidden" : "Visible"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {hidden ? "Item won't appear in menu" : "Item will be visible to customers"}
                    </span>
                  </div>
                  <Switch checked={hidden} onCheckedChange={handleVisibilityChange} />
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
                {selectedAllergens.length} selected
              </span>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {supplement.map((supplementItem: any, index: any) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-xl transition-colors duration-200"
                  >
                    <Checkbox
                      id={`supplement-${supplementItem.id}`}
                      checked={selectedAllergens.includes(supplementItem.id)}
                      onCheckedChange={() => handleCheckboxChange(supplementItem.id)}
                      className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <Label
                      htmlFor={`supplement-${supplementItem.id}`}
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {supplementItem.names[locale]}
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
                {selectedSideDishes.length} selected
              </span>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sidedish.map((sidedishItem: any, index: any) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded-xl transition-colors duration-200"
                  >
                    <Checkbox
                      id={`sidedish-${sidedishItem.id}`}
                      checked={selectedSideDishes.includes(sidedishItem.id)}
                      onCheckedChange={() => handleSideDishChange(sidedishItem.id)}
                      className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                    />
                    <Label
                      htmlFor={`sidedish-${sidedishItem.id}`}
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {sidedishItem.names[locale]}
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
                {allergens.map((allergen: any, index: any) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
                  >
                    <Checkbox
                      id={`allergen-${allergen.id}`}
                      checked={selectedAllergens.includes(allergen.id)}
                      onCheckedChange={() => handleCheckboxChange(allergen.id)}
                      className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                    />
                    <Label
                      htmlFor={`allergen-${allergen.id}`}
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {allergen.names[locale]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Action Button */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-xl">
          <div className="flex justify-end">
            <Button
              type="submit"
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 rounded-xl"
              disabled={createMenuMutation.isLoading}
            >
              {createMenuMutation.isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{createMenuMutation.isLoading ? "Creating..." : `${text("add")} Item`}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export { CreateMenu };
