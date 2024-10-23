/* eslint-disable no-unused-vars */
import { useLocale } from "next-intl";
import React from "react";

import { Button } from "../ui";

interface menuProps {
  items: any;
  selectedMenuId: string | undefined;
  onClick: (dialogMode: "addCat" | "addSubCat" | "addMenu" | "editMenu" | "editCat") => void;
  onPointerDown: (menuId: string) => void;
}

function MenuItem({ items, selectedMenuId, onClick, onPointerDown }: menuProps) {
  const locale = useLocale();

  if (items)
    return (
      <div className="w-full">
        <article className="w-full flex flex-wrap items-center justify-between">
          <h3 className="text-lg font-semibold">Menu ({items.length})</h3>
          <section className="space-x-4">
            {selectedMenuId && (
              <Button onClick={() => onClick("editMenu")} variant={"outline"}>
                Edit menu
              </Button>
            )}
            <Button onClick={() => onClick("addMenu")}>Add menu + </Button>
          </section>
        </article>

        <div className="text-sm mt-8">
          <section className="grid grid-cols-[25px_5fr_2fr] font-semibold py-2 border-b mb-4 dark:border-gray-800">
            <p>Nr.</p>
            <p>Name</p>
            <p>Price</p>
          </section>
          <div className="w-full odd:bg-slate-600">
            {items?.sort((a: any, b: any) => a.order - b.order).map((menu: any, index: any) => (
              <section
                onPointerDown={() => onPointerDown(menu.id)}
                className={`cursor-pointer grid grid-cols-[20px_5fr_2fr] py-2 mt-2 px-2 ${selectedMenuId === menu.id ? "bg-primary-color text-white" : "bg-gray-200 dark:bg-gray-800"}`}
                key={index}
              >
                <p>{index + 1}.</p>
                <p>{menu.names[locale]}</p>
                <p>{menu.price} EUR</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    );
}

export { MenuItem };
