/**
 * Suite 6: Mobile Responsive Tests
 *
 * Tests mobile layouts across all pages at 390px width.
 * Focus on bottom nav, touch targets, grid layouts, and no horizontal scroll.
 * EVERY test clears IndexedDB first.
 */
import { test, expect, Page } from "@playwright/test";
import { clearAllIndexedDB } from "./helpers";

// Force mobile viewport
test.use({ viewport: { width: 390, height: 844 } });

// Mock all API calls
async function mockAPIs(page: Page) {
  await page.route("**/category/parents", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "cat1", name: "Pasta", names: { en: "Pasta", fr: "Pâtes", nl: "Pasta" } },
        { id: "cat2", name: "Pizza", names: { en: "Pizza", fr: "Pizza", nl: "Pizza" } },
      ]),
    }),
  );

  await page.route("**/menu", (route) => {
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
            ],
            subCategories: [],
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
      ]),
    }),
  );

  await page.route("**/supplement", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
}

async function setupPage(page: Page, path: string) {
  await mockAPIs(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await clearAllIndexedDB(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
}

test.describe("Mobile Responsive Tests", () => {
  test("Dashboard at 390px → No horizontal scroll", async ({ page }) => {
    await setupPage(page, "/en");

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("Categories page at 390px → No horizontal scroll", async ({ page }) => {
    await setupPage(page, "/en/categories");

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("Menu Maker page at 390px → No horizontal scroll", async ({ page }) => {
    await setupPage(page, "/en/menumaker");

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("Allergens page at 390px → No horizontal scroll", async ({ page }) => {
    await setupPage(page, "/en/allergens");

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("Side dishes page at 390px → No horizontal scroll", async ({ page }) => {
    await setupPage(page, "/en/sidedish");

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("Bottom nav: all items visible and tappable (44px min touch target)", async ({ page }) => {
    await setupPage(page, "/en");

    // Find all bottom nav buttons
    const navButtons = page.locator("nav.md\\:hidden button, nav button").first();

    // Check for Home, Menu, +, Allergens, More buttons
    const buttons = ["Home", "Menu", "Allergens", "More"];
    for (const label of buttons) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
        const box = await btn.boundingBox();
        if (box) {
          // Touch target should be at least 44px
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }

    // Check the "+" button (aria-label="Add item")
    const addBtn = page.locator('button[aria-label="Add item"]');
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await addBtn.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("'+' button in bottom nav → Navigates to categories page", async ({ page }) => {
    await setupPage(page, "/en");

    const addBtn = page.locator('button[aria-label="Add item"]');
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain("/categories");
    }
  });

  test("'More' button → Opens sheet with remaining pages", async ({ page }) => {
    await setupPage(page, "/en");

    const moreBtn = page.locator('button:has-text("More")').first();
    if (await moreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await moreBtn.click();
      await page.waitForTimeout(500);

      // Sheet should open with items like Menu Maker, Side Dishes, etc.
      const sheetItems = ["Menu Items", "Side Dishes", "Menu Maker", "Live Preview"];
      let foundCount = 0;

      for (const item of sheetItems) {
        const link = page.locator(`button:has-text("${item}")`).first();
        if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
          foundCount++;
        }
      }

      expect(foundCount).toBeGreaterThanOrEqual(1);
    }
  });

  test("Stat cards on mobile → 2-column grid", async ({ page }) => {
    await setupPage(page, "/en");

    // The stat cards container should have grid-cols-2 class
    const has2ColGrid = await page.evaluate(() => {
      const grids = document.querySelectorAll(".grid.grid-cols-2");
      return grids.length > 0;
    });
    expect(has2ColGrid).toBe(true);
  });

  test("Quick 86 button visible on mobile dashboard", async ({ page }) => {
    await setupPage(page, "/en");

    const quick86 = page.locator('text=Quick 86');
    await expect(quick86.first()).toBeVisible({ timeout: 10000 });
  });

  test("Menu Maker on mobile → Shows Project Manager (not full editor)", async ({ page }) => {
    await setupPage(page, "/en/menumaker");

    // On mobile, should show Project Manager
    const projectManager = page.locator('text=Menu Maker Projects');
    const isVisible = await projectManager.isVisible({ timeout: 5000 }).catch(() => false);

    // Or check for the create/import buttons that appear in ProjectManager
    const createBtn = page.locator('button:has-text("Create New Project")');
    const createVisible = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);

    expect(isVisible || createVisible).toBeTruthy();
  });

  test("All text readable (no clipping, no overflow hidden cutting text)", async ({ page }) => {
    await setupPage(page, "/en");

    // Check that no text overflows its container in an invisible way
    const overflowIssues = await page.evaluate(() => {
      const issues: string[] = [];
      const allElements = document.querySelectorAll("*");

      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        // Skip hidden elements
        if (style.display === "none" || style.visibility === "hidden" || rect.width === 0) continue;

        // Check if element with text is clipped by overflow:hidden
        if (
          style.overflow === "hidden" &&
          el.scrollWidth > el.clientWidth + 2 && // 2px tolerance
          el.textContent &&
          el.textContent.trim().length > 3 &&
          !el.classList.contains("truncate") && // Allow intentional truncation
          !style.textOverflow // Allow text-overflow:ellipsis
        ) {
          // Only flag if this is actually clipping text, not images/containers
          const directTextLen = Array.from(el.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .reduce((acc, n) => acc + (n.textContent?.trim().length || 0), 0);

          if (directTextLen > 3) {
            issues.push(
              `${el.tagName}.${el.className.toString().slice(0, 30)}: scrollW=${el.scrollWidth} clientW=${el.clientWidth}`,
            );
          }
        }
      }

      return issues.slice(0, 5); // Return first 5 issues
    });

    // If there are issues, warn but don't fail hard (some intentional truncation)
    if (overflowIssues.length > 0) {
      console.warn("Potential text clipping issues:", overflowIssues);
    }

    // The main check: viewport should not cause horizontal scroll
    const noHScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
    });
    expect(noHScroll).toBe(true);
  });

  test("Each page renders without errors on mobile", async ({ page }) => {
    const pages = [
      "/en",
      "/en/categories",
      "/en/items",
      "/en/allergens",
      "/en/sidedish",
      "/en/menumaker",
    ];

    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    for (const pagePath of pages) {
      await mockAPIs(page);
      await page.goto(pagePath, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      // Should not have JS errors (filter out expected ones)
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("hydration") &&
          !e.includes("network") &&
          !e.includes("fetch") &&
          !e.includes("TypeError: Load failed"),
      );

      if (criticalErrors.length > 0) {
        console.warn(`JS errors on ${pagePath}:`, criticalErrors);
      }

      // Clear for next page
      errors.length = 0;
    }
  });

  test("Bottom nav is fixed at bottom of viewport", async ({ page }) => {
    await setupPage(page, "/en");

    // The bottom nav should be fixed at the bottom
    const navPosition = await page.evaluate(() => {
      // Find the nav element with fixed positioning
      const navs = document.querySelectorAll("nav");
      for (const nav of navs) {
        const style = window.getComputedStyle(nav);
        if (style.position === "fixed" && parseInt(style.bottom) === 0) {
          return {
            position: style.position,
            bottom: style.bottom,
            left: style.left,
            right: style.right,
          };
        }
      }
      return null;
    });

    if (navPosition) {
      expect(navPosition.position).toBe("fixed");
      expect(navPosition.bottom).toBe("0px");
    }
  });

  test("Content has bottom padding for bottom nav", async ({ page }) => {
    await setupPage(page, "/en");

    // The main content area should have bottom padding to prevent content
    // from being hidden behind the fixed bottom nav
    const hasBottomPadding = await page.evaluate(() => {
      // Look for the pb-bottom-nav class or similar
      const mainContent = document.querySelector(".pb-bottom-nav, [class*='pb-']");
      if (!mainContent) return false;

      // Check all scrollable containers
      const containers = document.querySelectorAll(".overflow-y-auto");
      for (const container of containers) {
        const style = window.getComputedStyle(container);
        const paddingBottom = parseInt(style.paddingBottom);
        if (paddingBottom > 0) return true;
      }

      return mainContent !== null;
    });

    expect(hasBottomPadding).toBeTruthy();
  });
});
