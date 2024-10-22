const adaMenuUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;

/* ========================================================================== */
/* =============================== CATEGORY ================================= */
/* ========================================================================== */

export async function fetchCategories(): Promise<any> {
  try {
    const responseCategories: Response = await fetch(adaMenuUrl + `/category/parents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
    });

    if (responseCategories.ok) {
      return responseCategories.json();
    } else {
      throw responseCategories;
    }
  } catch (error) {
    console.error("Impossible to fetch categories:", error);
  }
}

export async function createCategory({ categoryObject }: { categoryObject: any }): Promise<any> {
  console.log("categoryObject:", categoryObject);
  try {
    const responseCreateCategory: Response = await fetch(adaMenuUrl + `/category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify(categoryObject),
    });

    if (responseCreateCategory.ok) {
      return responseCreateCategory.json();
    } else {
      return responseCreateCategory;
    }
  } catch (error) {
    console.error("Impossible to create category:", error);
  }
}

export async function deleteCategory({ categoryId }: { categoryId: string }): Promise<any> {
  try {
    const responseDeleteCategory: Response = await fetch(adaMenuUrl + `/category/${categoryId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
    });

    if (responseDeleteCategory.ok) {
      return responseDeleteCategory.json();
    } else {
      return responseDeleteCategory;
    }
  } catch (error) {
    console.error("Impossible to delete category:", error);
  }
}

/* ========================================================================== */
/* ================================= MENU =================================== */
/* ========================================================================== */

export async function fetchMenuItemByCategoryId({ categoryId }: { categoryId: string }): Promise<any> {
  try {
    const responseMenuItem: Response = await fetch(adaMenuUrl + `/menu-item/category/${categoryId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
    });

    if (responseMenuItem.ok) {
      return responseMenuItem.json();
    } else {
      return responseMenuItem;
    }
  } catch (error) {
    console.error("Impossible to fetch menu items:", error);
  }
}
