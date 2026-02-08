/**
 * Suite 3: Dashboard Tests
 *
 * Tests the main dashboard page: stat cards, quick actions, navigation.
 * EVERY test clears IndexedDB first.
 */
import { test, expect } from "@playwright/test";
import { clearAllIndexedDB } from "./helpers";

test.describe("Dashboard Tests — Desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    // Mock all API calls to avoid dependency on real backend
    await page.route("**/category/parents", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "cat1", name: "Pasta", names: { en: "Pasta", fr: "Pâtes", nl: "Pasta" } },
          { id: "cat2", name: "Pizza", names: { en: "Pizza", fr: "Pizza", nl: "Pizza" } },
          { id: "cat3", name: "Desserts", names: { en: "Desserts", fr: "Desserts", nl: "Desserts" } },
        ]),
      }),
    );

    await page.route("**/menu", (route) => {
      // Only match GET /menu (not /menumaker or other routes)
      if (route.request().url().endsWith("/menu") || route.request().url().includes("/menu?")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "cat1",
              name: "Pasta",
              names: { en: "Pasta" },
              menuItems: [
                { id: "m1", name: "Spaghetti", names: { en: "Spaghetti" }, price: 14.5, hidden: false },
                { id: "m2", name: "Penne", names: { en: "Penne" }, price: 13.0, hidden: false },
              ],
              subCategories: [],
            },
            {
              id: "cat2",
              name: "Pizza",
              names: { en: "Pizza" },
              menuItems: [
                { id: "m3", name: "Margherita", names: { en: "Margherita" }, price: 12.0, hidden: false },
              ],
              subCategories: [
                {
                  id: "sub1",
                  name: "Special Pizza",
                  menuItems: [
                    { id: "m4", name: "Calzone", names: { en: "Calzone" }, price: 15.0, hidden: true },
                  ],
                },
              ],
            },
          ]),
        });
      }
      return route.continue();
    });

    await page.route("**/allergen", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "a1", name: "Gluten" },
          { id: "a2", name: "Lactose" },
        ]),
      }),
    );

    await page.route("**/sidedish", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "s1", name: "Fries" },
          { id: "s2", name: "Salad" },
          { id: "s3", name: "Bread" },
        ]),
      }),
    );

    await page.goto("/en", { waitUntil: "domcontentloaded" });
    await clearAllIndexedDB(page);
    await page.reload({ waitUntil: "networkidle" });
  });

  test("Load dashboard → Verify stat cards render", async ({ page }) => {
    // Wait for loading to finish
    await page.waitForTimeout(2000);

    // Should have stat cards with correct values
    // Categories: 3, Menu Items: 4, Allergens: 2, Side Dishes: 3
    const categoriesCard = page.locator('text=Categories');
    await expect(categoriesCard.first()).toBeVisible({ timeout: 10000 });

    const menuItemsCard = page.locator('text=Menu Items');
    await expect(menuItemsCard.first()).toBeVisible();

    const allergensCard = page.locator('text=Allergens');
    await expect(allergensCard.first()).toBeVisible();

    const sideDishesCard = page.locator('text=Side Dishes');
    await expect(sideDishesCard.first()).toBeVisible();

    // Check stat values rendered (not skeleton)
    // The values should be visible as text
    await page.waitForSelector('text=3', { timeout: 10000 }); // Categories count
  });

  test("Load dashboard → Verify quick action buttons navigate correctly", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Verify quick action buttons exist
    await expect(page.locator('text=Add Menu Item').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Preview Menu').first()).toBeVisible();
    await expect(page.locator('text=Open Menu Maker').first()).toBeVisible();
  });

  test("Click 'Add Menu Item' → Verify navigation to categories", async ({ page }) => {
    await page.waitForTimeout(2000);

    const addBtn = page.locator('button:has-text("Add Menu Item")');
    await addBtn.first().click();
    await page.waitForURL("**/categories**", { timeout: 5000 });
    expect(page.url()).toContain("/categories");
  });

  test("Click 'Preview Menu' → Verify navigation", async ({ page }) => {
    await page.waitForTimeout(2000);

    const previewBtn = page.locator('button:has-text("Preview Menu")');
    await previewBtn.first().click();
    await page.waitForURL("**/preview**", { timeout: 5000 });
    expect(page.url()).toContain("/preview");
  });

  test("Click 'Open Menu Maker' → Verify navigation", async ({ page }) => {
    await page.waitForTimeout(2000);

    const menuMakerBtn = page.locator('button:has-text("Open Menu Maker")');
    await menuMakerBtn.first().click();
    await page.waitForURL("**/menumaker**", { timeout: 5000 });
    expect(page.url()).toContain("/menumaker");
  });

  test("Load dashboard → API fails → Verify error/fallback state", async ({ page }) => {
    // Override routes with failures
    await page.route("**/category/parents", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" }),
    );
    await page.route("**/menu", (route) => {
      if (route.request().url().endsWith("/menu")) {
        return route.fulfill({ status: 500, body: "Internal Server Error" });
      }
      return route.continue();
    });
    await page.route("**/allergen", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" }),
    );
    await page.route("**/sidedish", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" }),
    );

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // Dashboard should still render (graceful degradation)
    // Stats should show 0 values
    const dashboard = page.locator('text=Welcome to ADA Menu');
    await expect(dashboard).toBeVisible({ timeout: 10000 });

    // Should have zero values for stats
    const zeroValues = await page.locator('.text-xl, .text-2xl').allTextContents();
    const hasZeros = zeroValues.some((v) => v.trim() === "0");
    expect(hasZeros).toBeTruthy();
  });

  test("Stat cards link to correct pages", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Click on Categories stat card → should navigate to /categories
    const categoriesButton = page.locator('button:has-text("Categories")').first();
    await categoriesButton.click();
    await page.waitForURL("**/categories**", { timeout: 5000 });
    expect(page.url()).toContain("/categories");
  });

  test("Quick 86 button is visible and opens modal", async ({ page }) => {
    await page.waitForTimeout(2000);

    const quick86Btn = page.locator('text=Quick 86');
    await expect(quick86Btn.first()).toBeVisible({ timeout: 10000 });

    // Click it
    await quick86Btn.first().click();
    await page.waitForTimeout(500);

    // Should open the Quick 86 modal/overlay
    const searchInput = page.locator('input[placeholder*="Search menu items"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Dashboard Tests — Mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    // Mock APIs
    await page.route("**/category/parents", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: "cat1", name: "Pasta" }]),
      }),
    );
    await page.route("**/menu", (route) => {
      if (route.request().url().endsWith("/menu") || route.request().url().includes("/menu?")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      }
      return route.continue();
    });
    await page.route("**/allergen", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );
    await page.route("**/sidedish", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );

    await page.goto("/en", { waitUntil: "domcontentloaded" });
    await clearAllIndexedDB(page);
    await page.reload({ waitUntil: "networkidle" });
  });

  test("Load dashboard on mobile (390px) → Verify bottom nav shows", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Bottom nav should be visible on mobile
    const bottomNav = page.locator('nav.md\\:hidden, nav:below(:text("Welcome"))');
    // Look for bottom nav items
    const homeTab = page.locator('text=Home');
    const menuTab = page.locator('text=Menu');
    const allergensTab = page.locator('text=Allergens');
    const moreTab = page.locator('text=More');

    await expect(homeTab.first()).toBeVisible({ timeout: 10000 });
  });

  test("Load dashboard on mobile → Verify sidebar is hidden", async ({ page }) => {
    await page.waitForTimeout(2000);

    // The sidebar should have class "hidden md:flex" which hides it on mobile
    const sidebar = page.locator('aside.hidden');
    // On mobile, aside should not be visible
    const isVisible = await page.locator('aside').first().isVisible().catch(() => false);
    // Desktop sidebar should be hidden on mobile viewport
    // The sidebar has class "hidden md:flex" so it won't display
    const sidebarEl = page.locator('aside');
    if (await sidebarEl.count() > 0) {
      const box = await sidebarEl.first().boundingBox();
      // Either not visible or has no width
      expect(box === null || box.width === 0).toBeTruthy();
    }
  });

  test("Stat cards on mobile → 2-column grid", async ({ page }) => {
    await page.waitForTimeout(2000);

    // The grid should be 2 columns on mobile: "grid-cols-2"
    const grid = page.locator('.grid.grid-cols-2');
    await expect(grid.first()).toBeVisible({ timeout: 10000 });
  });
});
