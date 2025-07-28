/* eslint-disable no-console */
import { MenuProject } from "../types/menumaker";

interface ProjectInfo {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
  thumbnail?: string;
  firstPage?: any;
}

interface ImageBlob {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: string;
}

interface FontBlob {
  id: string;
  blob: Blob;
  mimeType: string;
  familyName: string;
  fileName: string;
  format: "woff" | "woff2" | "ttf" | "otf";
  createdAt: string;
}

class IndexedDBService {
  private dbName = "MenuMakerDB";
  private version = 2; // Incremented version for font support
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    // Prevent multiple simultaneous initialization
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.isInitialized && this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB not available in this environment"));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        const error = new Error(`Failed to open IndexedDB: ${request.error?.message || "Unknown error"}`);

        console.error("IndexedDB initialization error:", error);
        this.initPromise = null;
        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log("IndexedDB initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        console.log(`IndexedDB upgrade: ${oldVersion} -> ${this.version}`);

        // Create projects store
        if (!db.objectStoreNames.contains("projects")) {
          const projectStore = db.createObjectStore("projects", { keyPath: "id" });

          projectStore.createIndex("updatedAt", "updatedAt", { unique: false });
          projectStore.createIndex("createdAt", "createdAt", { unique: false });
          console.log("Created projects store");
        }

        // Create images store for blob storage
        if (!db.objectStoreNames.contains("images")) {
          const imageStore = db.createObjectStore("images", { keyPath: "id" });

          imageStore.createIndex("createdAt", "createdAt", { unique: false });
          console.log("Created images store");
        }

        // Create fonts store for custom font blob storage (new in version 2)
        if (oldVersion < 2 && !db.objectStoreNames.contains("fonts")) {
          const fontStore = db.createObjectStore("fonts", { keyPath: "id" });

          fontStore.createIndex("familyName", "familyName", { unique: false });
          fontStore.createIndex("createdAt", "createdAt", { unique: false });
          console.log("Created fonts store");
        }
      };
    });

    return this.initPromise;
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.isInitialized || !this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error("Failed to initialize IndexedDB");
    }
    return this.db;
  }

  // Project operations
  async saveProject(project: MenuProject): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["projects"], "readwrite");
      const store = transaction.objectStore("projects");
      const request = store.put(project);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to save project"));
    });
  }

  async getProject(projectId: string): Promise<MenuProject | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["projects"], "readonly");
      const store = transaction.objectStore("projects");
      const request = store.get(projectId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error("Failed to get project"));
    });
  }

  async getAllProjects(): Promise<ProjectInfo[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["projects"], "readonly");
      const store = transaction.objectStore("projects");
      const index = store.index("updatedAt");
      const request = index.openCursor(null, "prev"); // Sort by updatedAt descending

      const projects: ProjectInfo[] = [];

      request.onsuccess = () => {
        const cursor = request.result;

        if (cursor) {
          const project = cursor.value as MenuProject;

          projects.push({
            id: project.id,
            name: project.name,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            pageCount: project.pages.length,
            thumbnail: project.pages[0]?.thumbnail,
            firstPage: project.pages[0],
          });
          cursor.continue();
        } else {
          resolve(projects);
        }
      };

      request.onerror = () => reject(new Error("Failed to get all projects"));
    });
  }

  async getFirstProject(): Promise<MenuProject | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["projects"], "readonly");
      const store = transaction.objectStore("projects");
      const index = store.index("updatedAt");
      const request = index.openCursor(null, "prev"); // Get most recently updated

      request.onsuccess = () => {
        const cursor = request.result;

        if (cursor) {
          resolve(cursor.value as MenuProject);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(new Error("Failed to get first project"));
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["projects"], "readwrite");
      const store = transaction.objectStore("projects");
      const request = store.delete(projectId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete project"));
    });
  }

  async cleanupOldProjects(): Promise<void> {
    const projects = await this.getAllProjects();

    if (projects.length <= 5) {
      return; // Keep at least 5 projects
    }

    // Sort by updatedAt and remove oldest projects
    const projectsToRemove = projects.slice(5); // Remove all but the 5 most recent

    const db = await this.ensureDB();
    const transaction = db.transaction(["projects"], "readwrite");
    const store = transaction.objectStore("projects");

    for (const project of projectsToRemove) {
      store.delete(project.id);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.warn(`Cleaned up ${projectsToRemove.length} old projects to free storage space.`);
        resolve();
      };
      transaction.onerror = () => reject(new Error("Failed to cleanup old projects"));
    });
  }

  // Image operations
  async saveImage(imageId: string, blob: Blob): Promise<string> {
    const db = await this.ensureDB();

    const imageData: ImageBlob = {
      id: imageId,
      blob,
      mimeType: blob.type,
      createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["images"], "readwrite");
      const store = transaction.objectStore("images");
      const request = store.put(imageData);

      request.onsuccess = () => {
        // Return a blob URL that can be used immediately
        const url = URL.createObjectURL(blob);

        resolve(url);
      };
      request.onerror = () => reject(new Error("Failed to save image"));
    });
  }

  async getImage(imageId: string): Promise<string | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["images"], "readonly");
      const store = transaction.objectStore("images");
      const request = store.get(imageId);

      request.onsuccess = () => {
        const result = request.result as ImageBlob;

        if (result) {
          const url = URL.createObjectURL(result.blob);

          resolve(url);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new Error("Failed to get image"));
    });
  }

  async deleteImage(imageId: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["images"], "readwrite");
      const store = transaction.objectStore("images");
      const request = store.delete(imageId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete image"));
    });
  }

  async getAllImageIds(): Promise<string[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["images"], "readonly");
      const store = transaction.objectStore("images");
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };
      request.onerror = () => reject(new Error("Failed to get image IDs"));
    });
  }

  // Font operations
  async saveFont(
    fontId: string,
    blob: Blob,
    familyName: string,
    fileName: string,
    format: "woff" | "woff2" | "ttf" | "otf",
  ): Promise<string> {
    try {
      console.log(`Saving font to IndexedDB: ${fontId} (${familyName})`);
      const db = await this.ensureDB();

      const fontData: FontBlob = {
        id: fontId,
        blob,
        mimeType: blob.type,
        familyName,
        fileName,
        format,
        createdAt: new Date().toISOString(),
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(["fonts"], "readwrite");
        const store = transaction.objectStore("fonts");
        const request = store.put(fontData);

        request.onsuccess = () => {
          // Return a blob URL that can be used immediately
          const url = URL.createObjectURL(blob);

          console.log(`Font saved successfully: ${fontId} -> ${url}`);
          resolve(url);
        };

        request.onerror = () => {
          const error = new Error(`Failed to save font ${fontId}: ${request.error?.message || "Unknown error"}`);

          console.error("Font save error:", error);
          reject(error);
        };

        transaction.onerror = () => {
          const error = new Error(`Transaction failed while saving font ${fontId}`);

          console.error("Font save transaction error:", error);
          reject(error);
        };
      });
    } catch (error) {
      console.error(`Error in saveFont for ${fontId}:`, error);
      throw error;
    }
  }

  async getFont(fontId: string): Promise<string | null> {
    try {
      console.log(`Retrieving font from IndexedDB: ${fontId}`);
      const db = await this.ensureDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(["fonts"], "readonly");
        const store = transaction.objectStore("fonts");
        const request = store.get(fontId);

        request.onsuccess = () => {
          const result = request.result as FontBlob;

          if (result) {
            const url = URL.createObjectURL(result.blob);

            console.log(`Font retrieved successfully: ${fontId} -> ${url}`);
            resolve(url);
          } else {
            console.warn(`Font not found in IndexedDB: ${fontId}`);
            resolve(null);
          }
        };

        request.onerror = () => {
          const error = new Error(`Failed to get font ${fontId}: ${request.error?.message || "Unknown error"}`);

          console.error("Font retrieval error:", error);
          reject(error);
        };
      });
    } catch (error) {
      console.error(`Error in getFont for ${fontId}:`, error);
      throw error;
    }
  }

  async deleteFont(fontId: string): Promise<void> {
    try {
      console.log(`Deleting font from IndexedDB: ${fontId}`);
      const db = await this.ensureDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(["fonts"], "readwrite");
        const store = transaction.objectStore("fonts");
        const request = store.delete(fontId);

        request.onsuccess = () => {
          console.log(`Font deleted successfully: ${fontId}`);
          resolve();
        };

        request.onerror = () => {
          const error = new Error(`Failed to delete font ${fontId}: ${request.error?.message || "Unknown error"}`);

          console.error("Font deletion error:", error);
          reject(error);
        };
      });
    } catch (error) {
      console.error(`Error in deleteFont for ${fontId}:`, error);
      throw error;
    }
  }

  async getAllFontIds(): Promise<string[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["fonts"], "readonly");
      const store = transaction.objectStore("fonts");
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };
      request.onerror = () => reject(new Error("Failed to get font IDs"));
    });
  }

  async getFontsByFamily(familyName: string): Promise<FontBlob[]> {
    try {
      console.log(`Getting fonts by family: ${familyName}`);
      const db = await this.ensureDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(["fonts"], "readonly");
        const store = transaction.objectStore("fonts");
        const index = store.index("familyName");
        const request = index.getAll(familyName);

        request.onsuccess = () => {
          const results = request.result as FontBlob[];

          console.log(`Found ${results.length} fonts for family: ${familyName}`);
          resolve(results);
        };

        request.onerror = () => {
          const error = new Error(
            `Failed to get fonts by family ${familyName}: ${request.error?.message || "Unknown error"}`,
          );

          console.error("Font family retrieval error:", error);
          reject(error);
        };
      });
    } catch (error) {
      console.error(`Error in getFontsByFamily for ${familyName}:`, error);
      throw error;
    }
  }

  // Debug utilities
  async getAllFonts(): Promise<FontBlob[]> {
    try {
      const db = await this.ensureDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(["fonts"], "readonly");
        const store = transaction.objectStore("fonts");
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result as FontBlob[];

          console.log(`Total fonts in IndexedDB: ${results.length}`);
          resolve(results);
        };

        request.onerror = () => {
          const error = new Error(`Failed to get all fonts: ${request.error?.message || "Unknown error"}`);

          console.error("Get all fonts error:", error);
          reject(error);
        };
      });
    } catch (error) {
      console.error("Error in getAllFonts:", error);
      throw error;
    }
  }

  async debugIndexedDB(): Promise<{
    isSupported: boolean;
    isInitialized: boolean;
    dbName: string;
    version: number;
    stores: string[];
    fontCount: number;
    fonts: { id: string; familyName: string; fileName: string; size: number }[];
  }> {
    const debug = {
      isSupported: typeof window !== "undefined" && typeof indexedDB !== "undefined",
      isInitialized: this.isInitialized,
      dbName: this.dbName,
      version: this.version,
      stores: [] as string[],
      fontCount: 0,
      fonts: [] as { id: string; familyName: string; fileName: string; size: number }[],
    };

    try {
      if (debug.isSupported && debug.isInitialized && this.db) {
        debug.stores = Array.from(this.db.objectStoreNames);

        if (debug.stores.includes("fonts")) {
          const allFonts = await this.getAllFonts();

          debug.fontCount = allFonts.length;
          debug.fonts = allFonts.map((font) => ({
            id: font.id,
            familyName: font.familyName,
            fileName: font.fileName,
            size: font.blob.size,
          }));
        }
      }
    } catch (error) {
      console.error("Error during IndexedDB debug:", error);
    }

    return debug;
  }

  // Clear all fonts (for testing)
  async clearAllFonts(): Promise<void> {
    try {
      console.log("Clearing all fonts from IndexedDB");
      const db = await this.ensureDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(["fonts"], "readwrite");
        const store = transaction.objectStore("fonts");
        const request = store.clear();

        request.onsuccess = () => {
          console.log("All fonts cleared successfully");
          resolve();
        };

        request.onerror = () => {
          const error = new Error(`Failed to clear fonts: ${request.error?.message || "Unknown error"}`);

          console.error("Clear fonts error:", error);
          reject(error);
        };
      });
    } catch (error) {
      console.error("Error in clearAllFonts:", error);
      throw error;
    }
  }

  // Utility methods
  async getStorageEstimate(): Promise<{ quota?: number; usage?: number }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      return await navigator.storage.estimate();
    }
    return {};
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();

    const transaction = db.transaction(["projects", "images", "fonts"], "readwrite");
    const projectStore = transaction.objectStore("projects");
    const imageStore = transaction.objectStore("images");
    const fontStore = transaction.objectStore("fonts");

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = projectStore.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Failed to clear projects"));
      }),
      new Promise<void>((resolve, reject) => {
        const request = imageStore.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Failed to clear images"));
      }),
      new Promise<void>((resolve, reject) => {
        const request = fontStore.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Failed to clear fonts"));
      }),
    ]);
  }
}

// Create singleton instance
export const indexedDBService = new IndexedDBService();

// Initialize the service when in browser environment
if (typeof window !== "undefined") {
  indexedDBService
    .init()
    .then(() => {
      console.log("IndexedDBService initialized successfully");

      // Add global debug helper
      if (typeof window !== "undefined") {
        (window as any).debugIndexedDB = async () => {
          const debug = await indexedDBService.debugIndexedDB();

          console.log("IndexedDB Debug Info:", debug);
          return debug;
        };
      }
    })
    .catch((error) => {
      console.error("Failed to initialize IndexedDBService:", error);
    });
}
