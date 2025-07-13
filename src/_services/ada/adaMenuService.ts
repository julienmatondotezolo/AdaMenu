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
  try {
    const responseCreateCategory: Response = await fetch(adaMenuUrl + `/category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify([categoryObject]),
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

export async function updateCategory({ categoryObject }: { categoryObject: any }): Promise<any> {
  try {
    const responseUpdateCategory: Response = await fetch(adaMenuUrl + `/category`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify(categoryObject),
    });

    if (responseUpdateCategory.ok) {
      return responseUpdateCategory.json();
    } else {
      return responseUpdateCategory;
    }
  } catch (error) {
    console.error("Impossible to update category:", error);
  }
}

export async function deleteCategory({ categoryId }: { categoryId: string }): Promise<any> {
  try {
    const responseDeleteCategory: Response = await fetch(adaMenuUrl + `/category`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify([categoryId]),
    });

    if (responseDeleteCategory.ok) {
      return responseDeleteCategory.ok;
    } else {
      return responseDeleteCategory;
    }
  } catch (error) {
    console.error("Impossible to delete category:", error);
  }
}

export const toggleCategoryVisibility = async ({ categoryId, hidden }: { categoryId: string; hidden: boolean }) => {
  try {
    const response = await fetch(`${adaMenuUrl}/category/${categoryId}/visibility`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hidden }),
    });

    if (!response.ok) {
      throw new Error("Failed to toggle category visibility");
    }

    return await response.json();
  } catch (error) {
    console.error("Error toggling category visibility:", error);
    throw error;
  }
};

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

export async function fetchMenuById({ menuId }: { menuId: string }): Promise<any> {
  try {
    const responseFetchMenuById: Response = await fetch(adaMenuUrl + `/menu-item/${menuId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
    });

    if (responseFetchMenuById.ok) {
      return responseFetchMenuById.json();
    } else {
      return responseFetchMenuById;
    }
  } catch (error) {
    console.error("Impossible to fetch menu item by id:", error);
  }
}

export async function createMenuItem({ menuObject }: { menuObject: any }): Promise<any> {
  try {
    const responseCreateMenu: Response = await fetch(adaMenuUrl + `/menu-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify([menuObject]),
    });

    if (responseCreateMenu.ok) {
      return responseCreateMenu.json();
    } else {
      return responseCreateMenu;
    }
  } catch (error) {
    console.error("Impossible to create menu item:", error);
  }
}

export async function updateMenuItem({ menuObject }: { menuObject: any }): Promise<any> {
  try {
    const responseCreateMenu: Response = await fetch(adaMenuUrl + `/menu-item`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify(menuObject),
    });

    if (responseCreateMenu.ok) {
      return responseCreateMenu.json();
    } else {
      return responseCreateMenu;
    }
  } catch (error) {
    console.error("Impossible to create menu item:", error);
  }
}

export async function deleteMenu({ menuId }: { menuId: string }): Promise<any> {
  try {
    const responseDeleteMenu: Response = await fetch(adaMenuUrl + `/menu-item`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify([menuId]),
    });

    if (responseDeleteMenu.ok) {
      return responseDeleteMenu.ok;
    } else {
      return responseDeleteMenu;
    }
  } catch (error) {
    console.error("Impossible to delete menu item:", error);
  }
}

export async function toggleMenuItemVisibility({ menuId, hidden }: { menuId: string; hidden: boolean }): Promise<any> {
  try {
    const responseToggleVisibility: Response = await fetch(adaMenuUrl + `/menu-item/${menuId}/visibility`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify({ hidden }),
    });

    if (responseToggleVisibility.ok) {
      return responseToggleVisibility.json();
    } else {
      return responseToggleVisibility;
    }
  } catch (error) {
    console.error("Impossible to toggle menu item visibility:", error);
  }
}

/* ========================================================================== */
/* =============================== ALLERGEN ================================= */
/* ========================================================================== */

export async function fetchAllergen(): Promise<any> {
  try {
    const responseAllergen: Response = await fetch(adaMenuUrl + `/allergen`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
    });

    if (responseAllergen.ok) {
      return responseAllergen.json();
    } else {
      return responseAllergen;
    }
  } catch (error) {
    console.error("Impossible to fetch allergen:", error);
  }
}

/* ========================================================================== */
/* ============================== SUPPLEMENT ================================ */
/* ========================================================================== */

export async function fetchSupplement(): Promise<any> {
  try {
    const responseSupplement: Response = await fetch(adaMenuUrl + `/supplement`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
    });

    if (responseSupplement.ok) {
      return responseSupplement.json();
    } else {
      return responseSupplement;
    }
  } catch (error) {
    console.error("Impossible to fetch supplement:", error);
  }
}

export async function createSauceItem({ itemObject }: { itemObject: any }): Promise<any> {
  try {
    const responseCreateMenu: Response = await fetch(adaMenuUrl + `/supplement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify([itemObject]),
    });

    if (responseCreateMenu.ok) {
      return responseCreateMenu.json();
    } else {
      return responseCreateMenu;
    }
  } catch (error) {
    console.error("Impossible to create sauce item:", error);
  }
}

export async function updateSauceItem({ itemObject }: { itemObject: any }): Promise<any> {
  try {
    const responseCreateMenu: Response = await fetch(adaMenuUrl + `/supplement`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify(itemObject),
    });

    if (responseCreateMenu.ok) {
      return responseCreateMenu.json();
    } else {
      return responseCreateMenu;
    }
  } catch (error) {
    console.error("Impossible to update sauce item:", error);
  }
}

export async function deleteSauceItem({ itemId }: { itemId: string }): Promise<any> {
  try {
    const responseDeleteMenu: Response = await fetch(adaMenuUrl + `/supplement`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify([itemId]),
    });

    if (responseDeleteMenu.ok) {
      return responseDeleteMenu.ok;
    } else {
      return responseDeleteMenu;
    }
  } catch (error) {
    console.error("Impossible to delete sauce item:", error);
  }
}

/* ========================================================================== */
/* =============================== SIDEDISH ================================= */
/* ========================================================================== */

export async function fetchSidedish(): Promise<any> {
  try {
    const responseSidedish: Response = await fetch(adaMenuUrl + `/sidedish`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
    });

    if (responseSidedish.ok) {
      return responseSidedish.json();
    } else {
      return responseSidedish;
    }
  } catch (error) {
    console.error("Impossible to fetch sidedish:", error);
  }
}

export async function createSidedishtem({ itemObject }: { itemObject: any }): Promise<any> {
  try {
    const responseCreateMenu: Response = await fetch(adaMenuUrl + `/sidedish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify([itemObject]),
    });

    if (responseCreateMenu.ok) {
      return responseCreateMenu.json();
    } else {
      return responseCreateMenu;
    }
  } catch (error) {
    console.error("Impossible to create sauce item:", error);
  }
}

export async function updateSidedishtem({ itemObject }: { itemObject: any }): Promise<any> {
  try {
    const responseCreateMenu: Response = await fetch(adaMenuUrl + `/sidedish`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify(itemObject),
    });

    if (responseCreateMenu.ok) {
      return responseCreateMenu.json();
    } else {
      return responseCreateMenu;
    }
  } catch (error) {
    console.error("Impossible to update sauce item:", error);
  }
}

export async function deleteSidedishtem({ itemId }: { itemId: string }): Promise<any> {
  try {
    const responseDeleteMenu: Response = await fetch(adaMenuUrl + `/sidedish`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${session.session.user.token}`,
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify([itemId]),
    });

    if (responseDeleteMenu.ok) {
      return responseDeleteMenu.json();
    } else {
      return responseDeleteMenu;
    }
  } catch (error) {
    console.error("Impossible to delete sauce item:", error);
  }
}
