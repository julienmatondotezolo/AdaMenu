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
