import { Page } from "@playwright/test";

/**
 * CRITICAL: Clear ALL IndexedDB databases before each test.
 * This is the #1 rule — stale data is the enemy.
 */
export async function clearAllIndexedDB(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Delete all IndexedDB databases
    if ("databases" in indexedDB) {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    }
    // Also specifically delete the MenuMakerDB we know about
    indexedDB.deleteDatabase("MenuMakerDB");

    // Clear localStorage and sessionStorage too
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Wait for IndexedDB to be ready and the service to be initialized.
 */
export async function waitForIndexedDB(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      return (
        typeof window !== "undefined" &&
        typeof indexedDB !== "undefined" &&
        (window as any).debugIndexedDB !== undefined
      );
    },
    { timeout: 15_000 },
  );
}

/**
 * Create a valid MenuProject object for testing.
 */
export function createTestProject(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const id = overrides.id ?? `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    name: (overrides.name as string) ?? "Test Project",
    createdAt: (overrides.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (overrides.updatedAt as string) ?? new Date().toISOString(),
    pages: (overrides.pages as unknown[]) ?? [
      {
        id: `page-${id}`,
        name: "Page 1",
        format: { name: "A4", width: 2480, height: 3508, printWidth: 210, printHeight: 297 },
        backgroundColor: "#ffffff",
        layers: [
          {
            id: `layer-${id}`,
            name: "Layer 1",
            visible: true,
            locked: false,
            opacity: 1,
            elements: [
              {
                id: `text-${id}`,
                type: "text",
                x: 100,
                y: 100,
                width: 200,
                height: 50,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                zIndex: 1,
                locked: false,
                visible: true,
                opacity: 1,
                content: "Hello World",
                fontSize: 24,
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
              },
            ],
          },
        ],
      },
    ],
    fonts: (overrides.fonts as unknown) ?? {
      defaultFonts: [],
      customFonts: [],
      googleFonts: [],
      loadedFonts: [],
    },
    settings: (overrides.settings as unknown) ?? {
      defaultFormat: "A4",
      zoom: 1,
    },
    ...overrides,
  };
}

/**
 * Navigate to the app and clear IndexedDB first.
 * This is the standard test preamble.
 */
export async function setupCleanPage(page: Page, path = "/en"): Promise<void> {
  // Navigate to the page first so we have a context for evaluate()
  await page.goto(path, { waitUntil: "domcontentloaded" });
  // Clear all IndexedDB
  await clearAllIndexedDB(page);
  // Reload to ensure clean state
  await page.reload({ waitUntil: "domcontentloaded" });
}

/**
 * Save a project directly into IndexedDB via page.evaluate().
 */
export async function saveProjectToIDB(page: Page, project: Record<string, unknown>): Promise<void> {
  await page.evaluate(async (proj) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("MenuMakerDB", 2);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("projects")) {
          const store = db.createObjectStore("projects", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("images")) {
          const store = db.createObjectStore("images", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("fonts")) {
          const store = db.createObjectStore("fonts", { keyPath: "id" });
          store.createIndex("familyName", "familyName", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(["projects"], "readwrite");
        const store = tx.objectStore("projects");
        store.put(proj);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(new Error("Failed to save project")); };
      };
      request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    });
  }, project);
}

/**
 * Read a project from IndexedDB.
 */
export async function getProjectFromIDB(page: Page, projectId: string): Promise<unknown> {
  return page.evaluate(async (id) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("MenuMakerDB", 2);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("projects")) {
          const store = db.createObjectStore("projects", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("images")) {
          const store = db.createObjectStore("images", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("fonts")) {
          const store = db.createObjectStore("fonts", { keyPath: "id" });
          store.createIndex("familyName", "familyName", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(["projects"], "readonly");
        const store = tx.objectStore("projects");
        const getReq = store.get(id);
        getReq.onsuccess = () => { db.close(); resolve(getReq.result || null); };
        getReq.onerror = () => { db.close(); reject(new Error("Failed to read")); };
      };
      request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    });
  }, projectId);
}

/**
 * Get all projects from IndexedDB.
 */
export async function getAllProjectsFromIDB(page: Page): Promise<unknown[]> {
  return page.evaluate(async () => {
    return new Promise<unknown[]>((resolve, reject) => {
      const request = indexedDB.open("MenuMakerDB", 2);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("projects")) {
          const store = db.createObjectStore("projects", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("images")) {
          const store = db.createObjectStore("images", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("fonts")) {
          const store = db.createObjectStore("fonts", { keyPath: "id" });
          store.createIndex("familyName", "familyName", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(["projects"], "readonly");
        const store = tx.objectStore("projects");
        const getAll = store.getAll();
        getAll.onsuccess = () => { db.close(); resolve(getAll.result); };
        getAll.onerror = () => { db.close(); reject(new Error("Failed to read all")); };
      };
      request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    });
  });
}

/**
 * Delete a project from IndexedDB.
 */
export async function deleteProjectFromIDB(page: Page, projectId: string): Promise<void> {
  await page.evaluate(async (id) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("MenuMakerDB", 2);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("projects")) {
          const store = db.createObjectStore("projects", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("images")) {
          const store = db.createObjectStore("images", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("fonts")) {
          const store = db.createObjectStore("fonts", { keyPath: "id" });
          store.createIndex("familyName", "familyName", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(["projects"], "readwrite");
        const store = tx.objectStore("projects");
        store.delete(id);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(new Error("Failed to delete")); };
      };
      request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    });
  }, projectId);
}

/**
 * Generate a test image file buffer (1x1 pixel).
 */
export function createTestImageBuffer(type: "jpeg" | "png" | "webp" = "png"): Buffer {
  // Minimal valid PNG: 1x1 pixel transparent
  if (type === "png") {
    return Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
  }
  // Minimal valid JPEG: 1x1 pixel white
  if (type === "jpeg") {
    return Buffer.from(
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsM" +
        "DhEQDhERHBcRExMTFxcWFxYWEhISHiEhIf/2wBDAQMEBAUEBQkFBQkfERERHx8fHx8fHx8fHx8fHx8f" +
        "Hx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=",
      "base64",
    );
  }
  // For webp, use png as fallback (Playwright handles it)
  return createTestImageBuffer("png");
}
