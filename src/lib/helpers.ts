export function mapCategories(newCategories: any, parentCategoryId?: any) {
  const result: any = {};

  // Process main categories
  newCategories.forEach((mainCategory: any) => {
    const categoryId = mainCategory.id;

    result[categoryId] = {
      names: mainCategory.names,
      parentCategoryId: parentCategoryId ?? "",
      order: mainCategory.order,
    };
  });

  return result;
}

export function mapMenu(newMenu: any) {
  const result: any = {};

  // Process main categories
  newMenu.forEach((menu: any) => {
    const menuId = menu.id;

    result[menuId] = {
      names: menu.names,
      descriptions: menu.descriptions,
      categoryId: menu.category.id,
      allergenIds: menu.allergens.map((a: any) => a.id),
      sideDishIds: menu.sideDishes.map((s: any) => s.id),
      supplementIds: menu.supplements.map((s: any) => s.id),
      price: menu.price,
      order: menu.order,
      hidden: menu.hidden,
    };
  });

  return result;
}
