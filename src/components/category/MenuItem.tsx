import { useLocale } from "next-intl";
import React from "react";

import { Button } from "../ui";

function MenuItem({ items }: { items: any }) {
  const locale = useLocale();

  if (items)
    return (
      <div className="w-full">
        <article className="w-full flex flex-wrap items-center justify-between">
          <h3 className="text-lg font-semibold">Menu ({items.length})</h3>
          <section className="space-x-4">
            <Button variant={"outline"}>Edit menu</Button>
            <Button>Add menu + </Button>
          </section>
        </article>

        <div className="text-sm mt-8">
          <section className="grid grid-cols-[25px_5fr_2fr] font-semibold py-2 border-b-2">
            <p>Nr.</p>
            <p>Name</p>
            <p>Price</p>
          </section>
          <div className="w-full odd:bg-slate-600">
            {items?.map((menu: any, index: any) => (
              <section
                className="grid grid-cols-[20px_5fr_2fr] py-2 mt-2 px-2 bg-neutral-100 dark:bg-slate-800"
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
