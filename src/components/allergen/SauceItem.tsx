/* eslint-disable no-unused-vars */
import { Eye, EyeOff, LoaderCircle, MoveDown, MoveUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import { updateMenuItem } from "@/_services";
import { mapMenu } from "@/lib";

import { Button } from "../ui";

interface sauceProps {
  items: any;
  selectedItemId: string | undefined;
  onClick: (dialogMode: "addSauce" | "editSauce") => void;
  onPointerDown: (menuId: string) => void;
}

function SauceItem({ items, selectedItemId, onClick, onPointerDown }: sauceProps) {
  const text = useTranslations("Index");
  const locale = useLocale();
  const [orderedItems, setOrderedItems] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const visibleCount = items?.filter((items: any) => !items.hidden).length;
  const textItem = "Sauce";

  useEffect(() => {
    if (Array.isArray(items)) {
      setOrderedItems(items);
    }
  }, [items]);

  const updateItemMutation = useMutation(updateMenuItem, {
    onSuccess: async () => {
      // Invalidate and refetch both queries
      await queryClient.invalidateQueries("supplement");
    },
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    if (updateItemMutation.isLoading) {
      alert("Wait still loading...");
      return;
    }

    const newItem = [...orderedItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newItem.length) {
      // Swap the order of the categories
      const tempOrder = newItem[index].order;

      newItem[index].order = newItem[targetIndex].order;
      newItem[targetIndex].order = tempOrder;

      setOrderedItems(newItem);

      const itemObject = mapMenu(newItem);

      updateItemMutation.mutate({
        itemObject,
      });
    }
  };

  if (!items) {
    return (
      <div className="flex h-full overflow-scroll pb-12">
        <p className="m-auto">{`Loading ${textItem}s...`}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <article className="w-full flex flex-wrap items-center justify-between">
        <h3 className="text-lg font-semibold">{`${textItem} (${items.length})`}</h3>
        <section className="space-x-4">
          {selectedItemId && (
            <Button onClick={() => onClick("editSauce")} variant={"outline"}>
              {`${text("edit")} ${textItem}`}
            </Button>
          )}
          <Button onClick={() => onClick("addSauce")}>{`${text("add")} ${textItem} + `}</Button>
        </section>
      </article>

      <div className="text-sm mt-8 h-full">
        <section className="grid grid-cols-[25px_3fr_1fr_2fr] font-semibold py-2 border-b mb-4 dark:border-gray-800">
          <p>Nr.</p>
          <p>Name</p>
          <p>Price</p>
          <p>{`Visible (${visibleCount})`}</p>
        </section>
        <div className="h-full overflow-y-scroll pb-60">
          <div className="w-full">
            {items
              ?.sort((a: any, b: any) => a.order - b.order)
              .map((item: any, index: any) => {
                const bgColor =
                  selectedItemId === item.id
                    ? "bg-primary-color text-white"
                    : index % 2 === 1
                      ? "bg-gray-100 dark:bg-gray-800/60"
                      : "bg-gray-200 dark:bg-gray-800";

                return (
                  <section
                    onPointerDown={() => onPointerDown(item.id)}
                    className={`relative cursor-pointer grid grid-cols-[20px_3fr_1fr_2fr] py-2 mt-2 px-2 ${bgColor} ${item.hidden === true && selectedItemId !== item.id && "opacity-40"} hover:bg-primary-color/50`}
                    key={item.id}
                  >
                    <p>{index + 1}.</p>
                    <p>{item.names[locale]}</p>
                    <p>{item.additionalPrice} EUR</p>
                    <div
                      className={`${selectedItemId === item.id && item.hidden === false ? "flex" : "hidden"} absolute top-0 right-2 space-x-4 h-full items-center`}
                    >
                      {updateItemMutation.isLoading ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <>
                          <MoveUp onClick={() => moveItem(index, "up")} className="ml-2 left-0" size={20} />
                          <MoveDown onClick={() => moveItem(index, "down")} className="right-0" size={20} />
                        </>
                      )}
                    </div>
                    <div>{item.hidden == true ? <EyeOff size={16} /> : <Eye size={16} />}</div>
                  </section>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { SauceItem };
