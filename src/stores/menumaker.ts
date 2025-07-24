/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { EditorState, Layer, MenuElement, MenuPage, MenuProject, PAGE_FORMATS, Tool } from "../types/menumaker";

interface MenuMakerStore {
  // Project state
  project: MenuProject | null;
  currentPageId: string | null;
  editorState: EditorState;
  isExportingPDF: boolean;

  // Actions for project management
  createProject: (name: string, format?: string, customWidth?: number, customHeight?: number) => void;
  loadProject: (project: MenuProject) => void;
  saveProject: () => void;
  clearProject: () => void;
  updateProjectName: (name: string) => void;
  exportToPDF: () => Promise<void>;

  // Actions for page management
  addPage: (format?: string) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  setCurrentPage: (pageId: string) => void;
  updatePageName: (pageId: string, name: string) => void;
  updatePageFormat: (pageId: string, format: string, customWidth?: number, customHeight?: number) => void;
  updatePageBackground: (pageId: string, backgroundColor?: string, backgroundImage?: string) => void;

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
  addElement: (pageId: string, layerId: string, element: Omit<MenuElement, "id">) => void;
  updateElement: (pageId: string, layerId: string, elementId: string, updates: Partial<MenuElement>) => void;
  deleteElement: (pageId: string, layerId: string, elementId: string) => void;
  duplicateElement: (pageId: string, layerId: string, elementId: string) => void;
  moveElement: (pageId: string, fromLayerId: string, toLayerId: string, elementId: string) => void;
  reorderElements: (pageId: string, layerId: string, fromIndex: number, toIndex: number) => void;

  // Actions for selection and tools
  setTool: (tool: Tool) => void;
  selectElements: (elementIds: string[]) => void;
  selectLayer: (layerId: string | null) => void;
  clearSelection: () => void;

  // Actions for canvas manipulation
  setZoom: (zoom: number) => void;
  setCanvasOffset: (offsetX: number, offsetY: number) => void;
  resetCanvasView: () => void;

  // Actions for UI state
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleGuides: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  setSidebarWidth: (width: number) => void;
  toggleThumbnailsPanel: () => void;
  toggleLayersPanel: () => void;
  togglePropertiesPanel: () => void;

  // Actions for history (undo/redo)
  undo: () => void;
  redo: () => void;
  addToHistory: () => void;

  // Actions for clipboard
  copy: () => void;
  cut: () => void;
  paste: () => void;
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
  settings: {
    defaultFormat: "A4",
    gridEnabled: true,
    gridSize: 20,
    snapToGrid: false,
    showRulers: true,
    showGuides: true,
    zoom: 1,
  },
});

const createDefaultEditorState = (): EditorState => ({
  tool: "select",
  selectedElementIds: [],
  selectedLayerId: null,
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
    showGrid: true,
    showRulers: true,
    showGuides: true,
    snapToGrid: false,
    gridSize: 20,
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

    createProject: (name: string, format?: string, customWidth?: number, customHeight?: number) => {
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
    },

    loadProject: (project: MenuProject) => {
      set({
        project,
        currentPageId: project.pages[0]?.id || null,
        editorState: {
          ...get().editorState,
          history: {
            past: [],
            present: project.pages[0] || createDefaultPage(),
            future: [],
          },
        },
      });
    },

    saveProject: () => {
      const { project } = get();

      if (project) {
        const updatedProject = {
          ...project,
          updatedAt: new Date().toISOString(),
        };

        localStorage.setItem(`menumaker_project_${project.id}`, JSON.stringify(updatedProject));
        set({ project: updatedProject });
      }
    },

    clearProject: () => {
      set({
        project: null,
        currentPageId: null,
        editorState: createDefaultEditorState(),
      });
    },

    updateProjectName: (name: string) => {
      const { project } = get();

      if (project) {
        set({
          project: {
            ...project,
            name,
            updatedAt: new Date().toISOString(),
          },
        });
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

    updatePageBackground: (pageId: string, backgroundColor?: string, backgroundImage?: string) => {
      const { project } = get();

      if (project) {
        const updatedPages = project.pages.map((page) =>
          page.id === pageId
            ? {
              ...page,
              backgroundColor: backgroundColor ?? page.backgroundColor,
              backgroundImage: backgroundImage ?? page.backgroundImage,
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
        const newElement = { ...element, id: generateId() } as MenuElement;

        const updatedPages = project.pages.map((page) => {
          if (page.id === pageId) {
            return {
              ...page,
              layers: page.layers.map((layer) =>
                layer.id === layerId ? { ...layer, elements: [...layer.elements, newElement] } : layer,
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

    clearSelection: () => {
      set({
        editorState: {
          ...get().editorState,
          selectedElementIds: [],
          selectedLayerId: null,
        },
      });
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

    toggleGrid: () => {
      set({
        editorState: {
          ...get().editorState,
          ui: {
            ...get().editorState.ui,
            showGrid: !get().editorState.ui.showGrid,
          },
        },
      });
    },

    toggleRulers: () => {
      set({
        editorState: {
          ...get().editorState,
          ui: {
            ...get().editorState.ui,
            showRulers: !get().editorState.ui.showRulers,
          },
        },
      });
    },

    toggleGuides: () => {
      set({
        editorState: {
          ...get().editorState,
          ui: {
            ...get().editorState.ui,
            showGuides: !get().editorState.ui.showGuides,
          },
        },
      });
    },

    toggleSnapToGrid: () => {
      set({
        editorState: {
          ...get().editorState,
          ui: {
            ...get().editorState.ui,
            snapToGrid: !get().editorState.ui.snapToGrid,
          },
        },
      });
    },

    setGridSize: (size: number) => {
      set({
        editorState: {
          ...get().editorState,
          ui: {
            ...get().editorState.ui,
            gridSize: Math.max(5, Math.min(100, size)),
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
      const { project } = get();

      if (!project) {
        console.warn("No project to export");
        return;
      }

      // Only run on client side
      if (typeof window === "undefined") {
        console.warn("PDF export only available on client side");
        return;
      }

      // Set loading state
      set({ isExportingPDF: true });

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

        // Generate high-quality canvas images for each page
        for (let i = 0; i < project.pages.length; i++) {
          const page = project.pages[i];

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

              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = page.backgroundImage!;
              });
              ctx.drawImage(img, 0, 0, page.format.width, page.format.height);
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
              }

              ctx.restore();
            }
          }

          // Convert canvas to image and add to PDF
          const imageData = canvas.toDataURL("image/jpeg", 1.0);

          pdf.addImage(imageData, "JPEG", 0, 0, page.format.printWidth, page.format.printHeight);
        }

        // Save the PDF
        const fileName = `${project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_menu.pdf`;

        pdf.save(fileName);
      } catch (error) {
        console.error("Failed to export PDF:", error);
        alert("Failed to export PDF. Please try again.");
      } finally {
        // Reset loading state
        set({ isExportingPDF: false });
      }
    },
  })),
);
