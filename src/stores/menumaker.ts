/* eslint-disable indent */
/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
import { toast } from "sonner";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { drawMenuItemsList } from "../components/menumaker/utils/drawMenuItemsList";
import { fontService } from "../lib/fontService";
import { indexedDBService } from "../lib/indexedDBService";
import { Category, MenuData } from "../types/adamenudata";
import { CustomFontFile, DEFAULT_FONTS, EditorState, GoogleFont, Layer, MenuElement, MenuPage, MenuProject, PAGE_FORMATS, ProjectFont, ShapeType, Tool } from "../types/menumaker";

interface MenuMakerStore {
  // Project state
  project: MenuProject | null;
  currentPageId: string | null;
  editorState: EditorState;
  isExportingPDF: boolean;
  isSaving: boolean;
  exportProgress: number;
  saveSuccess: boolean;

  // Preview state
  isPreviewMode: boolean;
  layersLockedBeforePreview: Record<string, boolean>;

  // Shape selector state
  selectedShapeType: ShapeType | null;

  // Menu data state
  menuData: MenuData;

  // Actions for project management
  createProject: (name: string, format?: string, customWidth?: number, customHeight?: number) => Promise<void>;
  loadProject: (project: MenuProject) => void;
  saveProject: () => void;
  clearProject: () => void;
  cleanupOldProjects: () => void;
  updateProjectName: (name: string) => void;
  exportToPDF: () => Promise<void>;
  setExportProgress: (progress: number) => void;

  // Actions for menu data management
  setMenuData: (categories: Category[]) => void;
  setMenuLoading: (isLoading: boolean) => void;
  setMenuError: (error: string | null) => void;
  clearMenuData: () => void;
  refreshDataElements: () => void;

  // Actions for preview rendering
  generatePreviewImages: () => Promise<string[]>;

  // Actions for page management
  addPage: (format?: string) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  setCurrentPage: (pageId: string) => void;
  updatePageName: (pageId: string, name: string) => void;
  updatePageFormat: (pageId: string, format: string, customWidth?: number, customHeight?: number) => void;
  updatePageBackground: (pageId: string, backgroundColor?: string, backgroundImage?: string, backgroundImageOpacity?: number, backgroundImageId?: string) => void;

  // Actions for layer management
  addLayer: (pageId: string, name: string) => void;
  deleteLayer: (pageId: string, layerId: string) => void;
  duplicateLayer: (pageId: string, layerId: string) => void;
  updateLayerName: (pageId: string, layerId: string, name: string) => void;
  updateLayerVisibility: (pageId: string, layerId: string, visible: boolean) => void;
  updateLayerLock: (pageId: string, layerId: string, locked: boolean) => void;
  updateLayerOpacity: (pageId: string, layerId: string, opacity: number) => void;
  reorderLayers: (pageId: string, fromIndex: number, toIndex: number) => void;

  // Actions for element management
  addElement: (pageId: string, layerId: string, element: Omit<MenuElement, "id">) => string;
  updateElement: (pageId: string, layerId: string, elementId: string, updates: Partial<MenuElement>) => void;
  deleteElement: (pageId: string, layerId: string, elementId: string) => void;
  duplicateElement: (pageId: string, layerId: string, elementId: string) => void;
  moveElement: (pageId: string, fromLayerId: string, toLayerId: string, elementId: string) => void;
  reorderElements: (pageId: string, layerId: string, fromIndex: number, toIndex: number) => void;

  // Actions for selection and tools
  setTool: (tool: Tool) => void;
  selectElements: (elementIds: string[]) => void;
  selectLayer: (layerId: string | null) => void;
  setHoveredElement: (elementId: string | null) => void;
  clearSelection: () => void;
  setSelectedShapeType: (shapeType: ShapeType | null) => void;

  // Actions for canvas manipulation
  setZoom: (zoom: number) => void;
  setCanvasOffset: (offsetX: number, offsetY: number) => void;
  resetCanvasView: () => void;

  // Actions for UI state
  setSidebarWidth: (width: number) => void;
  toggleThumbnailsPanel: () => void;
  toggleLayersPanel: () => void;
  togglePropertiesPanel: () => void;

  // Actions for preview mode
  togglePreviewMode: () => void;
  setPreviewMode: (isPreview: boolean) => void;

  // Actions for history (undo/redo)
  undo: () => void;
  redo: () => void;
  addToHistory: () => void;

  // Actions for clipboard
  copy: () => void;
  cut: () => void;
  paste: () => void;

  // Actions for font management
  loadProjectFonts: () => Promise<void>;
  addGoogleFont: (googleFont: GoogleFont) => Promise<void>;
  addCustomFont: (fontFile: File) => Promise<CustomFontFile | null>;
  removeFont: (fontId: string) => Promise<void>;
  getAllAvailableFonts: () => ProjectFont[];
  ensureFontLoaded: (font: ProjectFont) => Promise<boolean>;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultLayer = (name: string = "Layer 1"): Layer => ({
  id: generateId(),
  name,
  visible: true,
  locked: false,
  opacity: 1,
  elements: [],
});

const createDefaultPage = (format: string = "A4"): MenuPage => ({
  id: generateId(),
  name: "Page 1",
  format: PAGE_FORMATS[format],
  backgroundColor: "#ffffff",
  layers: [createDefaultLayer()],
});

const createDefaultProject = (name: string): MenuProject => ({
  id: generateId(),
  name,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pages: [createDefaultPage()],
  fonts: {
    defaultFonts: [...DEFAULT_FONTS],
    customFonts: [],
    googleFonts: [],
    loadedFonts: new Set(),
  },
  settings: {
    defaultFormat: "A4",
    zoom: 1,
  },
});

const createDefaultEditorState = (): EditorState => ({
  tool: "select",
  selectedElementIds: [],
  selectedLayerId: null,
  hoveredElementId: null,
  clipboard: [],
  history: {
    past: [],
    present: createDefaultPage(),
    future: [],
  },
  canvas: {
    zoom: 0.25,
    offsetX: 0,
    offsetY: 0,
    width: 800,
    height: 600,
  },
  ui: {
    sidebarWidth: 300,
    thumbnailsPanelOpen: true,
    layersPanelOpen: true,
    propertiesPanelOpen: true,
  },
});

export const useMenuMakerStore = create<MenuMakerStore>()(
  subscribeWithSelector((set, get) => ({
    project: null,
    currentPageId: null,
    editorState: createDefaultEditorState(),
    isExportingPDF: false,
    isSaving: false,
    exportProgress: 0,
    saveSuccess: false,

    // Preview state
    isPreviewMode: false,
    layersLockedBeforePreview: {},

    // Shape selector state
    selectedShapeType: null,

    // Menu data state
    menuData: {
      categories: [],
      menuItems: [],
      isLoading: false,
      error: null,
      isLoaded: false,
    },

    createProject: async (name: string, format?: string, customWidth?: number, customHeight?: number) => {
      const selectedFormat = format || "A4";
      let pageFormat = PAGE_FORMATS[selectedFormat];

      // Handle custom format
      if (selectedFormat === "CUSTOM" && customWidth && customHeight) {
        pageFormat = {
          name: "Custom",
          width: Math.round(customWidth * 11.81), // Convert mm to pixels at 300 DPI
          height: Math.round(customHeight * 11.81),
          printWidth: customWidth,
          printHeight: customHeight,
        };
      }

      const project = createDefaultProject(name);
      // Update the first page with the selected format

      project.pages[0].format = pageFormat;

      set({
        project,
        currentPageId: project.pages[0].id,
        editorState: {
          ...get().editorState,
          history: {
            past: [],
            present: project.pages[0],
            future: [],
          },
        },
      });

      // Load default fonts immediately
      try {
        await get().loadProjectFonts();
      } catch (error) {
        console.error('Failed to load default fonts:', error);
      }
    },

    loadProject: async (project: MenuProject) => {
      // Load image blobs for all image elements and background images
      const updatedProject = { ...project };
      
      // Ensure project has fonts property (for backward compatibility)
      if (!updatedProject.fonts) {
        updatedProject.fonts = {
          defaultFonts: [...DEFAULT_FONTS],
          customFonts: [],
          googleFonts: [],
          loadedFonts: new Set(),
        };
      }
      
      for (const page of updatedProject.pages) {
        // Load background image if it has a backgroundImageId
        if (page.backgroundImageId) {
          try {
            const blobUrl = await indexedDBService.getImage(page.backgroundImageId);

            if (blobUrl) {
              page.backgroundImage = blobUrl;
            }
          } catch (error) {
            console.warn(`Failed to load background image ${page.backgroundImageId}:`, error);
          }
        }

        // Load element images
        for (const layer of page.layers) {
          for (const element of layer.elements) {
            if (element.type === "image" && (element as any).imageId) {
              try {
                const blobUrl = await indexedDBService.getImage((element as any).imageId);

                if (blobUrl) {
                  (element as any).src = blobUrl;
                }
              } catch (error) {
                console.warn(`Failed to load image ${(element as any).imageId}:`, error);
              }
            }
          }
        }
      }

      set({
        project: updatedProject,
        currentPageId: updatedProject.pages[0]?.id || null,
        editorState: {
          ...get().editorState,
          history: {
            past: [],
            present: updatedProject.pages[0] || createDefaultPage(),
            future: [],
          },
        },
      });

      // Load project fonts
      try {
        await get().loadProjectFonts();
      } catch (error) {
        console.error('Failed to load project fonts:', error);
      }

      // Refresh data elements after loading the project
      // Use setTimeout to ensure the project is fully loaded first
      setTimeout(() => {
        const { refreshDataElements } = get();

        refreshDataElements();
      }, 100);
    },

    saveProject: async () => {
      const { project } = get();

      if (project) {
        // Set saving state to true and reset success state
        set({ isSaving: true, saveSuccess: false });

        // Simulate 1 seconds of saving time
        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedProject = {
          ...project,
          updatedAt: new Date().toISOString(),
        };

        try {
          await indexedDBService.saveProject(updatedProject);
          
          // Show success state
          set({ project: updatedProject, isSaving: false, saveSuccess: true });
          
          // Hide success state after 2 seconds
          setTimeout(() => {
            set({ saveSuccess: false });
          }, 2000);
          
        } catch (error) {
          console.error('Failed to save project:', error);
          
          // Try to clean up old projects and retry
          try {
            await get().cleanupOldProjects();
            await indexedDBService.saveProject(updatedProject);
            
            // Show success state
            set({ project: updatedProject, isSaving: false, saveSuccess: true });
            
            // Hide success state after 3 seconds
            setTimeout(() => {
              set({ saveSuccess: false });
            }, 3000);
            
            console.warn('Project saved successfully after cleanup.');
          } catch (retryError) {
            console.error('Failed to save project even after cleanup:', retryError);
            alert('Storage full! Please delete some old projects to continue saving.');
            set({ isSaving: false, saveSuccess: false });
          }
        }
      }
    },

    clearProject: () => {
      set({
        project: null,
        currentPageId: null,
        editorState: createDefaultEditorState(),
      });
    },

    cleanupOldProjects: async () => {
      try {
        await indexedDBService.cleanupOldProjects();
      } catch (error) {
        console.error('Failed to cleanup old projects:', error);
      }
    },

    updateProjectName: async (name: string) => {
      const { project } = get();

      if (project) {
        const updatedProject = {
            ...project,
            name,
            updatedAt: new Date().toISOString(),
        };

        try {
          await indexedDBService.saveProject(updatedProject);
          set({ project: updatedProject });
        } catch (error) {
          console.error('Failed to update project name:', error);
        }
      }
    },

    addPage: (format?: string) => {
      const { project, currentPageId } = get();

      if (project) {
        // Use provided format, or current page format, or first page format, or fallback to A4
        let pageFormat = format;

        if (!pageFormat) {
          const currentPage = project.pages.find((page) => page.id === currentPageId);
          const referencePage = currentPage || project.pages[0];

          if (referencePage?.format) {
            // Create new page with the same format as the reference page
            const newPage: MenuPage = {
              id: generateId(),
              name: `Page ${project.pages.length + 1}`,
              format: referencePage.format, // Use the exact format object
              backgroundColor: "#ffffff",
              layers: [createDefaultLayer()],
            };

            const updatedProject = {
              ...project,
              pages: [...project.pages, newPage],
              updatedAt: new Date().toISOString(),
            };

            set({
              project: updatedProject,
              currentPageId: newPage.id,
            });
            return;
          }
          pageFormat = "A4"; // Final fallback
        }

        const newPage = createDefaultPage(pageFormat);

        newPage.name = `Page ${project.pages.length + 1}`;
        const updatedProject = {
          ...project,
          pages: [...project.pages, newPage],
          updatedAt: new Date().toISOString(),
        };

        set({
          project: updatedProject,
          currentPageId: newPage.id,
        });
      }
    },

    deletePage: (pageId: string) => {
      const { project, currentPageId } = get();

      if (project && project.pages.length > 1) {
        const updatedPages = project.pages.filter((page) => page.id !== pageId);
        const newCurrentPageId = currentPageId === pageId ? updatedPages[0]?.id || null : currentPageId;

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
          currentPageId: newCurrentPageId,
        });
      }
    },

    duplicatePage: (pageId: string) => {
      const { project } = get();

      if (project) {
        const pageIndex = project.pages.findIndex((page) => page.id === pageId);

        if (pageIndex !== -1) {
          const originalPage = project.pages[pageIndex];
          const duplicatedPage = {
            ...JSON.parse(JSON.stringify(originalPage)),
            id: generateId(),
            name: `${originalPage.name} Copy`,
          };

          const updatedPages = [...project.pages];

          updatedPages.splice(pageIndex + 1, 0, duplicatedPage);

          set({
            project: {
              ...project,
              pages: updatedPages,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      }
    },

    reorderPages: (fromIndex: number, toIndex: number) => {
      const { project } = get();

      if (project && fromIndex !== toIndex) {
        const updatedPages = [...project.pages];
        const [movedPage] = updatedPages.splice(fromIndex, 1);

        updatedPages.splice(toIndex, 0, movedPage);

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    setCurrentPage: (pageId: string) => {
      const { project } = get();

      if (project) {
        const page = project.pages.find((p) => p.id === pageId);

        if (page) {
          set({
            currentPageId: pageId,
            editorState: {
              ...get().editorState,
              history: {
                past: [],
                present: page,
                future: [],
              },
              selectedElementIds: [],
              selectedLayerId: null,
            },
          });
        }
      }
    },

    updatePageName: (pageId: string, name: string) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => (page.id === pageId ? { ...page, name } : page));

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    updatePageFormat: (pageId: string, format: string, customWidth?: number, customHeight?: number) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            const newFormat =
              format === "CUSTOM" && customWidth && customHeight
                ? { ...PAGE_FORMATS.CUSTOM, width: customWidth, height: customHeight }
                : PAGE_FORMATS[format];

            return {
              ...page,
              format: newFormat,
              customWidth,
              customHeight,
            };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    updatePageBackground: (pageId: string, backgroundColor?: string, backgroundImage?: string, backgroundImageOpacity?: number, backgroundImageId?: string) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) =>
          page.id === pageId
            ? {
              ...page,
              backgroundColor: backgroundColor !== undefined ? backgroundColor : page.backgroundColor,
              backgroundImage: backgroundImage !== undefined ? (backgroundImage || undefined) : page.backgroundImage,
              backgroundImageId: backgroundImageId !== undefined ? backgroundImageId : page.backgroundImageId,
              backgroundImageOpacity: backgroundImage === "" ? 1 : (backgroundImageOpacity !== undefined ? backgroundImageOpacity : page.backgroundImageOpacity ?? 1),
            }
            : page,
        );

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    addLayer: (pageId: string, name: string) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            const newLayer = createDefaultLayer(name);

            return {
              ...page,
              layers: [...page.layers, newLayer],
            };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    deleteLayer: (pageId: string, layerId: string) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId && page.layers.length > 1) {
            return {
              ...page,
              layers: page.layers.filter((layer) => layer.id !== layerId),
            };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    duplicateLayer: (pageId: string, layerId: string) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            const layerIndex = page.layers.findIndex((layer) => layer.id === layerId);

            if (layerIndex !== -1) {
              const originalLayer = page.layers[layerIndex];
              const duplicatedLayer = JSON.parse(JSON.stringify(originalLayer)) as Layer;
              
              // Generate new ID for the layer
              duplicatedLayer.id = generateId();
              duplicatedLayer.name = `${originalLayer.name} Copy`;
              
              // Generate new IDs for all elements in the duplicated layer
              duplicatedLayer.elements = duplicatedLayer.elements.map((element: MenuElement) => ({
                ...element,
                id: generateId(),
              }));

              const updatedLayers = [...page.layers];

              updatedLayers.splice(layerIndex + 1, 0, duplicatedLayer);

              return { ...page, layers: updatedLayers };
            }
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    updateLayerName: (pageId: string, layerId: string, name: string) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              layers: page.layers.map((layer) => (layer.id === layerId ? { ...layer, name } : layer)),
            };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    updateLayerVisibility: (pageId: string, layerId: string, visible: boolean) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              layers: page.layers.map((layer) => (layer.id === layerId ? { ...layer, visible } : layer)),
            };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    updateLayerLock: (pageId: string, layerId: string, locked: boolean) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              layers: page.layers.map((layer) => (layer.id === layerId ? { ...layer, locked } : layer)),
            };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    updateLayerOpacity: (pageId: string, layerId: string, opacity: number) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              layers: page.layers.map((layer) => (layer.id === layerId ? { ...layer, opacity } : layer)),
            };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    reorderLayers: (pageId: string, fromIndex: number, toIndex: number) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            const layers = [...page.layers];
            const [removed] = layers.splice(fromIndex, 1);

            layers.splice(toIndex, 0, removed);
            return { ...page, layers };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    addElement: (pageId: string, layerId: string, element: Omit<MenuElement, "id">) => {
      const { project } = get();

      if (project) {
        const newElementId = generateId();
        const newElement: MenuElement = { ...element, id: newElementId } as MenuElement;

        let targetLayerId = layerId;
        let needsNewLayer = false;

        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            // Find the target layer
            const targetLayer = page.layers.find(layer => layer.id === layerId);
            
            // If target layer is locked or hidden, find first unlocked and visible layer
            if (targetLayer?.locked || !targetLayer?.visible) {
              const availableLayer = page.layers.find(layer => !layer.locked && layer.visible);

              if (availableLayer) {
                targetLayerId = availableLayer.id;
              } else {
                // All layers are locked or hidden, we need to create a new layer
                needsNewLayer = true;
              }
            }

            let updatedLayers = [...page.layers];

            // Create new layer if needed
            if (needsNewLayer) {
              const newLayer = createDefaultLayer(`Layer ${page.layers.length + 1}`);

              updatedLayers.push(newLayer);
              targetLayerId = newLayer.id;
            }

            return {
              ...page,
              layers: updatedLayers.map((layer) =>
                layer.id === targetLayerId ? { ...layer, elements: [...layer.elements, newElement] } : layer,
              ) as Layer[],
            } as MenuPage;
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });

        return newElementId;
      }

      return "";
    },

    updateElement: (pageId: string, layerId: string, elementId: string, updates: Partial<MenuElement>) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              layers: page.layers.map((layer) => {
                if (layer.id === layerId) {
                  return {
                    ...layer,
                    elements: layer.elements.map((element) =>
                      element.id === elementId ? { ...element, ...updates } : element,
                    ),
                  };
                }
                return layer;
              }),
            };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    deleteElement: (pageId: string, layerId: string, elementId: string) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              layers: page.layers.map((layer) =>
                layer.id === layerId
                  ? { ...layer, elements: layer.elements.filter((element) => element.id !== elementId) }
                  : layer,
              ),
            };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    duplicateElement: (pageId: string, layerId: string, elementId: string) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              layers: page.layers.map((layer) => {
                if (layer.id === layerId) {
                  const elementIndex = layer.elements.findIndex((el) => el.id === elementId);

                  if (elementIndex !== -1) {
                    const originalElement = layer.elements[elementIndex];
                    const duplicatedElement = {
                      ...JSON.parse(JSON.stringify(originalElement)),
                      id: generateId(),
                      x: originalElement.x + 20,
                      y: originalElement.y + 20,
                    };

                    const updatedElements = [...layer.elements];

                    updatedElements.splice(elementIndex + 1, 0, duplicatedElement);

                    return { ...layer, elements: updatedElements };
                  }
                }
                return layer;
              }),
            };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    moveElement: (pageId: string, fromLayerId: string, toLayerId: string, elementId: string) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            let elementToMove: MenuElement | null = null;

            // First pass: remove element from source layer
            const layersAfterRemoval = page.layers.map((layer) => {
              if (layer.id === fromLayerId) {
                const elementIndex = layer.elements.findIndex((el) => el.id === elementId);

                if (elementIndex !== -1) {
                  elementToMove = layer.elements[elementIndex];
                  return {
                    ...layer,
                    elements: layer.elements.filter((el) => el.id !== elementId),
                  };
                }
              }
              return layer;
            });

            // Second pass: add element to target layer
            const layersAfterAddition = layersAfterRemoval.map((layer) => {
              if (layer.id === toLayerId && elementToMove) {
                return {
                  ...layer,
                  elements: [...layer.elements, elementToMove],
                };
              }
              return layer;
            });

            return { ...page, layers: layersAfterAddition };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    reorderElements: (pageId: string, layerId: string, fromIndex: number, toIndex: number) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              layers: page.layers.map((layer) => {
                if (layer.id === layerId) {
                  const elements = [...layer.elements];
                  const [removed] = elements.splice(fromIndex, 1);

                  elements.splice(toIndex, 0, removed);
                  return { ...layer, elements };
                }
                return layer;
              }),
            };
          }
          return page;
        });

        set({
          project: {
            ...project,
            pages: updatedPages,
            updatedAt: new Date().toISOString(),
          },
        });
      }
    },

    setTool: (tool: Tool) => {
      set({
        editorState: {
          ...get().editorState,
          tool,
        },
      });
    },

    selectElements: (elementIds: string[]) => {
      set({
        editorState: {
          ...get().editorState,
          selectedElementIds: elementIds,
        },
      });
    },

    selectLayer: (layerId: string | null) => {
      set({
        editorState: {
          ...get().editorState,
          selectedLayerId: layerId,
        },
      });
    },

    setHoveredElement: (elementId: string | null) => {
      set({
        editorState: {
          ...get().editorState,
          hoveredElementId: elementId,
        },
      });
    },

    clearSelection: () => {
      set({
        editorState: {
          ...get().editorState,
          selectedElementIds: [],
          selectedLayerId: null,
        },
      });
    },

    setSelectedShapeType: (shapeType: ShapeType | null) => {
      set({ selectedShapeType: shapeType });
    },

    setZoom: (zoom: number) => {
      set({
        editorState: {
          ...get().editorState,
          canvas: {
            ...get().editorState.canvas,
            zoom: Math.max(0.1, Math.min(5, zoom)),
          },
        },
      });
    },

    setCanvasOffset: (offsetX: number, offsetY: number) => {
      set({
        editorState: {
          ...get().editorState,
          canvas: {
            ...get().editorState.canvas,
            offsetX,
            offsetY,
          },
        },
      });
    },

    resetCanvasView: () => {
      set({
        editorState: {
          ...get().editorState,
          canvas: {
            ...get().editorState.canvas,
            zoom: 0.5,
            offsetX: 0,
            offsetY: 0,
          },
        },
      });
    },



    setSidebarWidth: (width: number) => {
      set({
        editorState: {
          ...get().editorState,
          ui: {
            ...get().editorState.ui,
            sidebarWidth: Math.max(200, Math.min(500, width)),
          },
        },
      });
    },

    toggleThumbnailsPanel: () => {
      set({
        editorState: {
          ...get().editorState,
          ui: {
            ...get().editorState.ui,
            thumbnailsPanelOpen: !get().editorState.ui.thumbnailsPanelOpen,
          },
        },
      });
    },

    toggleLayersPanel: () => {
      set({
        editorState: {
          ...get().editorState,
          ui: {
            ...get().editorState.ui,
            layersPanelOpen: !get().editorState.ui.layersPanelOpen,
          },
        },
      });
    },

    togglePropertiesPanel: () => {
      set({
        editorState: {
          ...get().editorState,
          ui: {
            ...get().editorState.ui,
            propertiesPanelOpen: !get().editorState.ui.propertiesPanelOpen,
          },
        },
      });
    },

    undo: () => {
      const { editorState } = get();
      const { past, present, future } = editorState.history;

      if (past.length > 0) {
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        set({
          editorState: {
            ...editorState,
            history: {
              past: newPast,
              present: previous,
              future: [present, ...future],
            },
          },
        });
      }
    },

    redo: () => {
      const { editorState } = get();
      const { past, present, future } = editorState.history;

      if (future.length > 0) {
        const next = future[0];
        const newFuture = future.slice(1);

        set({
          editorState: {
            ...editorState,
            history: {
              past: [...past, present],
              present: next,
              future: newFuture,
            },
          },
        });
      }
    },

    addToHistory: () => {
      const { editorState, project, currentPageId } = get();

      if (project && currentPageId) {
        const currentPage = project.pages.find((page) => page.id === currentPageId);

        if (currentPage) {
          const { past, present } = editorState.history;

          set({
            editorState: {
              ...editorState,
              history: {
                past: [...past, present].slice(-50), // Keep last 50 states
                present: currentPage,
                future: [],
              },
            },
          });
        }
      }
    },

    copy: () => {
      const { project, currentPageId, editorState } = get();
      const { selectedElementIds } = editorState;

      if (project && currentPageId && selectedElementIds.length > 0) {
        const currentPage = project.pages.find((page) => page.id === currentPageId);

        if (currentPage) {
          const selectedElements: MenuElement[] = [];

          currentPage.layers.forEach((layer) => {
            layer.elements.forEach((element) => {
              if (selectedElementIds.includes(element.id)) {
                selectedElements.push(JSON.parse(JSON.stringify(element)));
              }
            });
          });

          set({
            editorState: {
              ...editorState,
              clipboard: selectedElements,
            },
          });
        }
      }
    },

    cut: () => {
      const { copy, deleteElement, project, currentPageId, editorState } = get();
      const { selectedElementIds } = editorState;

      copy();

      if (project && currentPageId) {
        const currentPage = project.pages.find((page) => page.id === currentPageId);

        if (currentPage) {
          selectedElementIds.forEach((elementId) => {
            currentPage.layers.forEach((layer) => {
              const elementExists = layer.elements.some((el) => el.id === elementId);

              if (elementExists) {
                deleteElement(currentPageId, layer.id, elementId);
              }
            });
          });
        }
      }
    },

    paste: () => {
      const { addElement, project, currentPageId, editorState } = get();
      const { clipboard, selectedLayerId } = editorState;

      if (project && currentPageId && clipboard.length > 0) {
        const currentPage = project.pages.find((page) => page.id === currentPageId);

        if (currentPage) {
          const targetLayerId = selectedLayerId || currentPage.layers[0]?.id;

          if (targetLayerId) {
            clipboard.forEach((element) => {
              const { id: _id, ...elementWithoutId } = element;

              addElement(currentPageId, targetLayerId, {
                ...elementWithoutId,
                x: element.x + 20,
                y: element.y + 20,
              });
            });
          }
        }
      }
    },

    exportToPDF: async () => {
      const { project, setExportProgress, saveProject } = get();

      if (!project) {
        console.warn("No project to export");
        return;
      }

      // Only run on client side
      if (typeof window === "undefined") {
        console.warn("PDF export only available on client side");
        return;
      }

      // First save the project
      saveProject();

      // Set loading state and reset progress
      set({ isExportingPDF: true, exportProgress: 0 });

      try {
        // Dynamic import to avoid server-side issues
        const jsPDF = (await import("jspdf")).default;

        // Create PDF with custom dimensions based on the first page format
        const firstPage = project.pages[0];

        if (!firstPage) return;

        const pageWidth = firstPage.format.printWidth;
        const pageHeight = firstPage.format.printHeight;

        const pdf = new jsPDF({
          orientation: pageWidth > pageHeight ? "landscape" : "portrait",
          unit: "mm",
          format: [pageWidth, pageHeight],
          putOnlyUsedFonts: true,
          floatPrecision: 16,
        });

        // Update progress: PDF initialized
        setExportProgress(10);
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow UI to update

        // Generate high-quality canvas images for each page
        for (let i = 0; i < project.pages.length; i++) {
          const page = project.pages[i];

          // Update progress based on page processing (10% to 80%)
          const pageProgress = 10 + (i / project.pages.length) * 70;

          setExportProgress(Math.round(pageProgress));
          await new Promise(resolve => setTimeout(resolve, 50)); // Allow UI to update

          if (i > 0) {
            // Add new page for subsequent pages
            pdf.addPage([page.format.printWidth, page.format.printHeight]);
          }

          // Create a high-resolution canvas to render the page
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) continue;

          // Set high resolution for quality (300 DPI)
          const scaleFactor = 3; // Higher resolution

          canvas.width = page.format.width * scaleFactor;
          canvas.height = page.format.height * scaleFactor;

          ctx.scale(scaleFactor, scaleFactor);

          // Clear canvas
          ctx.clearRect(0, 0, page.format.width, page.format.height);

          // Draw page background
          ctx.fillStyle = page.backgroundColor;
          ctx.fillRect(0, 0, page.format.width, page.format.height);

          // Draw background image if available
          if (page.backgroundImage) {
            try {
              const img = new Image();

              img.crossOrigin = "anonymous"; // Enable CORS to prevent canvas tainting

              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = page.backgroundImage!;
              });
              ctx.save();
              ctx.globalAlpha = page.backgroundImageOpacity ?? 1;
              ctx.drawImage(img, 0, 0, page.format.width, page.format.height);
              ctx.restore();
            } catch (error) {
              console.warn("Failed to load background image for page", i + 1);
            }
          }

          // Draw all elements from all layers
          for (const layer of page.layers) {
            if (!layer.visible) continue;

            for (const element of layer.elements) {
              if (!element.visible) continue;

              ctx.save();
              ctx.globalAlpha = element.opacity * layer.opacity;

              if (element.type === "text") {
                // Draw text element
                ctx.font = `${element.fontStyle} ${element.fontSize}px ${element.fontFamily}`;
                ctx.fillStyle = element.fill;
                ctx.textAlign = element.align as "left" | "center" | "right" | "start" | "end";
                ctx.fillText(element.content, element.x, element.y + element.fontSize);
              } else if (element.type === "image" && (element as any).src) {
                // Draw image element (if src is available)
                try {
                  const img = new Image();
                  
                  img.crossOrigin = "anonymous"; // Enable CORS to prevent canvas tainting

                  await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = reject;
                    img.src = (element as any).src;
                  });
                  ctx.drawImage(img, element.x, element.y, element.width, element.height);
                } catch (error) {
                  // Draw placeholder for failed images
                  ctx.fillStyle = "#f0f0f0";
                  ctx.fillRect(element.x, element.y, element.width, element.height);
                  ctx.strokeStyle = "#ccc";
                  ctx.strokeRect(element.x, element.y, element.width, element.height);
                  ctx.fillStyle = "#666";
                  ctx.font = "14px Arial";
                  ctx.textAlign = "center";
                  ctx.fillText("Image", element.x + element.width / 2, element.y + element.height / 2);
                }
              } else if (element.type === "shape") {
                // Draw shape element
                const shapeElement = element as any;

                // Set fill and stroke styles
                if (shapeElement.fill) {
                  ctx.fillStyle = shapeElement.fill;
                }
                if (shapeElement.stroke) {
                  ctx.strokeStyle = shapeElement.stroke;
                  ctx.lineWidth = shapeElement.strokeWidth || 1;
                }

                // Draw the shape based on its type
                switch (shapeElement.shapeType) {
                  case "rectangle":
                    if (shapeElement.radius > 0) {
                      // Rounded rectangle
                      ctx.beginPath();
                      ctx.roundRect(shapeElement.x, shapeElement.y, shapeElement.width, shapeElement.height, shapeElement.radius);
                    } else {
                      // Regular rectangle
                      ctx.beginPath();
                      ctx.rect(shapeElement.x, shapeElement.y, shapeElement.width, shapeElement.height);
                    }
                    break;

                  case "circle": {
                    // Draw circle/ellipse
                    const centerX = shapeElement.x + shapeElement.width / 2;
                    const centerY = shapeElement.y + shapeElement.height / 2;
                    const radiusX = shapeElement.width / 2;
                    const radiusY = shapeElement.height / 2;

                    ctx.beginPath();
                    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                    break;
                  }

                  case "triangle":
                    // Draw triangle
                    ctx.beginPath();
                    ctx.moveTo(shapeElement.x + shapeElement.width / 2, shapeElement.y); // Top point
                    ctx.lineTo(shapeElement.x, shapeElement.y + shapeElement.height); // Bottom left
                    ctx.lineTo(shapeElement.x + shapeElement.width, shapeElement.y + shapeElement.height); // Bottom right
                    ctx.closePath();
                    break;
                }

                // Fill and stroke the shape
                if (shapeElement.fill) {
                  ctx.fill();
                }
                if (shapeElement.stroke && shapeElement.strokeWidth > 0) {
                  ctx.stroke();
                }
              } else if (element.type === "data") {
                // Draw data element
                const dataElement = element as any;
                
                // Save current globalAlpha
                const currentAlpha = ctx.globalAlpha;
                
                // Draw background with opacity
                ctx.fillStyle = dataElement.backgroundColor || "#ffffff";
                ctx.globalAlpha = currentAlpha * (dataElement.backgroundOpacity !== undefined ? dataElement.backgroundOpacity : 1);
                ctx.fillRect(dataElement.x, dataElement.y, dataElement.width, dataElement.height);
                
                // Restore alpha for border
                ctx.globalAlpha = currentAlpha;

                // Draw border with opacity
                const borderSize = dataElement.borderSize || 0;

                if (borderSize > 0) {
                  ctx.strokeStyle = dataElement.borderColor || "#000000";
                  ctx.lineWidth = borderSize;
                  // Apply element opacity to border
                  ctx.globalAlpha = currentAlpha * (dataElement.opacity !== undefined ? dataElement.opacity : 1);

                  // Set border type
                  if (dataElement.borderType === "dashed") {
                    ctx.setLineDash([5, 5]);
                  } else if (dataElement.borderType === "dotted") {
                    ctx.setLineDash([2, 2]);
                  } else {
                    ctx.setLineDash([]);
                  }

                  // Draw border with border radius if specified
                  if (dataElement.borderRadius > 0) {
                    ctx.beginPath();
                    ctx.roundRect(dataElement.x, dataElement.y, dataElement.width, dataElement.height, dataElement.borderRadius);
                    ctx.stroke();
                  } else {
                    ctx.strokeRect(dataElement.x, dataElement.y, dataElement.width, dataElement.height);
                  }
                  ctx.setLineDash([]);
                }
                
                // Restore alpha for text content
                ctx.globalAlpha = currentAlpha;

                // Draw data content with proper styling and language support
                let displayText = "";
                let textColor = dataElement.textColor || "#333";
                let fontSize = dataElement.fontSize || 64;
                let fontFamily = "Arial";
                let fontWeight = "normal";
                let textAlign = "left";

                // Use title properties for category and subcategory
                if (dataElement.dataType === "category" || dataElement.dataType === "subcategory") {
                  textColor = dataElement.titleTextColor || dataElement.textColor || "#333";
                  fontSize = dataElement.titleTextFontSize || dataElement.fontSize || 48;
                  fontFamily = dataElement.titleTextFontFamily || "Arial, sans-serif";
                  fontWeight = dataElement.titleTextFontWeight || "normal";
                  textAlign = dataElement.titleAlign || "left";
                }

                ctx.fillStyle = textColor;
                ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                ctx.textAlign = textAlign as "left" | "center" | "right" | "start" | "end";
                ctx.textBaseline = "top";

                if (dataElement.dataType === "category") {
                  if (dataElement.categoryData) {
                    // Show the actual category name with language fallback
                    const lang = dataElement.titleLanguage || dataElement.itemNameLanguage || "en";
                    
                    displayText = dataElement.categoryData.names?.[lang] || 
                                 dataElement.categoryData.names?.en ||
                                 dataElement.categoryData.names?.fr ||
                                 dataElement.categoryData.names?.it ||
                                 dataElement.categoryData.names?.nl ||
                                 dataElement.categoryData.name || 
                                 "Category";
                  } else {
                    displayText = "Select category";
                  }
                } else if (dataElement.dataType === "subcategory") {
                  if (dataElement.subcategoryData) {
                    // Show the actual subcategory name with language fallback
                    const lang = dataElement.titleLanguage || dataElement.itemNameLanguage || "en";
                    
                    displayText = dataElement.subcategoryData.names?.[lang] ||
                                 dataElement.subcategoryData.names?.en ||
                                 dataElement.subcategoryData.names?.fr ||
                                 dataElement.subcategoryData.names?.it ||
                                 dataElement.subcategoryData.names?.nl ||
                                 dataElement.subcategoryData.name || 
                                 "Subcategory";
                  } else {
                    displayText = "Select subcategory";
                  }
                } else if (dataElement.dataType === "menuitem") {
                  if (dataElement.subcategoryData) {
                    // Draw menu items list for menu item data elements using the utility function
                    drawMenuItemsList({
                      ctx,
                      element: dataElement,
                      x: dataElement.x,
                      y: dataElement.y,
                      width: dataElement.width,
                      height: dataElement.height,
                      scale: 1,
                      isThumbnail: false,
                    });
                    // Set empty to avoid drawing default text
                    displayText = "";
                  } else {
                    displayText = "Select category and subcategory";
                  }
                } else {
                  // Handle other data types
                  displayText = dataElement.dataType ? dataElement.dataType.charAt(0).toUpperCase() + dataElement.dataType.slice(1) : "DATA";
                }

                // Position text with alignment and padding (only if we have displayText)
                if (displayText) {
                  const padding = 10;
                  let textX = dataElement.x + padding;

                  // Adjust X position based on alignment
                  if (textAlign === "center") {
                    textX = dataElement.x + dataElement.width / 2;
                  } else if (textAlign === "right") {
                    textX = dataElement.x + dataElement.width - padding;
                  }

                  ctx.fillText(displayText, textX, dataElement.y + padding);
                }
              }

              ctx.restore();
            }
          }

          // Convert canvas to image and add to PDF
          const imageData = canvas.toDataURL("image/jpeg", 1.0);

          pdf.addImage(imageData, "JPEG", 0, 0, page.format.printWidth, page.format.printHeight);
          
          // Allow UI to update after processing each page
          if (i < project.pages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Update progress: Preparing to save
        setExportProgress(90);
        await new Promise(resolve => setTimeout(resolve, 200)); // Allow UI to update

        // Update progress: Complete
        setExportProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500)); // Show completion briefly



        // Save the PDF
        const fileName = `${project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_menu.pdf`;

        pdf.save(fileName);

        // Show success notification
        toast.success(`Menu "${project.name}" successfully exported !`);
      } catch (error) {
        console.error("Failed to export PDF:", error);
        alert("Failed to export PDF. Please try again.");
      } finally {
        // Reset loading state and progress
        set({ isExportingPDF: false, exportProgress: 0 });
      }
    },

    // Actions for menu data management
    setMenuData: (categories: Category[]) => {
      // Check if categories is valid
      if (!categories || !Array.isArray(categories)) {
        console.error("Invalid categories data passed to setMenuData:", categories);
        set({ 
          menuData: { 
            ...get().menuData, 
            categories: [],
            menuItems: [],
            isLoaded: true,
            error: "Invalid menu data format",
          }, 
        });
        return;
      }

      // Flatten all menu items from all subcategories
      const allMenuItems: any[] = [];

      categories.forEach(category => {
        if (category.subCategories && Array.isArray(category.subCategories)) {
          category.subCategories.forEach(subcategory => {
            if (subcategory.menuItems && Array.isArray(subcategory.menuItems)) {
              subcategory.menuItems.forEach(menuItem => {
                allMenuItems.push({
                  ...menuItem,
                  categoryId: category.id,
                  categoryName: category.names,
                  subcategoryId: subcategory.id,
                  subcategoryName: subcategory.names,
                });
              });
            }
          });
        }
      });

      set({ 
        menuData: { 
          ...get().menuData, 
          categories, 
          menuItems: allMenuItems,
          isLoaded: true,
          error: null, // Clear any previous errors
        }, 
      });

      // Refresh data elements after setting new menu data
      // Use setTimeout to ensure the menu data is fully set first
      setTimeout(() => {
        const { refreshDataElements } = get();

        refreshDataElements();
      }, 50);
    },
    setMenuLoading: (isLoading: boolean) => {
      set({ menuData: { ...get().menuData, isLoading } });
    },
    setMenuError: (error: string | null) => {
      set({ menuData: { ...get().menuData, error } });
    },
    clearMenuData: () => {
      set({ menuData: { categories: [], menuItems: [], isLoading: false, error: null, isLoaded: false } });
    },

    setExportProgress: (progress: number) => {
      set({ exportProgress: Math.max(0, Math.min(100, progress)) });
    },

    refreshDataElements: () => {
      const { project, menuData, updateElement } = get();

      if (!project || !menuData.isLoaded || menuData.categories.length === 0) {
        return;
      }

      // Create lookup maps for faster data retrieval
      const categoryMap = new Map();
      const subcategoryMap = new Map();

      menuData.categories.forEach(category => {
        categoryMap.set(category.id, category);
        category.subCategories.forEach(subcategory => {
          subcategoryMap.set(subcategory.id, subcategory);
        });
      });

      // Check each page for data elements that need updating
      project.pages.forEach(page => {
        page.layers.forEach(layer => {
          layer.elements.forEach(element => {
            if (element.type === 'data') {
              const dataElement = element as any;
              const updates: any = {};
              let needsUpdate = false;

              // Check if category data needs updating
              if (dataElement.dataType === 'category' && dataElement.dataId) {
                const freshCategoryData = categoryMap.get(dataElement.dataId);

                if (freshCategoryData && JSON.stringify(dataElement.categoryData) !== JSON.stringify(freshCategoryData)) {
                  updates.categoryData = freshCategoryData;
                  needsUpdate = true;
                }
              }

              // Check if subcategory data needs updating
              if ((dataElement.dataType === 'subcategory' || dataElement.dataType === 'menuitem') && dataElement.dataId) {
                const freshSubcategoryData = subcategoryMap.get(dataElement.dataId);

                if (freshSubcategoryData && JSON.stringify(dataElement.subcategoryData) !== JSON.stringify(freshSubcategoryData)) {
                  updates.subcategoryData = freshSubcategoryData;
                  needsUpdate = true;
                }
              }

              // Update the element if needed
              if (needsUpdate) {
                updateElement(page.id, layer.id, element.id, updates);
              }
            }
          });
        });
      });
    },

    // Preview mode actions
    togglePreviewMode: () => {
      const { isPreviewMode, setPreviewMode } = get();

      setPreviewMode(!isPreviewMode);
    },

    setPreviewMode: (isPreview: boolean) => {
      const { project, updateLayerLock } = get();

      if (!project) return;

      if (isPreview) {
        // Entering preview mode - save current lock states and lock all layers
        const lockStates: Record<string, boolean> = {};

        project.pages.forEach(page => {
          page.layers.forEach(layer => {
            lockStates[`${page.id}-${layer.id}`] = layer.locked;
            if (!layer.locked) {
              updateLayerLock(page.id, layer.id, true);
            }
          });
        });

        set({
          isPreviewMode: true,
          layersLockedBeforePreview: lockStates,
        });
      } else {
        // Exiting preview mode - restore previous lock states
        const { layersLockedBeforePreview } = get();

        project.pages.forEach(page => {
          page.layers.forEach(layer => {
            const originalLockState = layersLockedBeforePreview[`${page.id}-${layer.id}`];

            if (originalLockState !== undefined) {
              updateLayerLock(page.id, layer.id, originalLockState);
            }
          });
        });

        set({
          isPreviewMode: false,
          layersLockedBeforePreview: {},
        });
      }
    },

    // Generate preview images
    generatePreviewImages: async () => {
      const { project, menuData } = get();

      if (!project) {
        return [];
      }

      // Only run on client side
      if (typeof window === "undefined") {
        return [];
      }

      const previewImages: string[] = [];

      try {
        // Generate preview canvas images for each page
        for (let i = 0; i < project.pages.length; i++) {
          const page = project.pages[i];

          // Create a moderate-resolution canvas to render the page
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) continue;

          // Set reduced resolution for faster preview generation
          const scaleFactor = 0.25; // 50% scale for faster generation

          canvas.width = page.format.width * scaleFactor;
          canvas.height = page.format.height * scaleFactor;

          ctx.scale(scaleFactor, scaleFactor);

          // Clear canvas
          ctx.clearRect(0, 0, page.format.width, page.format.height);

          // Draw page background
          ctx.fillStyle = page.backgroundColor;
          ctx.fillRect(0, 0, page.format.width, page.format.height);

          // Draw background image if available
          if (page.backgroundImage) {
            try {
              const img = new Image();

              img.crossOrigin = "anonymous"; // Enable CORS to prevent canvas tainting

              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = page.backgroundImage!;
              });
              ctx.save();
              ctx.globalAlpha = page.backgroundImageOpacity ?? 1;
              ctx.drawImage(img, 0, 0, page.format.width, page.format.height);
              ctx.restore();
            } catch (error) {
              console.warn("Failed to load background image for page", i + 1);
            }
          }

          // Draw all elements from all layers
          for (const layer of page.layers) {
            if (!layer.visible) continue;

            for (const element of layer.elements) {
              if (!element.visible) continue;

              ctx.save();
              ctx.globalAlpha = element.opacity * layer.opacity;

              if (element.type === "text") {
                // Draw text element
                ctx.font = `${element.fontStyle} ${element.fontSize}px ${element.fontFamily}`;
                ctx.fillStyle = element.fill;
                ctx.textAlign = element.align as "left" | "center" | "right" | "start" | "end";
                ctx.fillText(element.content, element.x, element.y + element.fontSize);
              } else if (element.type === "image" && (element as any).src) {
                // Draw image element (if src is available)
                try {
                  const img = new Image();
                  
                  img.crossOrigin = "anonymous"; // Enable CORS to prevent canvas tainting

                  await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = reject;
                    img.src = (element as any).src;
                  });
                  ctx.drawImage(img, element.x, element.y, element.width, element.height);
                } catch (error) {
                  // Draw placeholder for failed images
                  ctx.fillStyle = "#f0f0f0";
                  ctx.fillRect(element.x, element.y, element.width, element.height);
                  ctx.strokeStyle = "#ccc";
                  ctx.strokeRect(element.x, element.y, element.width, element.height);
                  ctx.fillStyle = "#666";
                  ctx.font = "14px Arial";
                  ctx.textAlign = "center";
                  ctx.fillText("Image", element.x + element.width / 2, element.y + element.height / 2);
                }
              } else if (element.type === "shape") {
                // Draw shape element
                const shapeElement = element as any;

                // Set fill and stroke styles
                if (shapeElement.fill) {
                  ctx.fillStyle = shapeElement.fill;
                }
                if (shapeElement.stroke) {
                  ctx.strokeStyle = shapeElement.stroke;
                  ctx.lineWidth = shapeElement.strokeWidth || 1;
                }

                // Draw the shape based on its type
                switch (shapeElement.shapeType) {
                  case "rectangle":
                    if (shapeElement.radius > 0) {
                      // Rounded rectangle
                      ctx.beginPath();
                      ctx.roundRect(shapeElement.x, shapeElement.y, shapeElement.width, shapeElement.height, shapeElement.radius);
                    } else {
                      // Regular rectangle
                      ctx.beginPath();
                      ctx.rect(shapeElement.x, shapeElement.y, shapeElement.width, shapeElement.height);
                    }
                    break;

                  case "circle": {
                    // Draw circle/ellipse
                    const centerX = shapeElement.x + shapeElement.width / 2;
                    const centerY = shapeElement.y + shapeElement.height / 2;
                    const radiusX = shapeElement.width / 2;
                    const radiusY = shapeElement.height / 2;

                    ctx.beginPath();
                    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                    break;
                  }

                  case "triangle":
                    // Draw triangle
                    ctx.beginPath();
                    ctx.moveTo(shapeElement.x + shapeElement.width / 2, shapeElement.y); // Top point
                    ctx.lineTo(shapeElement.x, shapeElement.y + shapeElement.height); // Bottom left
                    ctx.lineTo(shapeElement.x + shapeElement.width, shapeElement.y + shapeElement.height); // Bottom right
                    ctx.closePath();
                    break;
                }

                // Fill and stroke the shape
                if (shapeElement.fill) {
                  ctx.fill();
                }
                if (shapeElement.stroke && shapeElement.strokeWidth > 0) {
                  ctx.stroke();
                }
              } else if (element.type === "data") {
                // Draw data element
                const dataElement = element as any;
                
                // Save current globalAlpha
                const currentAlpha = ctx.globalAlpha;
                
                // Draw background with opacity
                ctx.fillStyle = dataElement.backgroundColor || "#ffffff";
                ctx.globalAlpha = currentAlpha * (dataElement.backgroundOpacity !== undefined ? dataElement.backgroundOpacity : 1);
                ctx.fillRect(dataElement.x, dataElement.y, dataElement.width, dataElement.height);
                
                // Restore alpha for border
                ctx.globalAlpha = currentAlpha;

                // Draw border with opacity
                const borderSize = dataElement.borderSize || 0;

                if (borderSize > 0) {
                  ctx.strokeStyle = dataElement.borderColor || "#000000";
                  ctx.lineWidth = borderSize;
                  // Apply element opacity to border
                  ctx.globalAlpha = currentAlpha * (dataElement.opacity !== undefined ? dataElement.opacity : 1);

                  // Set border type
                  if (dataElement.borderType === "dashed") {
                    ctx.setLineDash([5, 5]);
                  } else if (dataElement.borderType === "dotted") {
                    ctx.setLineDash([2, 2]);
                  } else {
                    ctx.setLineDash([]);
                  }

                  // Draw border with border radius if specified
                  if (dataElement.borderRadius > 0) {
                    ctx.beginPath();
                    ctx.roundRect(dataElement.x, dataElement.y, dataElement.width, dataElement.height, dataElement.borderRadius);
                    ctx.stroke();
                  } else {
                    ctx.strokeRect(dataElement.x, dataElement.y, dataElement.width, dataElement.height);
                  }
                  ctx.setLineDash([]);
                }
                
                // Restore alpha for text content
                ctx.globalAlpha = currentAlpha;

                // Draw data content with proper styling and language support
                let displayText = "";
                let textColor = dataElement.textColor || "#333";
                let fontSize = dataElement.fontSize || 64;
                let fontFamily = "Arial";
                let fontWeight = "normal";
                let textAlign = "left";

                // Use title properties for category and subcategory
                if (dataElement.dataType === "category" || dataElement.dataType === "subcategory") {
                  textColor = dataElement.titleTextColor || dataElement.textColor || "#333";
                  fontSize = dataElement.titleTextFontSize || dataElement.fontSize || 48;
                  fontFamily = dataElement.titleTextFontFamily || "Arial, sans-serif";
                  fontWeight = dataElement.titleTextFontWeight || "normal";
                  textAlign = dataElement.titleAlign || "left";
                }

                ctx.fillStyle = textColor;
                ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
                ctx.textAlign = textAlign as "left" | "center" | "right" | "start" | "end";
                ctx.textBaseline = "top";

                if (dataElement.dataType === "category") {
                  // Get fresh category data from menuData store
                  const freshCategoryData = menuData.categories.find(cat => cat.id === dataElement.dataId);

                  if (freshCategoryData) {
                    // Show the actual category name with language fallback
                    const lang: string = dataElement.titleLanguage || dataElement.itemNameLanguage || "en";

                    displayText = freshCategoryData.names?.[lang as keyof typeof freshCategoryData.names] || 
                                 freshCategoryData.names?.en ||
                                 freshCategoryData.names?.fr ||
                                 freshCategoryData.names?.it ||
                                 freshCategoryData.names?.nl ||
                                 "Category";
                  } else {
                    displayText = "Select category";
                  }
                } else if (dataElement.dataType === "subcategory") {
                  // Get fresh subcategory data from menuData store
                  let freshSubcategoryData = null;

                  for (const category of menuData.categories) {
                    if (category.subCategories) {
                      freshSubcategoryData = category.subCategories.find(subcat => subcat.id === dataElement.dataId);
                      if (freshSubcategoryData) break;
                    }
                  }
                  
                  if (freshSubcategoryData) {
                    // Show the actual subcategory name with language fallback
                    const lang: string = dataElement.titleLanguage || dataElement.itemNameLanguage || "en";

                    displayText = freshSubcategoryData.names?.[lang as keyof typeof freshSubcategoryData.names] ||
                                 freshSubcategoryData.names?.en ||
                                 freshSubcategoryData.names?.fr ||
                                 freshSubcategoryData.names?.it ||
                                 freshSubcategoryData.names?.nl ||
                                 "Subcategory";
                  } else {
                    displayText = "Select subcategory";
                  }
                } else if (dataElement.dataType === "menuitem") {
                  // Get fresh subcategory data from menuData store for menu items
                  let freshSubcategoryData = null;

                  for (const category of menuData.categories) {
                    if (category.subCategories) {
                      freshSubcategoryData = category.subCategories.find(subcat => subcat.id === dataElement.dataId);
                      if (freshSubcategoryData) break;
                    }
                  }
                  
                  if (freshSubcategoryData) {
                    // Create a temporary element with fresh data for rendering
                    const elementWithFreshData = {
                      ...dataElement,
                      subcategoryData: freshSubcategoryData,
                    };
                    
                    // Draw menu items list for menu item data elements using the utility function
                    drawMenuItemsList({
                      ctx,
                      element: elementWithFreshData,
                      x: dataElement.x,
                      y: dataElement.y,
                      width: dataElement.width,
                      height: dataElement.height,
                      scale: 1,
                      isThumbnail: false,
                    });
                    // Set empty to avoid drawing default text
                    displayText = "";
                  } else {
                    displayText = "Select category and subcategory";
                  }
                } else {
                  // Handle other data types
                  displayText = dataElement.dataType ? dataElement.dataType.charAt(0).toUpperCase() + dataElement.dataType.slice(1) : "DATA";
                }

                // Position text with alignment and padding (only if we have displayText)
                if (displayText) {
                  const padding = 10;
                  let textX = dataElement.x + padding;

                  // Adjust X position based on alignment
                  if (textAlign === "center") {
                    textX = dataElement.x + dataElement.width / 2;
                  } else if (textAlign === "right") {
                    textX = dataElement.x + dataElement.width - padding;
                  }

                  ctx.fillText(displayText, textX, dataElement.y + padding);
                }
              }

              ctx.restore();
            }
          }

          // Convert canvas to image with moderate quality for faster loading
          const imageData = canvas.toDataURL("image/jpeg", 0.8);

          previewImages.push(imageData);
        }

        return previewImages;
      } catch (error) {
        console.error("Failed to generate preview images:", error);
        return [];
      }
    },

    // Font management actions
    loadProjectFonts: async () => {
      const { project } = get();

      if (!project) return;

      const allFonts = [...project.fonts.defaultFonts, ...project.fonts.googleFonts, ...project.fonts.customFonts];

      await fontService.loadProjectFonts(allFonts);
    },

    addGoogleFont: async (googleFont: GoogleFont) => {
      const { project } = get();

      if (!project) return;

      const projectFont = fontService.googleFontToProjectFont(googleFont);
      
      // Check if already added
      const exists = project.fonts.googleFonts.some(font => font.id === projectFont.id);

      if (exists) return;

      // Load the font
      const loaded = await fontService.loadGoogleFont(projectFont);

      projectFont.isLoaded = loaded;

      const updatedProject = {
        ...project,
        fonts: {
          ...project.fonts,
          googleFonts: [...project.fonts.googleFonts, projectFont],
        },
        updatedAt: new Date().toISOString(),
      };

      set({ project: updatedProject });
      
      try {
        await indexedDBService.saveProject(updatedProject);
      } catch (error) {
        console.error('Failed to save project with new Google font:', error);
      }
    },

    addCustomFont: async (fontFile: File) => {
      const { project } = get();

      if (!project) return null;

      try {
        const customFontFile = await fontService.loadCustomFont(fontFile);

        if (!customFontFile) return null;

        // Check if a font with this family name already exists
        const existingFontIndex = project.fonts.customFonts.findIndex(
          font => font.familyName === customFontFile.familyName
        );

        let updatedCustomFonts: ProjectFont[];

        if (existingFontIndex >= 0) {
          // Add to existing font family
          const existingFont = project.fonts.customFonts[existingFontIndex];
          const updatedFont = {
            ...existingFont,
            customFontFiles: [...(existingFont.customFontFiles || []), customFontFile],
            variants: [...new Set([...existingFont.variants, customFontFile.weight.toString()])],
            isLoaded: true,
          };

          updatedCustomFonts = project.fonts.customFonts.map((font, index) =>
            index === existingFontIndex ? updatedFont : font
          );
        } else {
          // Create new font family
          const projectFont = fontService.customFontFilesToProjectFont([customFontFile], customFontFile.familyName);

          projectFont.isLoaded = true;
          updatedCustomFonts = [...project.fonts.customFonts, projectFont];
        }

        const updatedProject = {
          ...project,
          fonts: {
            ...project.fonts,
            customFonts: updatedCustomFonts,
          },
          updatedAt: new Date().toISOString(),
        };

        set({ project: updatedProject });
        
        try {
          await indexedDBService.saveProject(updatedProject);
        } catch (error) {
          console.error('Failed to save project with new custom font:', error);
        }

        return customFontFile;
      } catch (error) {
        console.error('Failed to add custom font:', error);
        return null;
      }
    },

    removeFont: async (fontId: string) => {
      const { project } = get();

      if (!project) return;

      // Find and remove the font
      let updatedProject = { ...project };
      let fontRemoved = false;

      // Check Google fonts
      const googleFontIndex = project.fonts.googleFonts.findIndex(font => font.id === fontId);

      if (googleFontIndex >= 0) {
        updatedProject.fonts.googleFonts = project.fonts.googleFonts.filter(font => font.id !== fontId);
        fontRemoved = true;
      }

      // Check custom fonts
      const customFontIndex = project.fonts.customFonts.findIndex(font => font.id === fontId);

      if (customFontIndex >= 0) {
        const customFont = project.fonts.customFonts[customFontIndex];
        
        // Remove font files from IndexedDB
        if (customFont.customFontFiles) {
          await Promise.all(
            customFont.customFontFiles.map(fontFile => indexedDBService.deleteFont(fontFile.blobId))
          );
        }

        updatedProject.fonts.customFonts = project.fonts.customFonts.filter(font => font.id !== fontId);
        fontRemoved = true;
      }

      if (fontRemoved) {
        updatedProject.updatedAt = new Date().toISOString();
        set({ project: updatedProject });
        
        try {
          await indexedDBService.saveProject(updatedProject);
        } catch (error) {
          console.error('Failed to save project after removing font:', error);
        }
      }
    },

    getAllAvailableFonts: () => {
      const { project } = get();

      if (!project) return DEFAULT_FONTS;

      return fontService.getAllAvailableFonts([
        ...project.fonts.googleFonts,
        ...project.fonts.customFonts,
      ]);
    },

    ensureFontLoaded: async (font: ProjectFont) => await fontService.ensureFontLoaded(font),
  })),
);
