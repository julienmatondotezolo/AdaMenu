// Page format configurations with 300 DPI
export interface PageFormat {
  name: string;
  width: number; // in pixels at 300 DPI
  height: number; // in pixels at 300 DPI
  printWidth: number; // in mm
  printHeight: number; // in mm
}

export const PAGE_FORMATS: Record<string, PageFormat> = {
  A4: {
    name: "A4",
    width: 2480, // 210mm * 11.81 pixels/mm (300 DPI)
    height: 3508, // 297mm * 11.81 pixels/mm (300 DPI)
    printWidth: 210,
    printHeight: 297,
  },
  A5: {
    name: "A5",
    width: 1748, // 148mm * 11.81 pixels/mm (300 DPI)
    height: 2480, // 210mm * 11.81 pixels/mm (300 DPI)
    printWidth: 148,
    printHeight: 210,
  },
  CUSTOM: {
    name: "Custom",
    width: 2480,
    height: 3508,
    printWidth: 210,
    printHeight: 297,
  },
};

// Element types
export type ElementType = "text" | "image" | "background" | "data" | "shape";

// Element types
export type FontWeight = "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

// Data types
export type DataType = "category" | "subcategory" | "menuitem" | "sidedish" | "sauce" | "allergen";

// Shape types
export type ShapeType = "rectangle" | "circle" | "triangle";

// Base element interface
export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
}

// Text element
export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "bold" | "italic" | "bold italic";
  textDecoration: "none" | "underline" | "line-through";
  fill: string;
  stroke: string;
  strokeWidth: number;
  align: "left" | "center" | "right" | "justify";
  verticalAlign: "top" | "middle" | "bottom";
  lineHeight: number;
  letterSpacing: number;
  padding: number;
  textShadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

// Image element
export interface ImageElement extends BaseElement {
  type: "image";
  fileName: string;
  src: string;
  originalWidth: number;
  originalHeight: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  filters?: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    sepia: number;
    grayscale: number;
  };
}

// Background element
export interface BackgroundElement extends BaseElement {
  type: "background";
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize: "cover" | "contain" | "stretch" | "repeat";
  backgroundPosition: {
    x: number;
    y: number;
  };
}

// Data element
export interface DataElement extends BaseElement {
  type: "data";
  dataType: DataType;
  dataId?: string;
  categoryData?: any; // Store the full category data
  subcategoryData?: any; // Store the full subcategory data
  menuItemData?: any; // Store the full menu item data
  startIndex?: number; // Starting index for menu items display
  backgroundColor: string;
  backgroundOpacity?: number;
  borderColor: string;
  borderSize: number;
  borderType: "solid" | "dashed" | "dotted";
  borderRadius: number;
  textColor: string;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: FontWeight;
  lineSpacing?: number;
  itemNameLanguage?: "en" | "fr" | "it" | "nl";
  // Category/Subcategory title properties
  titleLanguage?: "en" | "fr" | "it" | "nl";
  titleTextColor?: string;
  titleTextFontSize?: number;
  titleTextFontFamily?: string;
  titleTextFontWeight?: FontWeight;
  titleAlign?: "left" | "center" | "right";
  // Menu item specific properties
  showSubcategoryTitle?: boolean; // Toggle to show/hide subcategory title
  showMenuDescription?: boolean; // Toggle to show/hide menu description
  showPrice?: boolean; // Toggle to show/hide price
  showCurrencySign?: boolean; // Toggle to show/hide € sign
  priceColor?: string; // Price color
  priceFontFamily?: string; // Price font family
  priceFontWeight?: FontWeight; // Price font weight
  priceSeparator?: "." | ","; // Price decimal separator
  menuLayout?: "left" | "justified"; // Layout: "left" (current) or "justified" (text left, price right)
  // Subcategory title properties (when showSubcategoryTitle is true)
  subcategoryTitleTextColor?: string;
  subcategoryTitleTextFontSize?: number;
  subcategoryTitleTextFontFamily?: string;
  subcategoryTitleTextFontWeight?: FontWeight;
  showDivider?: boolean;
  dividerColor?: string;
  dividerSize?: number;
  dividerWidth?: "full" | "title" | "custom";
  dividerCustomWidth?: number;
  dividerSpaceTop?: number;
  dividerSpaceBottom?: number;
  subcategoryTitleTextMarginTop?: number;
  subcategoryTitleTextMarginLeft?: number;
  subcategoryTitleTextMarginRight?: number;
  subcategoryTitleTextMarginBottom?: number;
  subcategoryTitleLanguage?: "en" | "fr" | "it" | "nl";
  // Menu description properties (when showMenuDescription is true)
  showMenuDescriptionTextColor?: string;
  showMenuDescriptionTextFontSize?: number;
  showMenuDescriptionTextFontWeight?: FontWeight;
  showMenuDescriptionTextMarginTop?: number;
  showMenuDescriptionTextMarginLeft?: number;
  showMenuDescriptionTextMarginRight?: number;
  showMenuDescriptionTextMarginBottom?: number;
  showMenuDescriptionLanguage?: "en" | "fr" | "it" | "nl";
  showMenuDescriptionLineBreakChars?: number;
}

// Shape element
export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number; // For rounded corners on rectangles
}

// Union type for all elements
export type MenuElement = TextElement | ImageElement | BackgroundElement | DataElement | ShapeElement;

// Layer interface
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  elements: MenuElement[];
}

// Page interface
export interface MenuPage {
  id: string;
  name: string;
  format: PageFormat;
  customWidth?: number;
  customHeight?: number;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundImageOpacity?: number; // 0-1, default 1
  layers: Layer[];
  thumbnail?: string; // base64 data URL
}

// Menu project interface
export interface MenuProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  pages: MenuPage[];
  settings: {
    defaultFormat: string;
    zoom: number;
  };
}

// Tool types
export type Tool = "select" | "text" | "image" | "background" | "data" | "shape" | "zoom";

// Editor state
export interface EditorState {
  tool: Tool;
  selectedElementIds: string[];
  selectedLayerId: string | null;
  clipboard: MenuElement[];
  history: {
    past: MenuPage[];
    present: MenuPage;
    future: MenuPage[];
  };
  canvas: {
    zoom: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };
  ui: {
    sidebarWidth: number;
    thumbnailsPanelOpen: boolean;
    layersPanelOpen: boolean;
    propertiesPanelOpen: boolean;
  };
}

// JSON Schema for validation
export const MENU_PROJECT_SCHEMA = {
  type: "object",
  required: ["id", "name", "createdAt", "updatedAt", "pages", "settings"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
    pages: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "name", "format", "backgroundColor", "layers"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          format: {
            type: "object",
            required: ["name", "width", "height", "printWidth", "printHeight"],
            properties: {
              name: { type: "string" },
              width: { type: "number" },
              height: { type: "number" },
              printWidth: { type: "number" },
              printHeight: { type: "number" },
            },
          },
          customWidth: { type: "number" },
          customHeight: { type: "number" },
          backgroundColor: { type: "string" },
          backgroundImage: { type: "string" },
          backgroundImageOpacity: { type: "number" },
          layers: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "name", "visible", "locked", "opacity", "elements"],
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                visible: { type: "boolean" },
                locked: { type: "boolean" },
                opacity: { type: "number" },
                elements: {
                  type: "array",
                  items: {
                    type: "object",
                    required: [
                      "id",
                      "type",
                      "x",
                      "y",
                      "width",
                      "height",
                      "rotation",
                      "scaleX",
                      "scaleY",
                      "zIndex",
                      "locked",
                      "visible",
                      "opacity",
                    ],
                    properties: {
                      id: { type: "string" },
                      type: { enum: ["text", "image", "background", "data", "shape"] },
                      x: { type: "number" },
                      y: { type: "number" },
                      width: { type: "number" },
                      height: { type: "number" },
                      rotation: { type: "number" },
                      scaleX: { type: "number" },
                      scaleY: { type: "number" },
                      zIndex: { type: "number" },
                      locked: { type: "boolean" },
                      visible: { type: "boolean" },
                      opacity: { type: "number" },
                      // Text element properties
                      content: { type: "string" },
                      fontSize: { type: "number" },
                      fontFamily: { type: "string" },
                      fontStyle: { enum: ["normal", "bold", "italic", "bold italic"] },
                      textDecoration: { enum: ["none", "underline", "line-through"] },
                      fill: { type: "string" },
                      stroke: { type: "string" },
                      strokeWidth: { type: "number" },
                      align: { enum: ["left", "center", "right", "justify"] },
                      verticalAlign: { enum: ["top", "middle", "bottom"] },
                      lineHeight: { type: "number" },
                      letterSpacing: { type: "number" },
                      padding: { type: "number" },
                      textShadow: {
                        type: "object",
                        properties: {
                          color: { type: "string" },
                          blur: { type: "number" },
                          offsetX: { type: "number" },
                          offsetY: { type: "number" },
                        },
                      },
                      // Image element properties
                      fileName: { type: "string" },
                      src: { type: "string" },
                      originalWidth: { type: "number" },
                      originalHeight: { type: "number" },
                      crop: {
                        type: "object",
                        properties: {
                          x: { type: "number" },
                          y: { type: "number" },
                          width: { type: "number" },
                          height: { type: "number" },
                        },
                      },
                      filters: {
                        type: "object",
                        properties: {
                          brightness: { type: "number" },
                          contrast: { type: "number" },
                          saturation: { type: "number" },
                          blur: { type: "number" },
                          sepia: { type: "number" },
                          grayscale: { type: "number" },
                        },
                      },
                      // Background element properties
                      backgroundColor: { type: "string" },
                      backgroundImage: { type: "string" },
                      backgroundSize: { enum: ["cover", "contain", "stretch", "repeat"] },
                      backgroundPosition: {
                        type: "object",
                        properties: {
                          x: { type: "number" },
                          y: { type: "number" },
                        },
                      },
                      // Data element properties
                      dataType: { enum: ["category", "subcategory", "menuitem", "sidedish", "sauce", "allergen"] },
                      dataId: { type: "string" },
                      categoryData: { type: "object" },
                      subcategoryData: { type: "object" },
                      menuItemData: { type: "object" },
                      startIndex: { type: "number" },
                      backgroundOpacity: { type: "number" },
                      borderColor: { type: "string" },
                      borderSize: { type: "number" },
                      borderType: { enum: ["solid", "dashed", "dotted"] },
                      borderRadius: { type: "number" },
                      textColor: { type: "string" },
                      fontWeight: {
                        enum: ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
                      },
                      lineSpacing: { type: "number" },
                      itemNameLanguage: { enum: ["en", "fr", "it", "nl"] },
                      // Category/Subcategory title properties
                      titleLanguage: { enum: ["en", "fr", "it", "nl"] },
                      titleTextColor: { type: "string" },
                      titleTextFontSize: { type: "number" },
                      titleTextFontFamily: { type: "string" },
                      titleTextFontWeight: {
                        enum: ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
                      },
                      titleAlign: { enum: ["left", "center", "right"] },
                      // Menu item specific properties
                      showSubcategoryTitle: { type: "boolean" },
                      showMenuDescription: { type: "boolean" },
                      showPrice: { type: "boolean" },
                      showCurrencySign: { type: "boolean" },
                      priceColor: { type: "string" },
                      priceFontFamily: { type: "string" },
                      priceFontWeight: {
                        enum: ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
                      },
                      priceSeparator: { enum: [".", ","] },
                      menuLayout: { enum: ["left", "justified"] },
                      // Subcategory title properties
                      subcategoryTitleTextColor: { type: "string" },
                      subcategoryTitleTextFontSize: { type: "number" },
                      subcategoryTitleTextFontFamily: { type: "string" },
                      subcategoryTitleTextFontWeight: {
                        enum: ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
                      },
                      showDivider: { type: "boolean" },
                      dividerColor: { type: "string" },
                      dividerSize: { type: "number" },
                      dividerWidth: { enum: ["full", "title", "custom"] },
                      dividerCustomWidth: { type: "number" },
                      dividerSpaceTop: { type: "number" },
                      dividerSpaceBottom: { type: "number" },
                      subcategoryTitleTextMarginTop: { type: "number" },
                      subcategoryTitleTextMarginLeft: { type: "number" },
                      subcategoryTitleTextMarginRight: { type: "number" },
                      subcategoryTitleTextMarginBottom: { type: "number" },
                      subcategoryTitleLanguage: { enum: ["en", "fr", "it", "nl"] },
                      // Menu description properties
                      showMenuDescriptionTextColor: { type: "string" },
                      showMenuDescriptionTextFontSize: { type: "number" },
                      showMenuDescriptionTextFontWeight: {
                        enum: ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
                      },
                      showMenuDescriptionTextMarginTop: { type: "number" },
                      showMenuDescriptionTextMarginLeft: { type: "number" },
                      showMenuDescriptionTextMarginRight: { type: "number" },
                      showMenuDescriptionTextMarginBottom: { type: "number" },
                      showMenuDescriptionLanguage: { enum: ["en", "fr", "it", "nl"] },
                      showMenuDescriptionLineBreakChars: { type: "number" },
                      // Shape element properties
                      shapeType: { enum: ["rectangle", "circle", "triangle"] },
                      radius: { type: "number" },
                    },
                  },
                },
              },
            },
          },
          thumbnail: { type: "string" },
        },
      },
    },
    settings: {
      type: "object",
      required: ["defaultFormat", "zoom"],
      properties: {
        defaultFormat: { type: "string" },
        zoom: { type: "number" },
      },
    },
  },
} as const;
