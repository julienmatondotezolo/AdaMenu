import React, { useState } from "react";
import { useQuery, useQueryClient } from "react-query";

import { fetchSupplement } from "@/_services/ada/adaMenuService";

import { Dialog } from "../ui";
import { CreateSauce } from "./create";
import { SauceItem } from "./SauceItem";
import { UpdateSauce } from "./update";

function Sauces() {
  const [dialogMode, setDialogMode] = useState<"addSauce" | "editSauce">("addSauce");
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string>();
  const [selectedItem, setSelectedItem] = useState<any[]>();

  // const fetchAllCategories = () => fetchCategories();

  // const { isLoading } = useQuery("categories", fetchAllCategories, {
  //   refetchOnWindowFocus: false,
  //   select: (data) => data.sort((a: any, b: any) => a.order - b.order),
  // });

  // const { data: allergens } = useQuery("allergens", fetchAllAllergen, {
  //   refetchOnWindowFocus: false,
  // });

  // const { data: sidedish } = useQuery("sidedish", fetchSidedish, {
  //   refetchOnWindowFocus: false,
  // });

  const queryClient = useQueryClient();

  const { isLoading, data: supplement } = useQuery("supplement", fetchSupplement, {
    refetchOnWindowFocus: false,
  });

  const handleSelectItem = (itemId: string) => {
    queryClient.invalidateQueries("menu-items-details");

    const supplementItem = supplement.filter((supplementItem: any) => supplementItem.id === itemId)[0];

    if (supplementItem) {
      setSelectedItemId(itemId);
      setSelectedItem(supplementItem);
    }
  };

  if (isLoading)
    return (
      <div className="flex h-full overflow-scroll pb-12">
        <p className="m-auto">Loading sauces</p>
      </div>
    );

  return (
    <>
      <div className="flex w-full h-full p-6">
        <SauceItem
          items={supplement}
          selectedItemId={selectedItemId}
          onClick={(dialogMode) => {
            setDialogMode(dialogMode);
            setOpenDialog(true);
          }}
          onPointerDown={(menuId) => handleSelectItem(menuId)}
        />
      </div>
      <Dialog open={openDialog} setIsOpen={setOpenDialog}>
        {(() => {
          switch (dialogMode) {
            case "addSauce":
              return <CreateSauce setOpenDialog={setOpenDialog} />;
            case "editSauce":
              return (
                <UpdateSauce
                  selectedItemId={selectedItemId}
                  selectedItem={selectedItem}
                  setOpenDialog={setOpenDialog}
                />
              );
            default:
              return <></>;
          }
        })()}
      </Dialog>
    </>
  );
}

export { Sauces };
