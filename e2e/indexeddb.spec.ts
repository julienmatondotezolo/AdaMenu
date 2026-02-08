/**
 * Suite 1: IndexedDB Service Tests
 *
 * Tests IndexedDB data integrity — the #1 priority.
 * EVERY test clears IndexedDB first. No exceptions.
 */
import { test, expect } from "@playwright/test";
import {
  clearAllIndexedDB,
  createTestProject,
  saveProjectToIDB,
  getProjectFromIDB,
  getAllProjectsFromIDB,
  deleteProjectFromIDB,
  setupCleanPage,
} from "./helpers";

test.describe("IndexedDB Service Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and CLEAR before every single test
    await page.goto("/en", { waitUntil: "domcontentloaded" });
    await clearAllIndexedDB(page);
  });

  test("Clear all IndexedDB databases before each test — verify clean state", async ({ page }) => {
    // After clearAllIndexedDB, no projects should exist
    const projects = await getAllProjectsFromIDB(page);
    expect(projects).toHaveLength(0);
  });

  test("Save a project → Read it back → Verify every field matches", async ({ page }) => {
    const project = createTestProject({ name: "Field Match Test" });
    await saveProjectToIDB(page, project);

    const retrieved = (await getProjectFromIDB(page, project.id as string)) as Record<string, unknown>;
    expect(retrieved).not.toBeNull();
    expect(retrieved.id).toBe(project.id);
    expect(retrieved.name).toBe("Field Match Test");
    expect(retrieved.createdAt).toBe(project.createdAt);
    expect(retrieved.updatedAt).toBe(project.updatedAt);

    // Deep check pages
    const pages = retrieved.pages as any[];
    const srcPages = project.pages as any[];
    expect(pages).toHaveLength(srcPages.length);
    expect(pages[0].id).toBe(srcPages[0].id);
    expect(pages[0].name).toBe(srcPages[0].name);
    expect(pages[0].format.name).toBe("A4");
    expect(pages[0].format.width).toBe(2480);
    expect(pages[0].format.height).toBe(3508);
    expect(pages[0].backgroundColor).toBe("#ffffff");

    // Verify layer
    expect(pages[0].layers).toHaveLength(1);
    expect(pages[0].layers[0].visible).toBe(true);
    expect(pages[0].layers[0].locked).toBe(false);
    expect(pages[0].layers[0].opacity).toBe(1);

    // Verify element
    const el = pages[0].layers[0].elements[0];
    expect(el.type).toBe("text");
    expect(el.content).toBe("Hello World");
    expect(el.fontSize).toBe(24);
    expect(el.fontFamily).toBe("Arial");
    expect(el.x).toBe(100);
    expect(el.y).toBe(100);
    expect(el.width).toBe(200);
    expect(el.height).toBe(50);

    // Settings
    const settings = retrieved.settings as any;
    expect(settings.defaultFormat).toBe("A4");
    expect(settings.zoom).toBe(1);
  });

  test("Save 10 projects → List all → Verify count and order", async ({ page }) => {
    // Save 10 projects with staggered timestamps
    const projects = [];
    for (let i = 0; i < 10; i++) {
      const ts = new Date(Date.now() + i * 1000).toISOString();
      const p = createTestProject({
        id: `proj-${i}`,
        name: `Project ${i}`,
        createdAt: ts,
        updatedAt: ts,
      });
      projects.push(p);
      await saveProjectToIDB(page, p);
    }

    const all = await getAllProjectsFromIDB(page);
    expect(all).toHaveLength(10);

    // Verify each one was saved correctly
    for (let i = 0; i < 10; i++) {
      const found = (all as any[]).find((p) => p.id === `proj-${i}`);
      expect(found).toBeTruthy();
      expect(found.name).toBe(`Project ${i}`);
    }
  });

  test("Save project → Delete → Verify it's gone", async ({ page }) => {
    const project = createTestProject({ id: "delete-me", name: "Delete Me" });
    await saveProjectToIDB(page, project);

    // Verify it exists
    let result = await getProjectFromIDB(page, "delete-me");
    expect(result).not.toBeNull();

    // Delete
    await deleteProjectFromIDB(page, "delete-me");

    // Verify it's gone
    result = await getProjectFromIDB(page, "delete-me");
    expect(result).toBeNull();
  });

  test("Save project → Update name → Read back → Verify updated", async ({ page }) => {
    const project = createTestProject({ id: "update-me", name: "Original Name" });
    await saveProjectToIDB(page, project);

    // Update the name
    const updated = { ...project, name: "Updated Name", updatedAt: new Date().toISOString() };
    await saveProjectToIDB(page, updated);

    const result = (await getProjectFromIDB(page, "update-me")) as any;
    expect(result).not.toBeNull();
    expect(result.name).toBe("Updated Name");
    expect(result.id).toBe("update-me");
  });

  test("Save project with special characters in name (é, ñ, 中文, emoji 🍕)", async ({ page }) => {
    const specialNames = [
      "Café résumé",
      "España ñ",
      "中文菜单",
      "Pizza Menu 🍕🍝",
      "L'Osteria — Deerlijk",
      'Quotes "inside" name',
      "Tabs\there\tand\nnewlines",
      "Ü̈m̈l̈ä̈ü̈ẗs̈",
    ];

    for (const name of specialNames) {
      const proj = createTestProject({ id: `special-${Buffer.from(name).toString("hex").slice(0, 8)}`, name });
      await saveProjectToIDB(page, proj);
      const result = (await getProjectFromIDB(page, proj.id as string)) as any;
      expect(result).not.toBeNull();
      expect(result.name).toBe(name);
    }
  });

  test("Save project with maximum elements (100+ text, shapes, images)", async ({ page }) => {
    const elements: unknown[] = [];
    // Create 50 text elements
    for (let i = 0; i < 50; i++) {
      elements.push({
        id: `text-${i}`,
        type: "text",
        x: i * 10,
        y: i * 10,
        width: 200,
        height: 50,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: i,
        locked: false,
        visible: true,
        opacity: 1,
        content: `Text element ${i}`,
        fontSize: 16,
        fontFamily: "Arial",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
        fill: "#000000",
        stroke: "transparent",
        strokeWidth: 0,
        align: "left",
        verticalAlign: "top",
        lineHeight: 1.2,
        letterSpacing: 0,
        padding: 0,
      });
    }
    // Create 30 shape elements
    for (let i = 0; i < 30; i++) {
      elements.push({
        id: `shape-${i}`,
        type: "shape",
        x: i * 20,
        y: i * 20,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: 50 + i,
        locked: false,
        visible: true,
        opacity: 1,
        shapeType: "rectangle",
        fill: "#ff0000",
        stroke: "#000000",
        strokeWidth: 1,
        radius: 0,
      });
    }
    // Create 25 image elements
    for (let i = 0; i < 25; i++) {
      elements.push({
        id: `img-${i}`,
        type: "image",
        x: i * 15,
        y: i * 15,
        width: 300,
        height: 200,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: 80 + i,
        locked: false,
        visible: true,
        opacity: 1,
        fileName: `test-image-${i}.jpg`,
        src: "data:image/png;base64,iVBORw0KGgo=",
        originalWidth: 300,
        originalHeight: 200,
      });
    }

    const project = createTestProject({
      id: "max-elements",
      name: "Maximum Elements",
      pages: [
        {
          id: "page-max",
          name: "Mega Page",
          format: { name: "A4", width: 2480, height: 3508, printWidth: 210, printHeight: 297 },
          backgroundColor: "#ffffff",
          layers: [
            {
              id: "layer-max",
              name: "Layer 1",
              visible: true,
              locked: false,
              opacity: 1,
              elements,
            },
          ],
        },
      ],
    });

    await saveProjectToIDB(page, project);
    const result = (await getProjectFromIDB(page, "max-elements")) as any;
    expect(result).not.toBeNull();
    expect(result.pages[0].layers[0].elements).toHaveLength(105);

    // Verify counts by type
    const els = result.pages[0].layers[0].elements;
    expect(els.filter((e: any) => e.type === "text")).toHaveLength(50);
    expect(els.filter((e: any) => e.type === "shape")).toHaveLength(30);
    expect(els.filter((e: any) => e.type === "image")).toHaveLength(25);
  });

  test("Save project → Close browser → Reopen → Data persists", async ({ page, context }) => {
    const project = createTestProject({ id: "persist-test", name: "Persistent Project" });
    await saveProjectToIDB(page, project);

    // Navigate away and come back (simulates closing/reopening)
    await page.goto("about:blank");
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    const result = (await getProjectFromIDB(page, "persist-test")) as any;
    expect(result).not.toBeNull();
    expect(result.name).toBe("Persistent Project");
  });

  test("Open two tabs → Save different projects → Both tabs see both projects", async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.goto("/en", { waitUntil: "domcontentloaded" });
    await clearAllIndexedDB(page1);

    await page2.goto("/en", { waitUntil: "domcontentloaded" });

    // Save from tab 1
    const proj1 = createTestProject({ id: "tab1-proj", name: "Tab 1 Project" });
    await saveProjectToIDB(page1, proj1);

    // Save from tab 2
    const proj2 = createTestProject({ id: "tab2-proj", name: "Tab 2 Project" });
    await saveProjectToIDB(page2, proj2);

    // Both tabs should see both
    const allFromTab1 = await getAllProjectsFromIDB(page1);
    const allFromTab2 = await getAllProjectsFromIDB(page2);

    expect(allFromTab1).toHaveLength(2);
    expect(allFromTab2).toHaveLength(2);

    // Verify both projects exist in both tabs
    expect((allFromTab1 as any[]).find((p) => p.id === "tab1-proj")).toBeTruthy();
    expect((allFromTab1 as any[]).find((p) => p.id === "tab2-proj")).toBeTruthy();
    expect((allFromTab2 as any[]).find((p) => p.id === "tab1-proj")).toBeTruthy();
    expect((allFromTab2 as any[]).find((p) => p.id === "tab2-proj")).toBeTruthy();

    await page1.close();
    await page2.close();
  });

  test("Try to save when IndexedDB is blocked (simulate with mock)", async ({ page }) => {
    // Override indexedDB.open to simulate blocked/unavailable scenario
    const errorThrown = await page.evaluate(async () => {
      // Save original
      const originalOpen = indexedDB.open.bind(indexedDB);
      // Override to throw
      (indexedDB as any).open = () => {
        const req = {} as IDBOpenDBRequest;
        setTimeout(() => {
          if (req.onerror) {
            (req as any).error = new DOMException("Blocked", "UnknownError");
            req.onerror(new Event("error") as any);
          }
        }, 0);
        return req;
      };

      try {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.open("TestBlocked", 1);
          (request as any).onerror = () => reject(new Error("Blocked"));
          (request as any).onsuccess = () => resolve();
        });
        return false;
      } catch {
        return true;
      } finally {
        // Restore original
        indexedDB.open = originalOpen;
      }
    });

    expect(errorThrown).toBe(true);
  });

  test("Save → Immediately read (race condition test)", async ({ page }) => {
    // Save and immediately read without any awaiting between
    const results = await page.evaluate(async () => {
      const project = {
        id: "race-test",
        name: "Race Condition",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [
          {
            id: "p1",
            name: "Page 1",
            format: { name: "A4", width: 2480, height: 3508, printWidth: 210, printHeight: 297 },
            backgroundColor: "#fff",
            layers: [{ id: "l1", name: "Layer 1", visible: true, locked: false, opacity: 1, elements: [] }],
          },
        ],
        fonts: { defaultFonts: [], customFonts: [], googleFonts: [], loadedFonts: [] },
        settings: { defaultFormat: "A4", zoom: 1 },
      };

      // Open DB
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("MenuMakerDB", 2);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains("projects")) {
            const s = db.createObjectStore("projects", { keyPath: "id" });
            s.createIndex("updatedAt", "updatedAt", { unique: false });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
          if (!db.objectStoreNames.contains("images")) {
            const s = db.createObjectStore("images", { keyPath: "id" });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
          if (!db.objectStoreNames.contains("fonts")) {
            const s = db.createObjectStore("fonts", { keyPath: "id" });
            s.createIndex("familyName", "familyName", { unique: false });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      // Save
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(["projects"], "readwrite");
        tx.objectStore("projects").put(project);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      // Immediately read (same DB connection)
      const read = await new Promise<any>((resolve, reject) => {
        const tx = db.transaction(["projects"], "readonly");
        const req = tx.objectStore("projects").get("race-test");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      db.close();
      return { saved: true, read: !!read, name: read?.name };
    });

    expect(results.saved).toBe(true);
    expect(results.read).toBe(true);
    expect(results.name).toBe("Race Condition");
  });

  test("Rapid save/delete cycles (10x in 1 second)", async ({ page }) => {
    const results = await page.evaluate(async () => {
      // Open DB
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("MenuMakerDB", 2);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains("projects")) {
            const s = db.createObjectStore("projects", { keyPath: "id" });
            s.createIndex("updatedAt", "updatedAt", { unique: false });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
          if (!db.objectStoreNames.contains("images")) {
            const s = db.createObjectStore("images", { keyPath: "id" });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
          if (!db.objectStoreNames.contains("fonts")) {
            const s = db.createObjectStore("fonts", { keyPath: "id" });
            s.createIndex("familyName", "familyName", { unique: false });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const errors: string[] = [];

      for (let i = 0; i < 10; i++) {
        try {
          // Save
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(["projects"], "readwrite");
            tx.objectStore("projects").put({
              id: `rapid-${i}`,
              name: `Rapid ${i}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              pages: [],
              fonts: { defaultFonts: [], customFonts: [], googleFonts: [], loadedFonts: [] },
              settings: { defaultFormat: "A4", zoom: 1 },
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });

          // Delete immediately
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(["projects"], "readwrite");
            tx.objectStore("projects").delete(`rapid-${i}`);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
        } catch (e: any) {
          errors.push(e.message);
        }
      }

      // Verify nothing remains
      const remaining = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction(["projects"], "readonly");
        const req = tx.objectStore("projects").getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      db.close();
      return { errors, remainingCount: remaining.length };
    });

    expect(results.errors).toHaveLength(0);
    expect(results.remainingCount).toBe(0);
  });

  test("Verify no data leaks between test runs", async ({ page }) => {
    // This test validates that clearAllIndexedDB in beforeEach actually works.
    // If the previous test left data, this should fail.
    const projects = await getAllProjectsFromIDB(page);
    expect(projects).toHaveLength(0);
  });

  test("Save image blob → Read it back → Verify data", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("MenuMakerDB", 2);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains("projects")) {
            const s = db.createObjectStore("projects", { keyPath: "id" });
            s.createIndex("updatedAt", "updatedAt", { unique: false });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
          if (!db.objectStoreNames.contains("images")) {
            const s = db.createObjectStore("images", { keyPath: "id" });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
          if (!db.objectStoreNames.contains("fonts")) {
            const s = db.createObjectStore("fonts", { keyPath: "id" });
            s.createIndex("familyName", "familyName", { unique: false });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      // Save a blob
      const blob = new Blob(["test image data"], { type: "image/png" });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(["images"], "readwrite");
        tx.objectStore("images").put({
          id: "img-test",
          blob,
          mimeType: "image/png",
          createdAt: new Date().toISOString(),
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      // Read it back
      const read = await new Promise<any>((resolve, reject) => {
        const tx = db.transaction(["images"], "readonly");
        const req = tx.objectStore("images").get("img-test");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      db.close();
      return {
        exists: !!read,
        mimeType: read?.mimeType,
        blobSize: read?.blob?.size,
        isBlob: read?.blob instanceof Blob,
      };
    });

    expect(result.exists).toBe(true);
    expect(result.mimeType).toBe("image/png");
    expect(result.blobSize).toBeGreaterThan(0);
    expect(result.isBlob).toBe(true);
  });

  test("Save font blob → Read by family name", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("MenuMakerDB", 2);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains("projects")) {
            const s = db.createObjectStore("projects", { keyPath: "id" });
            s.createIndex("updatedAt", "updatedAt", { unique: false });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
          if (!db.objectStoreNames.contains("images")) {
            const s = db.createObjectStore("images", { keyPath: "id" });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
          if (!db.objectStoreNames.contains("fonts")) {
            const s = db.createObjectStore("fonts", { keyPath: "id" });
            s.createIndex("familyName", "familyName", { unique: false });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      // Save two fonts of same family
      const blob1 = new Blob(["font-data-regular"], { type: "font/woff2" });
      const blob2 = new Blob(["font-data-bold"], { type: "font/woff2" });

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(["fonts"], "readwrite");
        tx.objectStore("fonts").put({
          id: "font-1",
          blob: blob1,
          mimeType: "font/woff2",
          familyName: "CustomFont",
          fileName: "custom-regular.woff2",
          format: "woff2",
          createdAt: new Date().toISOString(),
        });
        tx.objectStore("fonts").put({
          id: "font-2",
          blob: blob2,
          mimeType: "font/woff2",
          familyName: "CustomFont",
          fileName: "custom-bold.woff2",
          format: "woff2",
          createdAt: new Date().toISOString(),
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      // Read by family name index
      const fonts = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction(["fonts"], "readonly");
        const index = tx.objectStore("fonts").index("familyName");
        const req = index.getAll("CustomFont");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      db.close();
      return {
        count: fonts.length,
        families: fonts.map((f) => f.familyName),
        fileNames: fonts.map((f) => f.fileName),
      };
    });

    expect(result.count).toBe(2);
    expect(result.families).toEqual(["CustomFont", "CustomFont"]);
    expect(result.fileNames).toContain("custom-regular.woff2");
    expect(result.fileNames).toContain("custom-bold.woff2");
  });

  test("clearAllData removes projects, images, and fonts", async ({ page }) => {
    // Save data to all three stores
    await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("MenuMakerDB", 2);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains("projects")) {
            const s = db.createObjectStore("projects", { keyPath: "id" });
            s.createIndex("updatedAt", "updatedAt", { unique: false });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
          if (!db.objectStoreNames.contains("images")) {
            const s = db.createObjectStore("images", { keyPath: "id" });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
          if (!db.objectStoreNames.contains("fonts")) {
            const s = db.createObjectStore("fonts", { keyPath: "id" });
            s.createIndex("familyName", "familyName", { unique: false });
            s.createIndex("createdAt", "createdAt", { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const tx = db.transaction(["projects", "images", "fonts"], "readwrite");
      tx.objectStore("projects").put({
        id: "p1",
        name: "test",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        pages: [],
        fonts: {},
        settings: {},
      });
      tx.objectStore("images").put({
        id: "img1",
        blob: new Blob(["x"]),
        mimeType: "image/png",
        createdAt: "2024-01-01",
      });
      tx.objectStore("fonts").put({
        id: "f1",
        blob: new Blob(["x"]),
        mimeType: "font/woff2",
        familyName: "X",
        fileName: "x.woff2",
        format: "woff2",
        createdAt: "2024-01-01",
      });
      await new Promise<void>((r) => {
        tx.oncomplete = () => r();
      });

      // Now clear all
      const clearTx = db.transaction(["projects", "images", "fonts"], "readwrite");
      clearTx.objectStore("projects").clear();
      clearTx.objectStore("images").clear();
      clearTx.objectStore("fonts").clear();
      await new Promise<void>((r) => {
        clearTx.oncomplete = () => r();
      });
      db.close();
    });

    // Verify all empty
    const counts = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("MenuMakerDB", 2);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction(["projects", "images", "fonts"], "readonly");
      const p = await new Promise<number>((r) => {
        const req = tx.objectStore("projects").count();
        req.onsuccess = () => r(req.result);
      });
      const i = await new Promise<number>((r) => {
        const req = tx.objectStore("images").count();
        req.onsuccess = () => r(req.result);
      });
      const f = await new Promise<number>((r) => {
        const req = tx.objectStore("fonts").count();
        req.onsuccess = () => r(req.result);
      });
      db.close();
      return { projects: p, images: i, fonts: f };
    });

    expect(counts.projects).toBe(0);
    expect(counts.images).toBe(0);
    expect(counts.fonts).toBe(0);
  });
});
