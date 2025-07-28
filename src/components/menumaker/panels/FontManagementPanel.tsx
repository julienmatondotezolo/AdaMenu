/* eslint-disable no-unused-vars */
import { Download, Search, Trash2, Type, Upload } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

import { fontService } from "../../../lib/fontService";
import { useMenuMakerStore } from "../../../stores/menumaker";
import { GoogleFont, ProjectFont } from "../../../types/menumaker";
import { Button } from "../../ui/button";

export function FontManagementPanel() {
  const { project, getAllAvailableFonts, addGoogleFont, addCustomFont, removeFont, ensureFontLoaded } =
    useMenuMakerStore();
  const [activeTab, setActiveTab] = useState<"all" | "system" | "google" | "custom">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingGoogleFonts, setIsLoadingGoogleFonts] = useState(false);
  const [googleFonts, setGoogleFonts] = useState<GoogleFont[]>([]);
  const [isUploadingFont, setIsUploadingFont] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableFonts = getAllAvailableFonts();

  // Filter fonts based on active tab and search query
  const filteredFonts = availableFonts.filter((font) => {
    const matchesTab = activeTab === "all" || font.type === activeTab;
    const matchesSearch = font.displayName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

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

    try {
      for (const file of Array.from(files)) {
        await addCustomFont(file);
      }
    } catch (error) {
      console.error("Failed to upload custom font:", error);
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Font Management</h2>

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
            {isLoadingGoogleFonts ? "Loading..." : "Browse Google Fonts"}
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
            {isUploadingFont ? "Uploading..." : "Upload Fonts"}
          </Button>
        </div>
      </div>

      {/* Font List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-3">
          {filteredFonts.map((font) => (
            <FontCard
              key={font.id}
              font={font}
              onPreview={handleFontPreview}
              onRemove={font.type !== "system" ? handleRemoveFont : undefined}
            />
          ))}

          {filteredFonts.length === 0 && (
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

  const handlePreviewClick = async () => {
    if (!isPreviewLoaded) {
      await onPreview(font);
      setIsPreviewLoaded(true);
    }
  };

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
          </div>
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
        className="p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
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
        <p className="text-lg text-gray-900 dark:text-white">The quick brown fox jumps over the lazy dog</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 1234567890
        </p>
      </div>

      {/* Variants */}
      {font.variants.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available weights:</p>
          <div className="flex flex-wrap gap-1">
            {font.variants.map((variant) => (
              <span
                key={variant}
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
