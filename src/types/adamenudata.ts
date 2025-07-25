// Types for the Ada menu data structure
export interface MenuNames {
  en: string;
  it: string;
  fr: string;
  nl: string;
}

export interface MenuDescriptions {
  en: string;
  it: string;
  fr: string;
  nl: string;
}

export interface SideDish {
  id: string;
  names: MenuNames;
  additionalPrice: number;
}

export interface Supplement {
  id: string;
  names: MenuNames;
  additionalPrice: number;
}

export interface MenuItem {
  id: string;
  names: MenuNames;
  descriptions: MenuDescriptions;
  price: number;
  allergens: any[];
  sideDishes: SideDish[];
  supplements: Supplement[];
  hidden: boolean;
  order: number;
}

export interface SubCategory {
  id: string;
  names: MenuNames;
  menuItems: MenuItem[];
  hidden: boolean;
  order: number;
}

export interface Category {
  id: string;
  names: MenuNames;
  subCategories: SubCategory[];
  hidden: boolean;
  order: number;
}

export interface MenuData {
  categories: Category[];
  menuItems: MenuItem[]; // Flattened array of all menu items
  isLoading: boolean;
  error: string | null;
  isLoaded: boolean;
}
