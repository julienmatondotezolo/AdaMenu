import { Label } from "@radix-ui/react-label";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { deleteMenu, fetchMenuById, updateMenuItem } from "@/_services";

import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Checkbox, Input, Switch } from "../../ui";

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

  const queryClient = useQueryClient();
  const { mutate: fetchMenuItems, isLoading } = useMutation("menu-items-details", fetchMenuById, {
    onSuccess(data) {
      if (data) setMenuState(data);
    },
  });

  const updateMenuMutation = useMutation(updateMenuItem, {
    onSuccess: async () => {
      // Invalidate and refetch both queries
      await queryClient.invalidateQueries("menuItems");
      await queryClient.invalidateQueries("menu-items-details");
    },
  });

  const deleteMenuMutation = useMutation(deleteMenu, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("menuItems");
      await queryClient.invalidateQueries("menu-items-details");
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
    try {
      if (selectedMenuId) deleteMenuMutation.mutate({ menuId: selectedMenuId });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`An error has occurred: ${error.message}`);
      }
    }
  };

  if (isLoading)
    return (
      <div className="flex h-full overflow-scroll pb-12">
        <p className="m-auto">Loading menu details</p>
      </div>
    );

  if (menuState)
    return (
      <Card className="w-full">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Update Menu item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 w-full items-center gap-4 mb-4">
              {Object.entries(menuState.names).map(([key, value]) => (
                <div key={key} className="flex flex-col space-y-1.5">
                  <Label htmlFor={`name${key}`}>{key}</Label>
                  <Input
                    id={`name${key}`}
                    value={value}
                    placeholder={value}
                    required
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
            <div className="grid grid-cols-2 md:grid-cols-4 w-full items-center gap-4 mb-4">
              {Object.entries(menuState.descriptions).map(([key, value]) => (
                <div key={key} className="flex flex-col space-y-1.5">
                  <Label htmlFor={`description${key}`}>description {key}</Label>
                  <Input
                    id={`description${key}`}
                    value={value}
                    placeholder={value}
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
            <div className="grid grid-cols-2 w-full items-center gap-4 mb-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">price</Label>
                <Input
                  id="price"
                  value={menuState.price}
                  placeholder="price"
                  onChange={(e) =>
                    setMenuState((prev: any) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  type="number"
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label className="flex items-center" htmlFor="name">
                  {text("hidden")}
                  {menuState.hidden && <p className="text-red-500 text-xs ml-4">Menu item will not be visible !</p>}
                </Label>
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
            <div className="w-full">
              <p>Supplement</p>
              <div className="grid grid-cols-4 md:grid-cols-4 w-full items-center gap-4 mb-4 border dark:border-gray-800 p-4 mt-2 bg-gray-100 dark:bg-slate-800">
                {supplement.map((item: any, index: any) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`supplement-${item.id}`}
                      checked={menuState.supplements.some((s: any) => s.id === item.id)}
                      onCheckedChange={() => handleCheckboxChange("supplements", item.id)}
                    />
                    <Label htmlFor={`supplement-${item.id}`}>{item.names[locale]}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full">
              <p>Sidedish</p>
              <div className="grid grid-cols-4 md:grid-cols-4 w-full items-center gap-4 mb-4 border dark:border-gray-800 p-4 mt-2 bg-gray-100 dark:bg-slate-800">
                {sidedish.map((item: any, index: any) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sidedish-${item.id}`}
                      checked={menuState.sideDishes.some((s: any) => s.id === item.id)}
                      onCheckedChange={() => handleCheckboxChange("sideDishes", item.id)}
                    />
                    <Label htmlFor={`sidedish-${item.id}`}>{item.names[locale]}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full">
              <p>Allergens</p>
              <div className="grid grid-cols-4 md:grid-cols-4 w-full items-center gap-4 mb-4 border dark:border-gray-800 p-4 mt-2 bg-gray-100 dark:bg-slate-800">
                {allergens.map((item: any, index: any) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergen-${item.id}`}
                      checked={menuState.allergens.some((a: any) => a.id === item.id)}
                      onCheckedChange={() => handleCheckboxChange("allergens", item.id)}
                    />
                    <Label htmlFor={`allergen-${item.id}`}>{item.names[locale]}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" onClick={handleDeleteMenu} variant={"delete"} disabled={deleteMenuMutation.isLoading}>
              {deleteMenuMutation.isLoading ? `Loading` : text("delete")}
            </Button>
            <Button type="submit" disabled={updateMenuMutation.isLoading}>
              {updateMenuMutation.isLoading ? "Loading..." : text("update")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
}

export { UpdateMenu };
