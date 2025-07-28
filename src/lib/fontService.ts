import { CustomFontFile, DEFAULT_FONTS, GoogleFont, ProjectFont } from "../types/menumaker";
import { indexedDBService } from "./indexedDBService";

interface GoogleFontsAPIResponse {
  kind: string;
  items: GoogleFont[];
}

class FontService {
  private static instance: FontService;
  private googleFontsAPIKey = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY; // TODO: Add your Google Fonts API key
  private loadedFonts = new Set<string>();
  private loadedGoogleFonts = new Set<string>();

  static getInstance(): FontService {
    if (!FontService.instance) {
      FontService.instance = new FontService();
    }
    return FontService.instance;
  }

  // Load Google Fonts from API (for font selection)
  async getGoogleFonts(limit: number = 200): Promise<GoogleFont[]> {
    if (!this.googleFontsAPIKey) {
      console.warn("Google Fonts API key not configured. Using fallback fonts.");
      return [];
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=${this.googleFontsAPIKey}&sort=popularity`,
      );

      if (!response.ok) {
        throw new Error(`Google Fonts API error: ${response.status}`);
      }

      const data: GoogleFontsAPIResponse = await response.json();

      return data.items.slice(0, limit);
    } catch (error) {
      console.error("Failed to fetch Google Fonts:", error);
      return [];
    }
  }

  // Load a Google Font into the document
  async loadGoogleFont(font: ProjectFont): Promise<boolean> {
    if (!font.googleFontData) {
      console.error("No Google Font data available");
      return false;
    }

    const familyName = font.googleFontData.family;

    // Check if already loaded
    if (this.loadedGoogleFonts.has(familyName)) {
      return true;
    }

    try {
      // Create Google Fonts URL with requested variants
      const variants = font.variants.length > 0 ? font.variants : ["400"];
      const variantsString = variants.join(",");
      const fontUrl = `https://fonts.googleapis.com/css2?family=${familyName.replace(/\s+/g, "+")}:wght@${variantsString}&display=swap`;

      console.log("fontUrl:", fontUrl);

      // Load the font using CSS
      const link = document.createElement("link");

      link.rel = "stylesheet";
      link.href = fontUrl;

      return new Promise((resolve) => {
        link.onload = () => {
          this.loadedGoogleFonts.add(familyName);
          this.loadedFonts.add(familyName);
          resolve(true);
        };

        link.onerror = () => {
          console.error(`Failed to load Google Font: ${familyName}`);
          resolve(false);
        };

        document.head.appendChild(link);
      });
    } catch (error) {
      console.error(`Error loading Google Font ${familyName}:`, error);
      return false;
    }
  }

  // Load a custom font from file
  async loadCustomFont(fontFile: File): Promise<CustomFontFile | null> {
    try {
      // Validate file type
      const allowedTypes = [
        "font/woff",
        "font/woff2",
        "font/ttf",
        "font/otf",
        "application/font-woff",
        "application/font-woff2",
      ];
      const allowedExtensions = [".woff", ".woff2", ".ttf", ".otf"];

      const fileExtension = fontFile.name.toLowerCase().substring(fontFile.name.lastIndexOf("."));

      if (!allowedTypes.includes(fontFile.type) && !allowedExtensions.includes(fileExtension)) {
        throw new Error("Unsupported font format. Please use WOFF, WOFF2, TTF, or OTF files.");
      }

      // Determine format from file extension
      let format: "woff" | "woff2" | "ttf" | "otf";

      switch (fileExtension) {
        case ".woff":
          format = "woff";
          break;
        case ".woff2":
          format = "woff2";
          break;
        case ".ttf":
          format = "ttf";
          break;
        case ".otf":
          format = "otf";
          break;
        default:
          format = "woff";
      }

      // Generate unique ID for the font
      const fontId = `custom-font-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Extract family name from file name (basic approach)
      const familyName = fontFile.name.replace(/\.(woff2?|ttf|otf)$/i, "").replace(/[-_]/g, " ");

      // Save font to IndexedDB
      const blobUrl = await indexedDBService.saveFont(fontId, fontFile, familyName, fontFile.name, format);

      const customFontFile: CustomFontFile = {
        id: fontId,
        name: fontFile.name,
        familyName,
        style: "normal", // TODO: Parse from font metadata
        weight: 400, // TODO: Parse from font metadata
        fileName: fontFile.name,
        blobId: fontId,
        format,
        createdAt: new Date().toISOString(),
      };

      // Load the font into the document
      await this.loadCustomFontFromBlob(customFontFile, blobUrl);

      return customFontFile;
    } catch (error) {
      console.error("Error loading custom font:", error);
      return null;
    }
  }

  // Load custom font from blob URL
  async loadCustomFontFromBlob(fontFile: CustomFontFile, blobUrl: string): Promise<boolean> {
    try {
      // Create a @font-face rule
      const fontFace = new FontFace(fontFile.familyName, `url(${blobUrl})`, {
        style: fontFile.style,
        weight: fontFile.weight.toString(),
      });

      // Load the font
      const loadedFontFace = await fontFace.load();

      // Add to document fonts
      document.fonts.add(loadedFontFace);

      this.loadedFonts.add(fontFile.familyName);

      return true;
    } catch (error) {
      console.error(`Error loading custom font ${fontFile.familyName}:`, error);
      return false;
    }
  }

  // Load all fonts for a project
  async loadProjectFonts(fonts: ProjectFont[]): Promise<void> {
    const loadPromises = fonts.map(async (font) => {
      if (font.type === "system") {
        // System fonts are already available
        this.loadedFonts.add(font.familyName);
        return true;
      } else if (font.type === "google" && font.googleFontData) {
        return await this.loadGoogleFont(font);
      } else if (font.type === "custom" && font.customFontFiles) {
        // Load all custom font files for this font family
        const results = await Promise.all(
          font.customFontFiles.map(async (fontFile) => {
            try {
              const blobUrl = await indexedDBService.getFont(fontFile.blobId);

              if (blobUrl) {
                return await this.loadCustomFontFromBlob(fontFile, blobUrl);
              }
              return false;
            } catch (error) {
              console.error(`Failed to load custom font file ${fontFile.name}:`, error);
              return false;
            }
          }),
        );

        return results.some((result) => result); // Return true if at least one file loaded successfully
      }
      return false;
    });

    await Promise.all(loadPromises);
  }

  // Get all available fonts for a project
  getAllAvailableFonts(projectFonts?: ProjectFont[]): ProjectFont[] {
    const allFonts: ProjectFont[] = [...DEFAULT_FONTS];

    console.log("allFonts:", allFonts);

    if (projectFonts) {
      // Add Google Fonts
      allFonts.push(...projectFonts.filter((font) => font.type === "google"));

      // Add Custom Fonts
      allFonts.push(...projectFonts.filter((font) => font.type === "custom"));
    }

    return allFonts;
  }

  // Check if a font is loaded
  isFontLoaded(familyName: string): boolean {
    return this.loadedFonts.has(familyName);
  }

  // Ensure a font is loaded before use
  async ensureFontLoaded(font: ProjectFont): Promise<boolean> {
    if (this.isFontLoaded(font.familyName)) {
      return true;
    }

    if (font.type === "system") {
      this.loadedFonts.add(font.familyName);
      return true;
    } else if (font.type === "google") {
      return await this.loadGoogleFont(font);
    } else if (font.type === "custom" && font.customFontFiles) {
      const results = await Promise.all(
        font.customFontFiles.map(async (fontFile) => {
          try {
            const blobUrl = await indexedDBService.getFont(fontFile.blobId);

            if (blobUrl) {
              return await this.loadCustomFontFromBlob(fontFile, blobUrl);
            }
            return false;
          } catch (error) {
            console.error(`Failed to load custom font file ${fontFile.name}:`, error);
            return false;
          }
        }),
      );

      return results.some((result) => result);
    }

    return false;
  }

  // Convert Google Font data to ProjectFont
  googleFontToProjectFont(googleFont: GoogleFont): ProjectFont {
    return {
      id: `google-${googleFont.family.toLowerCase().replace(/\s+/g, "-")}`,
      type: "google",
      familyName: googleFont.family,
      displayName: googleFont.family,
      category: googleFont.category,
      variants: googleFont.variants,
      googleFontData: googleFont,
      isLoaded: this.isFontLoaded(googleFont.family),
      isLoading: false,
    };
  }

  // Convert custom font files to ProjectFont
  customFontFilesToProjectFont(fontFiles: CustomFontFile[], familyName: string): ProjectFont {
    // Determine category based on family name (basic heuristics)
    let category: "serif" | "sans-serif" | "display" | "handwriting" | "monospace" = "sans-serif";
    const lowerName = familyName.toLowerCase();

    if (lowerName.includes("serif") && !lowerName.includes("sans")) {
      category = "serif";
    } else if (lowerName.includes("mono") || lowerName.includes("courier")) {
      category = "monospace";
    } else if (lowerName.includes("script") || lowerName.includes("cursive") || lowerName.includes("handwriting")) {
      category = "handwriting";
    } else if (lowerName.includes("display") || lowerName.includes("decorative")) {
      category = "display";
    }

    return {
      id: `custom-${familyName.toLowerCase().replace(/\s+/g, "-")}`,
      type: "custom",
      familyName,
      displayName: familyName,
      category,
      variants: fontFiles.map((f) => f.weight.toString()),
      customFontFiles: fontFiles,
      isLoaded: this.isFontLoaded(familyName),
      isLoading: false,
    };
  }

  // Clean up loaded fonts (remove from document and memory)
  cleanup(): void {
    this.loadedFonts.clear();
    this.loadedGoogleFonts.clear();

    // Remove Google Fonts links
    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');

    fontLinks.forEach((link) => link.remove());

    // Note: Custom fonts loaded via FontFace API remain in document.fonts
    // and can be removed manually if needed
  }
}

// Export singleton instance
export const fontService = FontService.getInstance();
