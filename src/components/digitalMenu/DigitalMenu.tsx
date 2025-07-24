/* eslint-disable indent */
"use client";

import { useLocale } from "next-intl";
import React, { useCallback, useState } from "react";
import { useQuery } from "react-query";

// Types for the menu data structure
interface MenuNames {
  en: string;
  fr: string;
  nl: string;
  it: string;
}

interface MenuItem {
  id: string;
  names: MenuNames;
  descriptions: MenuNames;
  price: number;
  order: number;
}

interface SubCategory {
  id: string;
  names: MenuNames;
  order: number;
  menuItems: MenuItem[];
}

interface Category {
  id: string;
  names: MenuNames;
  order: number;
  hidden: boolean;
  subCategories: SubCategory[];
}

const DigitalMenu: React.FC = () => {
  const locale = useLocale() as keyof MenuNames;

  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Special category IDs for supplements
  const CARNE_SUPPLEMENT_ID = "39984c83-6bd2-4d38-83a0-0d966b8f351e";
  const PIZZE_SUPPLEMENT_ID = "a1426770-286d-4f22-9d09-a8d9fc911a58";

  // Fetch menu data
  const { isLoading } = useQuery(
    "digitalMenu",
    async () => {
      const response = await fetch("https://ada.mindgen.app/api/v1/menu");

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    {
      onSuccess: (data: Category[]) => {
        const filteredCategories = data.filter((item) => !item.hidden).sort((a, b) => a.order - b.order);

        setCategories(filteredCategories);
        if (filteredCategories.length > 0 && !currentCategory) {
          setCurrentCategory(filteredCategories[0]);
        }
      },
    },
  );

  const getLocalizedText = useCallback((names: MenuNames) => names[locale] || names.en || names.nl, [locale]);

  const getSupplementText = useCallback(() => {
    switch (locale) {
      case "fr":
        return { sauce: "Sauce", supplements: "Supplements", chooseCategory: "Choisir une catégorie" };
      case "en":
        return { sauce: "Sauce", supplements: "Supplements", chooseCategory: "Choose a category" };
      default:
        return { sauce: "Sauzen", supplements: "Supplementen", chooseCategory: "Kies categorie" };
    }
  }, [locale]);

  const supplements = getSupplementText();

  const handleCategoryChange = (category: Category) => {
    setCurrentCategory(category);
    setIsDialogOpen(false);
  };

  const renderSupplements = (subCatId: string) => {
    if (subCatId === CARNE_SUPPLEMENT_ID) {
      return (
        <div className="supplements-section bg-[#f7f2e6] p-4 mt-8 border border-black rounded">
          <h3 className="text-lg pb-4 mb-4 border-b border-black text-[#861b2d]">{supplements.sauce}</h3>
          <div className="space-y-2">
            {[
              {
                name: "Al pepe",
                description:
                  locale === "nl"
                    ? "Peperroomsaus"
                    : locale === "fr"
                      ? "Sauce au poivre et à la crème"
                      : "Pepper cream sauce",
                price: 4.5,
              },
              {
                name: "Pizzaiola",
                description:
                  locale === "nl"
                    ? "Tomatensaus, knoflook, kappertjes, ansjovis met witte wijn"
                    : locale === "fr"
                      ? "Sauce tomate, à l'ail, aux câpres, anchois avec vin blanc"
                      : "Tomato sauce, garlic, capers, anchovies with white wine",
                price: 4.5,
              },
              {
                name: "Archiduc",
                description:
                  locale === "nl"
                    ? "Roomsaus en champignons"
                    : locale === "fr"
                      ? "Sauce à la crème et aux champignons"
                      : "Cream sauce and mushrooms",
                price: 4.5,
              },
              {
                name: "Dello Chef",
                description:
                  locale === "nl"
                    ? "Tomatenroomsaus, champignons, ham en cognac"
                    : locale === "fr"
                      ? "Sauce tomate à la crème, aux champignons, jambon et cognac"
                      : "Tomato cream sauce, mushrooms, ham with cognac",
                price: 5,
              },
            ].map((sauce, index) => (
              <div
                key={index}
                className="menu-item flex justify-between items-start p-2 border-b border-gray-200 last:border-b-0 hover:bg-[#e7e0d0] transition-colors"
              >
                <article className="flex-1 pr-4">
                  <p className="font-medium text-sm sm:text-base">{sauce.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{sauce.description}</p>
                </article>
                <p className="text-sm font-medium whitespace-nowrap">€ {sauce.price}</p>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (subCatId === PIZZE_SUPPLEMENT_ID) {
      return (
        <div className="supplements-section bg-[#f7f2e6] p-4 mt-8 border border-black rounded">
          <h3 className="text-lg pb-4 mb-4 border-b border-black text-[#861b2d]">
            Base: Pomodoro, mozzarella e origano
          </h3>
          <h4 className="text-md font-medium mb-2 text-[#861b2d]">{supplements.supplements}</h4>
          <div className="space-y-2">
            {[
              { items: "parma / salame / spek / ananas / gorgonzola", price: 3 },
              { items: "tonno / scampi / frutti di mare / salmone", price: 4 },
              { items: "Burrata", price: 6 },
            ].map((supplement, index) => (
              <div
                key={index}
                className="menu-item flex justify-between items-center p-2 border-b border-gray-200 last:border-b-0 hover:bg-[#e7e0d0] transition-colors"
              >
                <p className="flex-1 text-sm font-medium">{supplement.items}</p>
                <p className="text-sm font-medium whitespace-nowrap ml-4">€ {supplement.price}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="menu-container w-full h-full bg-white flex items-center justify-center">
        <h2 className="text-4xl font-light text-center text-white bg-gray-800 p-16">Loading menu...</h2>
      </div>
    );
  }

  return (
    <div className="menu-container w-full h-full bg-white overflow-auto font-['Poppins',_sans-serif]">
      {/* Navigation */}
      <nav className="categories w-full">
        {/* Mobile Category Selector */}
        <button
          className="category-selector flex justify-between items-center p-4 bg-[#f7f2e6] w-full cursor-pointer lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setIsDialogOpen(true)}
          type="button"
          aria-label="Open category selection menu"
        >
          <article>
            <p className="text-sm text-gray-600">{supplements.chooseCategory}</p>
            <p className="text-base font-medium">
              {currentCategory ? getLocalizedText(currentCategory.names) : "Loading..."}
            </p>
          </article>
          <i className="fa fa-angle-down text-2xl" />
        </button>

        {/* Desktop Category Tabs */}
        <ul className="category-tabs hidden lg:flex list-none m-0 p-0">
          {categories.map((category) => (
            <li key={category.id}>
              <button
                className={`category-tab flex justify-center items-center relative overflow-hidden bg-[#f7f2e6] text-[#333] px-8 py-4 cursor-pointer transition-colors border-r border-[#e9e4d8] text-center text-xs font-semibold hover:bg-[#e7e0d0] hover:text-[#861b2d] hover:font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${
                  currentCategory?.id === category.id
                    ? "bg-[#e7e0d0] text-[#861b2d] font-bold after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[#861b2b] after:scale-x-100 after:transition-transform after:duration-500"
                    : "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[#861b2b] after:scale-x-0 after:transition-transform after:duration-500"
                }`}
                onClick={() => handleCategoryChange(category)}
                type="button"
                aria-pressed={currentCategory?.id === category.id}
              >
                {getLocalizedText(category.names)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Dialog */}
      {isDialogOpen && (
        <div className="dialog fixed inset-0 z-[9999] bg-[#f7f2e6] shadow-lg p-8 lg:hidden">
          <div className="dialog-content max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="category-tab flex justify-center items-center bg-[#f7f2e6] text-[#333] p-4 cursor-pointer transition-colors border border-[#e9e4d8] rounded hover:bg-[#e7e0d0] hover:text-[#861b2d] focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  onClick={() => handleCategoryChange(category)}
                  type="button"
                >
                  {getLocalizedText(category.names)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Title */}
      <h2 className="category-text font-['Celine_Sans',_sans-serif] font-light text-4xl text-white text-center py-16 bg-gray-800">
        {currentCategory ? getLocalizedText(currentCategory.names) : "Loading menu..."}
      </h2>

      {/* Subcategories Content */}
      <div className="subcategories-content grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
        {currentCategory?.subCategories
          .sort((a, b) => a.order - b.order)
          .map((subCategory) => (
            <div key={subCategory.id} className="subcategory bg-[#f7f2e6] p-8 rounded min-h-fit">
              <h3 className="text-lg pb-4 mb-4 border-b border-black mt-0 text-[#861b2d] font-medium">
                {getLocalizedText(subCategory.names)}
              </h3>

              {/* Menu Items */}
              <div className="space-y-2">
                {subCategory.menuItems
                  .sort((a, b) => a.order - b.order)
                  .map((menuItem) => (
                    <div
                      key={menuItem.id}
                      className="menu-item flex justify-between items-start p-2 border-b border-gray-200 last:border-b-0 hover:bg-[#e7e0d0] transition-colors"
                    >
                      <article className="flex-1 pr-4">
                        <p className="menu-name font-medium text-sm sm:text-base">{getLocalizedText(menuItem.names)}</p>
                        {menuItem.descriptions &&
                          getLocalizedText(menuItem.descriptions) !== getLocalizedText(menuItem.names) && (
                            <p className="menu-description text-xs text-gray-600 mt-1">
                              {getLocalizedText(menuItem.descriptions)}
                            </p>
                          )}
                      </article>
                      <p className="menu-price text-sm font-medium whitespace-nowrap">€ {menuItem.price}</p>
                    </div>
                  ))}
              </div>

              {/* Supplements */}
              {renderSupplements(subCategory.id)}
            </div>
          ))}
      </div>
    </div>
  );
};

export default DigitalMenu;
