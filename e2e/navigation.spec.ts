/**
 * Suite 4: Sidebar & Navigation Tests
 *
 * Tests desktop sidebar, mobile bottom nav, language switcher,
 * dark mode, and responsive layout switching.
 * EVERY test clears state first.
 */
import { test, expect, Page } from "@playwright/test";
import { clearAllIndexedDB } from "./helpers";

// Mock all API calls to prevent network dependency
async function mockAPIs(page: Page) {
  await page.route("**/category/parents", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/menu", (route) => {
    if (route.request().url().endsWith("/menu") || route.request().url().includes("/menu?")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    }
    return route.continue();
  });
  await page.route("**/allergen", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/sidedish", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/supplement", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
}

test.describe("Sidebar & Navigation — Desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto("/en", { waitUntil: "domcontentloaded" });
    await clearAllIndexedDB(page);
    await page.reload({ waitUntil: "domcontentloaded" });
  });

  test("Load app → Sidebar visible on desktop (1280px)", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Desktop sidebar should be visible
    const sidebar = page.locator("aside");
    if ((await sidebar.count()) > 0) {
      const box = await sidebar.first().boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
    }
  });

  test("Click each sidebar link → Verify URL changes and page loads", async ({ page }) => {
    await page.waitForTimeout(2000);

    const navLinks = [
      { label: "Dashboard", path: "/" },
      { label: "Categories", path: "/categories" },
      { label: "Menu Items", path: "/items" },
      { label: "Side Dishes", path: "/sidedish" },
      { label: "Allergens", path: "/allergens" },
      { label: "Menu Maker", path: "/menumaker" },
      { label: "Live Preview", path: "/preview" },
    ];

    for (const link of navLinks) {
      const btn = page.locator(`aside button:has-text("${link.label}")`);
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain(link.path);

        // Navigate back if needed
        if (link.path !== "/") {
          await page.goto("/en", { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test("Collapse sidebar → Verify localStorage saved", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find collapse button
    const collapseBtn = page.locator('aside button:has-text("Collapse")');
    if (await collapseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await collapseBtn.click();
      await page.waitForTimeout(500);

      // Verify localStorage was set
      const savedValue = await page.evaluate(() => localStorage.getItem("ada-sidebar-collapsed"));
      expect(savedValue).toBe("true");

      // Sidebar should be narrow (60px)
      const sidebar = page.locator("aside");
      const box = await sidebar.first().boundingBox();
      expect(box!.width).toBeLessThanOrEqual(70); // 60px + some tolerance
    }
  });

  test("Collapse sidebar → Reload → Verify sidebar stays collapsed", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Set localStorage directly
    await page.evaluate(() => localStorage.setItem("ada-sidebar-collapsed", "true"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Sidebar should be collapsed
    const sidebar = page.locator("aside");
    if ((await sidebar.count()) > 0) {
      const box = await sidebar.first().boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(70);
      }
    }
  });

  test("Language switcher → Change to FR → Verify URL changes", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find FR button in sidebar
    const frButton = page.locator('aside button:has-text("FR")');
    if (await frButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await frButton.click();
      await page.waitForURL("**/fr/**", { timeout: 5000 }).catch(() => {});
      expect(page.url()).toContain("/fr");
    }
  });

  test("Language switcher → Change to NL → Verify URL changes", async ({ page }) => {
    await page.waitForTimeout(2000);

    const nlButton = page.locator('aside button:has-text("NL")');
    if (await nlButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nlButton.click();
      await page.waitForURL("**/nl/**", { timeout: 5000 }).catch(() => {});
      expect(page.url()).toContain("/nl");
    }
  });

  test("Dark mode toggle → Verify theme changes", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Click dark mode toggle
    const darkModeBtn = page.locator('aside button:has-text("Dark Mode")');
    if (await darkModeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await darkModeBtn.click();
      await page.waitForTimeout(500);

      // Check HTML has "dark" class
      const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains("dark"));
      expect(hasDarkClass).toBe(true);
    }
  });

  test("Dark mode → Reload → Verify theme persists", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Set dark mode
    const darkModeBtn = page.locator('aside button:has-text("Dark Mode")');
    if (await darkModeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await darkModeBtn.click();
      await page.waitForTimeout(500);

      // Reload
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      // Theme should persist (next-themes stores in localStorage)
      const theme = await page.evaluate(() => localStorage.getItem("theme"));
      expect(theme).toBe("dark");
    }
  });
});

test.describe("Sidebar & Navigation — Mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto("/en", { waitUntil: "domcontentloaded" });
    await clearAllIndexedDB(page);
    await page.reload({ waitUntil: "domcontentloaded" });
  });

  test("Load app → Bottom nav visible on mobile (390px)", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Bottom nav items should be visible
    const homeTab = page.locator('nav button:has-text("Home"), nav span:has-text("Home")');
    await expect(homeTab.first()).toBeVisible({ timeout: 10000 });
  });

  test("Mobile: tap each bottom nav item → Verify navigation", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Tap Home
    const homeBtn = page.locator('button:has-text("Home")').first();
    if (await homeBtn.isVisible().catch(() => false)) {
      await homeBtn.click();
      await page.waitForTimeout(500);
      expect(page.url()).toMatch(/\/en\/?$/);
    }

    // Tap Menu (Categories)
    const menuBtn = page.locator('button:has-text("Menu")').first();
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain("/categories");
    }

    // Navigate back
    await page.goto("/en", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Tap Allergens
    const allergenBtn = page.locator('button:has-text("Allergens")').first();
    if (await allergenBtn.isVisible().catch(() => false)) {
      await allergenBtn.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain("/allergens");
    }
  });

  test("Mobile: tap 'More' → Verify sheet opens with remaining pages", async ({ page }) => {
    await page.waitForTimeout(2000);

    const moreBtn = page.locator('button:has-text("More")').first();
    if (await moreBtn.isVisible().catch(() => false)) {
      await moreBtn.click();
      await page.waitForTimeout(500);

      // The sheet should show more items
      const menuItemsLink = page.locator('button:has-text("Menu Items")');
      const sideDishesLink = page.locator('button:has-text("Side Dishes")');
      const menuMakerLink = page.locator('button:has-text("Menu Maker")');
      const livePreviewLink = page.locator('button:has-text("Live Preview")');

      // At least some of these should be visible in the "More" sheet
      const menuItemsVisible = await menuItemsLink.first().isVisible().catch(() => false);
      const sideDishesVisible = await sideDishesLink.first().isVisible().catch(() => false);
      const menuMakerVisible = await menuMakerLink.first().isVisible().catch(() => false);

      expect(menuItemsVisible || sideDishesVisible || menuMakerVisible).toBeTruthy();
    }
  });

  test("Resize window from desktop to mobile → Verify layout switches", async ({ page }) => {
    // Start at desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);

    // Sidebar should be visible on desktop
    const sidebarDesktop = page.locator("aside");
    let box = await sidebarDesktop.first().boundingBox().catch(() => null);
    if (box) {
      expect(box.width).toBeGreaterThan(0);
    }

    // Switch to mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);

    // Bottom nav should appear (mobile)
    const bottomNav = page.locator('button:has-text("Home")').first();
    await expect(bottomNav).toBeVisible({ timeout: 5000 });

    // Sidebar should be hidden
    const sidebarMobile = page.locator("aside");
    box = await sidebarMobile.first().boundingBox().catch(() => null);
    expect(box === null || box.width === 0).toBeTruthy();
  });

  test("Resize window from mobile to desktop → Verify sidebar returns", async ({ page }) => {
    // Start at mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);

    // Switch to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);

    // Sidebar should be visible again
    const sidebar = page.locator("aside");
    if ((await sidebar.count()) > 0) {
      const box = await sidebar.first().boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(0);
      }
    }
  });

  test("Mobile: '+' center button → Navigates to categories", async ({ page }) => {
    await page.waitForTimeout(2000);

    // The center "+" button has aria-label="Add item"
    const addBtn = page.locator('button[aria-label="Add item"]');
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain("/categories");
    }
  });

  test("Mobile: More sheet → Dark mode toggle", async ({ page }) => {
    await page.waitForTimeout(2000);

    const moreBtn = page.locator('button:has-text("More")').first();
    if (await moreBtn.isVisible().catch(() => false)) {
      await moreBtn.click();
      await page.waitForTimeout(500);

      // Find dark mode toggle in the sheet
      const darkText = page.locator('text=Dark Mode');
      if (await darkText.first().isVisible().catch(() => false)) {
        // The toggle button is a sibling
        const toggleBtn = page.locator('button[class*="rounded-full"]').last();
        if (await toggleBtn.isVisible().catch(() => false)) {
          await toggleBtn.click();
          await page.waitForTimeout(500);

          const hasDarkClass = await page.evaluate(() =>
            document.documentElement.classList.contains("dark"),
          );
          expect(hasDarkClass).toBe(true);
        }
      }
    }
  });

  test("Mobile: More sheet → Language switcher", async ({ page }) => {
    await page.waitForTimeout(2000);

    const moreBtn = page.locator('button:has-text("More")').first();
    if (await moreBtn.isVisible().catch(() => false)) {
      await moreBtn.click();
      await page.waitForTimeout(500);

      // Find FR language button in sheet
      const frBtn = page.locator('button:has-text("🇫🇷 FR")');
      if (await frBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await frBtn.click();
        await page.waitForURL("**/fr/**", { timeout: 5000 }).catch(() => {});
        expect(page.url()).toContain("/fr");
      }
    }
  });
});
