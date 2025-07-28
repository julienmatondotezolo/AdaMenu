/* eslint-disable no-unused-vars */
import { Download, Search, Trash2, Type, Upload } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

import { fontService } from "../../../lib/fontService";
import { useMenuMakerStore } from "../../../stores/menumaker";
import { GoogleFont, ProjectFont } from "../../../types/menumaker";
import { Button } from "../../ui/button";

export function FontManagementPanel() {
  const { project, getAllAvailableFonts, addGoogleFont, addCustomFont, removeFont, ensureFontLoaded, refetchFontsFromIndexedDB } =
    useMenuMakerStore();
  const [activeTab, setActiveTab] = useState<"all" | "system" | "google" | "custom">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingGoogleFonts, setIsLoadingGoogleFonts] = useState(false);
  const [googleFonts, setGoogleFonts] = useState<GoogleFont[]>([]);
  const [isUploadingFont, setIsUploadingFont] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [isRefreshingFonts, setIsRefreshingFonts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableFonts = getAllAvailableFonts();

  // Refetch fonts from IndexedDB when component mounts
  React.useEffect(() => {
    const refetchFonts = async () => {
      setIsRefreshingFonts(true);
      try {
        await refetchFontsFromIndexedDB();
      } catch (error) {
        console.warn('Failed to refetch fonts from IndexedDB:', error);
      } finally {
        setIsRefreshingFonts(false);
      }
    };

    refetchFonts();
  }, [refetchFontsFromIndexedDB]);

  // Filter fonts based on active tab and search query
  const filteredFonts = availableFonts.filter((font) => {
    const matchesTab = activeTab === "all" || font.type === activeTab;
    const matchesSearch = font.displayName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Debug IndexedDB
  const handleDebugIndexedDB = async () => {
    try {
      if (typeof window !== "undefined" && (window as any).debugIndexedDB) {
        await (window as any).debugIndexedDB();
      } else {
        // Fallback debug method
        const { indexedDBService } = await import("../../../lib/indexedDBService");
        const debug = await indexedDBService.debugIndexedDB();

        // Create a simple alert with debug info instead of console.log
        const debugInfo = `
IndexedDB Debug Info:
- Supported: ${debug.isSupported ? "✅" : "❌"}
- Initialized: ${debug.isInitialized ? "✅" : "❌"}
- Database: ${debug.dbName} v${debug.version}
- Stores: ${debug.stores.join(", ")}
- Font Count: ${debug.fontCount}
- Fonts: ${debug.fonts.map((f) => `${f.familyName} (${f.fileName})`).join(", ")}
        `;

        // eslint-disable-next-line no-alert
        alert(debugInfo);
      }
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(`Debug failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Manual font refresh
  const handleRefreshFonts = async () => {
    setIsRefreshingFonts(true);
    try {
      await refetchFontsFromIndexedDB();
      // eslint-disable-next-line no-alert
      alert('Fonts refreshed successfully from IndexedDB!');
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(`Failed to refresh fonts: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsRefreshingFonts(false);
    }
  };

  // Test font functionality
  const handleTestFontSystem = async () => {
    try {
      const { indexedDBService } = await import("../../../lib/indexedDBService");

      // Test IndexedDB initialization
      await indexedDBService.init();

      // Get current font count
      const allFonts = await indexedDBService.getAllFonts();

      // eslint-disable-next-line no-alert
      alert(`Font System Test Results:
✅ IndexedDB initialized successfully
✅ Found ${allFonts.length} fonts in storage
✅ Font management system is working

You can now:
1. Upload custom fonts (.woff, .woff2, .ttf, .otf)
2. Browse and add Google Fonts
3. Preview fonts in real-time
4. Use fonts in your menu designs`);
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(`Font System Test Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Load Google Fonts for selection
  const loadGoogleFonts = useCallback(async () => {
    setIsLoadingGoogleFonts(true);
    try {
      const fonts = await fontService.getGoogleFonts(100);

      setGoogleFonts(fonts);
    } catch (error) {
      console.error("Failed to load Google Fonts:", error);
    } finally {
      setIsLoadingGoogleFonts(false);
    }
  }, []);

  // Add Google Font to project
  const handleAddGoogleFont = async (googleFont: GoogleFont) => {
    try {
      await addGoogleFont(googleFont);
    } catch (error) {
      console.error("Failed to add Google Font:", error);
    }
  };

  // Handle custom font upload
  const handleCustomFontUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) return;

    setIsUploadingFont(true);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      for (const file of Array.from(files)) {
        try {
          const customFont = await addCustomFont(file);

          if (customFont) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`Failed to upload ${file.name}: Unknown error`);
          }
        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : "Unknown error";

          results.errors.push(`Failed to upload ${file.name}: ${errorMessage}`);
        }
      }

      // Show results to user
      if (results.success > 0) {
        // You could replace this with a toast notification
        // eslint-disable-next-line no-alert
        alert(`Successfully uploaded ${results.success} font${results.success !== 1 ? "s" : ""}`);
      }

      if (results.failed > 0) {
        // eslint-disable-next-line no-alert
        alert(
          `Failed to upload ${results.failed} font${results.failed !== 1 ? "s" : ""}:\n${results.errors.join("\n")}`,
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(`Font upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploadingFont(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove font from project
  const handleRemoveFont = async (fontId: string) => {
    if (confirm("Are you sure you want to remove this font from the project?")) {
      try {
        await removeFont(fontId);
      } catch (error) {
        console.error("Failed to remove font:", error);
      }
    }
  };

  // Ensure font is loaded for preview
  const handleFontPreview = async (font: ProjectFont) => {
    try {
      await ensureFontLoaded(font);
    } catch (error) {
      console.error("Failed to load font for preview:", error);
    }
  };

  if (!project) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <Type size={48} className="mx-auto mb-4 opacity-50" />
        <p>No project loaded</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
          {[
            { key: "all", label: "All" },
            { key: "system", label: "System" },
            { key: "google", label: "Google" },
            { key: "custom", label: "Custom" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === key
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search fonts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button onClick={loadGoogleFonts} disabled={isLoadingGoogleFonts} className="flex-1" variant="outline">
            <Download size={16} className="mr-2" />
            <p className="text-xs">{isLoadingGoogleFonts ? "Loading..." : "Browse Google Fonts"}</p>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".woff,.woff2,.ttf,.otf"
            multiple
            onChange={handleCustomFontUpload}
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingFont}
            className="flex-1"
            variant="outline"
          >
            <Upload size={16} className="mr-2" />
            <p className="text-xs">{isUploadingFont ? "Uploading..." : "Upload Fonts"}</p>
          </Button>
        </div>

        {/* Debug Controls */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {showDebugInfo ? "Hide" : "Show"} Debug Info
          </button>

          {showDebugInfo && (
            <div className="flex space-x-2">
              <button
                onClick={handleRefreshFonts}
                disabled={isRefreshingFonts}
                className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50"
              >
                {isRefreshingFonts ? 'Refreshing...' : 'Refresh Fonts'}
              </button>
              <button
                onClick={handleTestFontSystem}
                className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              >
                Test System
              </button>
              <button
                onClick={handleDebugIndexedDB}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Debug IndexedDB
              </button>
            </div>
          )}
        </div>

        {/* Debug Information Display */}
        {showDebugInfo && (
          <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            <div className="grid grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
              <div>Total Fonts: {availableFonts.length}</div>
              <div>Custom Fonts: {availableFonts.filter((f) => f.type === "custom").length}</div>
              <div>Google Fonts: {availableFonts.filter((f) => f.type === "google").length}</div>
              <div>System Fonts: {availableFonts.filter((f) => f.type === "system").length}</div>
              <div>Loaded Fonts: {availableFonts.filter((f) => f.isLoaded).length}</div>
              <div>IndexedDB: {typeof window !== "undefined" && typeof indexedDB !== "undefined" ? "✅" : "❌"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Font List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-3">
          {isRefreshingFonts && (
            <div className="text-center py-4 text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
              <p className="text-sm">Refreshing fonts from IndexedDB...</p>
            </div>
          )}
          
          {!isRefreshingFonts && filteredFonts.map((font) => (
            <FontCard
              key={font.id}
              font={font}
              onPreview={handleFontPreview}
              onRemove={font.type !== "system" ? handleRemoveFont : undefined}
            />
          ))}

          {!isRefreshingFonts && filteredFonts.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Type size={48} className="mx-auto mb-4 opacity-50" />
              <p>No fonts found</p>
              {searchQuery && <p className="text-sm mt-2">Try adjusting your search or browse Google Fonts</p>}
            </div>
          )}
        </div>
      </div>

      {/* Google Fonts Modal */}
      {googleFonts.length > 0 && (
        <GoogleFontsModal
          googleFonts={googleFonts}
          onAddFont={handleAddGoogleFont}
          onClose={() => setGoogleFonts([])}
        />
      )}
    </div>
  );
}

// Font Card Component
interface FontCardProps {
  font: ProjectFont;
  onPreview: (font: ProjectFont) => void;
  onRemove?: (fontId: string) => void;
}

function FontCard({ font, onPreview, onRemove }: FontCardProps) {
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handlePreviewClick = async () => {
    if (isPreviewLoaded || isLoading) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      await onPreview(font);
      setIsPreviewLoaded(true);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load font");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load preview for already loaded fonts
  React.useEffect(() => {
    if (font.isLoaded && !isPreviewLoaded && !isLoading) {
      setIsPreviewLoaded(true);
    }
  }, [font.isLoaded, isPreviewLoaded, isLoading]);

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{font.displayName}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                font.type === "system"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  : font.type === "google"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
              }`}
            >
              {font.type}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{font.category}</span>
            {font.isLoaded && (
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full" title="Font loaded"></span>
            )}
            {loadError && (
              <span className="text-xs text-red-500" title={loadError}>
                ⚠️
              </span>
            )}
          </div>

          {/* Debug info for custom fonts */}
          {font.type === "custom" && font.customFontFiles && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {font.customFontFiles.length} file{font.customFontFiles.length !== 1 ? "s" : ""}
              {font.customFontFiles.map((file) => ` • ${file.fileName}`).join("")}
            </div>
          )}
        </div>

        <div className="flex space-x-1">
          {onRemove && (
            <button
              onClick={() => onRemove(font.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove font"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Font Preview */}
      <div
        className={`p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors relative ${
          isLoading ? "opacity-50" : ""
        }`}
        onClick={handlePreviewClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePreviewClick();
          }
        }}
        role="button"
        tabIndex={0}
        style={{
          fontFamily: isPreviewLoaded ? font.familyName : "inherit",
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 flex items-center justify-center rounded">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        <p className="text-lg text-gray-900 dark:text-white">The quick brown fox jumps over the lazy dog</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 1234567890
        </p>

        {!isPreviewLoaded && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-90 rounded">
            <span className="text-sm text-gray-600 dark:text-gray-300">Click to preview</span>
          </div>
        )}
      </div>

      {/* Variants */}
      {font.variants.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available weights:</p>
          <div className="flex flex-wrap gap-1">
            {Array.from(new Set(font.variants)).map((variant, index) => (
              <span
                key={`${font.id}-variant-${variant}-${index}`}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                {variant}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Google Fonts Modal Component
interface GoogleFontsModalProps {
  googleFonts: GoogleFont[];
  onAddFont: (font: GoogleFont) => void;
  onClose: () => void;
}

function GoogleFontsModal({ googleFonts, onAddFont, onClose }: GoogleFontsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredGoogleFonts = googleFonts.filter((font) => {
    const matchesSearch = font.family.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || font.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(googleFonts.map((font) => font.category)));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Google Fonts</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              ✕
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search Google Fonts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-4">
            {filteredGoogleFonts.map((font) => (
              <div
                key={font.family}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{font.family}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{font.category}</p>
                </div>

                <Button onClick={() => onAddFont(font)} size="sm" variant="outline">
                  Add to Project
                </Button>
              </div>
            ))}
          </div>

          {filteredGoogleFonts.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No fonts found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
