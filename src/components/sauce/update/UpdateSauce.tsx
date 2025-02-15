import { Label } from "@radix-ui/react-label";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { deleteSauceItem, updateSauceItem } from "@/_services";

import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Input } from "../../ui";

type UpdateSauceProps = {
  selectedItemId: string | undefined;
  selectedItem: any;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
};

function UpdateSauce({ selectedItemId, selectedItem, setOpenDialog }: UpdateSauceProps) {
  // const locale = useLocale();
  const text = useTranslations("Index");
  const [itemState, setItemState] = useState<any>(selectedItem);

  const queryClient = useQueryClient();
  const textItem = "Sauce";

  const updateItemMutation = useMutation(updateSauceItem, {
    onSuccess: async () => {
      // Invalidate and refetch both queries
      await queryClient.invalidateQueries("supplement");
    },
  });

  const deleteItemMutation = useMutation(deleteSauceItem, {
    onSuccess: async () => {
      await queryClient.invalidateQueries("supplement");
    },
  });

  // Refetch when selectedMenuId changes
  useEffect(() => {
    setItemState(selectedItem);
  }, [selectedItem]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItemId) return;

    try {
      const itemObject = {
        [selectedItemId]: {
          names: itemState.names,
          additionalPrice: itemState.additionalPrice,
          // order: menuState.order,
          // hidden: menuState.hidden,
        },
      };

      await updateItemMutation.mutateAsync({
        itemObject,
      });

      setOpenDialog(false);
    } catch (error) {
      console.error(`error updating ${textItem}:`, error);
    }
  };

  const handleDeleteMenu = async () => {
    try {
      if (selectedItemId) {
        await deleteItemMutation.mutateAsync({ menuId: selectedItemId });
        setOpenDialog(false);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`An error has occurred: ${error.message}`);
      }
    }
  };

  if (itemState.names)
    return (
      <Card className="w-full">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>{`Update ${textItem} item`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 w-full items-center gap-4 mb-4">
              {Object.entries(itemState.names).map(([key, value]) => (
                <div key={key} className="flex flex-col space-y-1.5">
                  <Label htmlFor={`name${key}`}>{key}</Label>
                  <Input
                    id={`name${key}`}
                    value={value}
                    placeholder={value}
                    required
                    onChange={(e) =>
                      setItemState((prev: any) => ({
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
            <div className="grid grid-cols-2 w-full items-center gap-4 mb-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">price</Label>
                <Input
                  id="price"
                  value={itemState.additionalPrice}
                  placeholder="price"
                  onChange={(e) =>
                    setItemState((prev: any) => ({
                      ...prev,
                      additionalPrice: e.target.value,
                    }))
                  }
                  type="number"
                  required
                />
              </div>
              {/* visibility */}
              {/* <div className="flex flex-col space-y-1.5">
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
              </div> */}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" onClick={handleDeleteMenu} variant={"delete"} disabled={deleteItemMutation.isLoading}>
              {deleteItemMutation.isLoading ? `Loading...` : text("delete")}
            </Button>
            <Button type="submit" disabled={updateItemMutation.isLoading}>
              {updateItemMutation.isLoading ? "Loading..." : text("update")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
}

export { UpdateSauce };
