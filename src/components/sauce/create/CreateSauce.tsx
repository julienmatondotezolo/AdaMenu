import { Label } from "@radix-ui/react-label";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { createSauceItem } from "@/_services";
import { showActionToast } from "@/lib/utils";

import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Input } from "../../ui";

type CreateSauceProps = {
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
};

function CreateSauce({ setOpenDialog }: CreateSauceProps) {
  const locale = useLocale();
  const text = useTranslations("Index");
  const queryClient = useQueryClient();

  const textItem = "Sauce";

  // New state for input values
  const [nameEn, setNameEn] = useState<string>("");
  const [nameIt, setNameIt] = useState<string>("");
  const [nameFr, setNameFr] = useState<string>("");
  const [nameNl, setNameNl] = useState<string>("");

  // New state for price values
  const [additionalPrice, setAdditionalPrice] = useState<string>();

  // // New state for hidden values
  // const [hidden, setHidden] = useState<boolean>(true);

  // const handleVisibilityChange = (checked: boolean) => {
  //   setHidden(checked);
  // };

  const createItemMutation = useMutation(createSauceItem, {
    onSuccess: () => {
      queryClient.invalidateQueries("supplement");
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
      setAdditionalPrice("");
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

    const itemObject: any = {};

    itemObject.names = {
      en: nameEn,
      it: nameIt,
      fr: nameFr,
      nl: nameNl,
    };
    itemObject.additionalPrice = additionalPrice;

    try {
      await createItemMutation.mutateAsync({ itemObject });
      setOpenDialog(false);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`An error has occurred: ${error.message}`);
      }
    }
  };

  return (
    <Card className="w-full h-fit">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{`${text("add")} ${textItem} item`}</CardTitle>
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
          <div className="grid grid-cols-2 w-full items-center gap-4 mb-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">price</Label>
              <Input
                id="price"
                value={additionalPrice}
                placeholder="price"
                onChange={(e) => setAdditionalPrice(e.target.value)}
                type="number"
                required
              />
            </div>
            {/* visibility */}
            {/* <div className="flex flex-col space-y-1.5">
              <Label className="flex items-center" htmlFor="name">
                {text("hidden")}
                {hidden && <p className="text-red-500 text-xs ml-4">Menu item will not be visible !</p>}
              </Label>
              <Switch checked={hidden} onCheckedChange={handleVisibilityChange} />
            </div> */}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="submit">{createItemMutation.isLoading ? "Loading..." : text("add")} +</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export { CreateSauce };
