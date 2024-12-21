/* eslint-disable no-unused-vars */
import { Eye, EyeOff, MoveDown, MoveUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { Button } from "../ui";

interface menuProps {
  items: any;
  selectedMenuId: string | undefined;
  onClick: (dialogMode: "addCat" | "addSubCat" | "addMenu" | "editMenu" | "editCat") => void;
  onPointerDown: (menuId: string) => void;
}

function MenuItem({ items, selectedMenuId, onClick, onPointerDown }: menuProps) {
  const text = useTranslations("Index");
  const locale = useLocale();

  const moveCategory = (index: number, direction: "up" | "down") => {
    //
  };

  if (!items) {
    return (
      <div className="flex h-full overflow-scroll pb-12">
        <p className="m-auto">Loading menus...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <article className="w-full flex flex-wrap items-center justify-between">
        <h3 className="text-lg font-semibold">Menu ({items.length})</h3>
        <section className="space-x-4">
          {selectedMenuId && (
            <Button onClick={() => onClick("editMenu")} variant={"outline"}>
              {text("edit")} menu
            </Button>
          )}
          <Button onClick={() => onClick("addMenu")}>{text("add")} menu + </Button>
        </section>
      </article>

      <div className="text-sm mt-8">
        <section className="grid grid-cols-[25px_3fr_1fr_2fr] font-semibold py-2 border-b mb-4 dark:border-gray-800">
          <p>Nr.</p>
          <p>Name</p>
          <p>Price</p>
          <p>Visible</p>
        </section>
        <div className="w-full odd:bg-slate-600">
          {items
            ?.sort((a: any, b: any) => a.order - b.order)
            .map((menu: any, index: any) => (
              <section
                onPointerDown={() => onPointerDown(menu.id)}
                className={`relative cursor-pointer grid grid-cols-[20px_3fr_1fr_2fr] py-2 mt-2 px-2 ${selectedMenuId === menu.id ? "bg-primary-color text-white" : "bg-gray-200 dark:bg-gray-800"} ${menu.hidden == true && "opacity-40"}`}
                key={index}
              >
                <p>{index + 1}.</p>
                <p>{menu.names[locale]}</p>
                <p>{menu.price} EUR</p>
                <div
                  className={`${selectedMenuId === menu.id ? "flex" : "hidden"} absolute top-0 right-2 space-x-4 h-full items-center`}
                >
                  <MoveUp onClick={() => moveCategory(index, "up")} className="ml-2 left-0" size={20} />
                  <MoveDown onClick={() => moveCategory(index, "down")} className="right-0" size={20} />
                </div>
                <div>{menu.hidden == true ? <EyeOff size={16} /> : <Eye size={16} />}</div>
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}

export { MenuItem };
