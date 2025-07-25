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
export type ElementType = "text" | "image" | "background" | "data";

// Element types
export type FontWeight = "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

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
  dataType: "category" | "subcategory" | "menuitem";
  dataId?: string;
  categoryData?: any; // Store the full category data
  subcategoryData?: any; // Store the full subcategory data
  menuItemData?: any; // Store the full menu item data
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

// Union type for all elements
export type MenuElement = TextElement | ImageElement | BackgroundElement | DataElement;

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
export type Tool = "select" | "text" | "image" | "background" | "data" | "pan" | "zoom";

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
          format: { type: "object" },
          customWidth: { type: "number" },
          customHeight: { type: "number" },
          backgroundColor: { type: "string" },
          backgroundImage: { type: "string" },
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
                elements: { type: "array" },
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
