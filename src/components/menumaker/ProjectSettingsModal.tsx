/* eslint-disable no-unused-vars */
import { Check, Copy, Download, Eye, EyeOff, Key, Search, Settings, Trash2, Type, Upload, X } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

import { fontService } from "../../lib/fontService";
import { useMenuMakerStore } from "../../stores/menumaker";
import { GoogleFont, ProjectFont } from "../../types/menumaker";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSettingsModal({ isOpen, onClose }: ProjectSettingsModalProps) {
  const {
    project,
    updateProjectName,
    getAllAvailableFonts,
    addGoogleFont,
    addCustomFont,
    removeFont,
    ensureFontLoaded,
  } = useMenuMakerStore();
  const [activeTab, setActiveTab] = useState<"general" | "fonts" | "api">("general");
  const [projectName, setProjectName] = useState(project?.name || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Font management state
  const [fontTab, setFontTab] = useState<"all" | "system" | "google" | "custom">("all");
  const [fontSearchQuery, setFontSearchQuery] = useState("");
  const [isLoadingGoogleFonts, setIsLoadingGoogleFonts] = useState(false);
  const [googleFonts, setGoogleFonts] = useState<GoogleFont[]>([]);
  const [isUploadingFont, setIsUploadingFont] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get API key from environment (for display purposes)
  const googleFontsApiKey = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;

  const handleSaveProjectName = () => {
    if (projectName.trim() && project && projectName.trim() !== project.name) {
      updateProjectName(projectName.trim());
    }
  };

  const handleCopyApiKey = async () => {
    if (googleFontsApiKey) {
      await navigator.clipboard.writeText(googleFontsApiKey);
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
    }
  };

  // Font management functions
  const availableFonts = getAllAvailableFonts();

  const filteredFonts = availableFonts.filter((font) => {
    const matchesTab = fontTab === "all" || font.type === fontTab;
    const matchesSearch = font.displayName.toLowerCase().includes(fontSearchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

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

  const handleAddGoogleFont = async (googleFont: GoogleFont) => {
    try {
      await addGoogleFont(googleFont);
    } catch (error) {
      console.error("Failed to add Google Font:", error);
    }
  };

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

  const handleRemoveFont = async (fontId: string) => {
    if (confirm("Are you sure you want to remove this font from the project?")) {
      try {
        await removeFont(fontId);
      } catch (error) {
        console.error("Failed to remove font:", error);
      }
    }
  };

  const tabs = [
    { key: "general", label: "General", icon: Settings },
    { key: "fonts", label: "Fonts", icon: Type },
  ] as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your project configuration and preferences
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === key
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Information</h3>

                  <Card className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="project-name"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Project Name
                        </label>
                        <div className="flex gap-2">
                          <Input
                            id="project-name"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Enter project name"
                            className="flex-1"
                          />
                          <Button
                            onClick={handleSaveProjectName}
                            disabled={!projectName.trim() || projectName === project?.name}
                            size="sm"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>

                      {project && (
                        <>
                          <div>
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Created
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(project.createdAt).toLocaleDateString()} at{" "}
                              {new Date(project.createdAt).toLocaleTimeString()}
                            </p>
                          </div>

                          <div>
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Last Modified
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(project.updatedAt).toLocaleDateString()} at{" "}
                              {new Date(project.updatedAt).toLocaleTimeString()}
                            </p>
                          </div>

                          <div>
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Pages
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {project.pages.length} page{project.pages.length !== 1 ? "s" : ""}
                            </p>
                          </div>

                          <div>
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Fonts
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {project.fonts.defaultFonts.length +
                                project.fonts.customFonts.length +
                                project.fonts.googleFonts.length}{" "}
                              font
                              {project.fonts.defaultFonts.length +
                                project.fonts.customFonts.length +
                                project.fonts.googleFonts.length !==
                              1
                                ? "s"
                                : ""}{" "}
                              configured
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "fonts" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Font Management</h3>

                  <Card className="p-4">
                    <div className="space-y-4">
                      {/* Font Tabs */}
                      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        {[
                          { key: "all", label: "All" },
                          { key: "custom", label: "Custom" },
                          { key: "google", label: "Google" },
                          { key: "system", label: "System" },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setFontTab(key as any)}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                              fontTab === key
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <Input
                          type="text"
                          placeholder="Search fonts..."
                          value={fontSearchQuery}
                          onChange={(e) => setFontSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={loadGoogleFonts}
                          disabled={isLoadingGoogleFonts}
                          className="flex-1"
                          variant="outline"
                        >
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

                      {/* Font List */}
                      <div className="max-h-64 overflow-y-auto space-y-3 pb-20">
                        {filteredFonts.map((font) => (
                          <FontCard
                            key={font.id}
                            font={font}
                            onRemove={font.type !== "system" ? handleRemoveFont : undefined}
                          />
                        ))}

                        {filteredFonts.length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Type size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No fonts found</p>
                            {fontSearchQuery && (
                              <p className="text-sm mt-2">Try adjusting your search or browse Google Fonts</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
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
    </div>
  );
}

// Font Card Component
interface FontCardProps {
  font: ProjectFont;
  onRemove?: (_fontId: string) => void;
}

function FontCard({ font, onRemove }: FontCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">{font.displayName}</h3>
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
              <Trash2 size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Variants */}
      {font.variants.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weights:</p>
          <div className="flex flex-wrap gap-1">
            {Array.from(new Set(font.variants))
              .slice(0, 4)
              .map((variant, index) => (
                <span
                  key={`${font.id}-variant-${variant}-${index}`}
                  className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  {variant}
                </span>
              ))}
            {font.variants.length > 4 && (
              <span className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                +{font.variants.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Google Fonts Modal Component
interface GoogleFontsModalProps {
  googleFonts: GoogleFont[];
  onAddFont: (_font: GoogleFont) => void;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Google Fonts</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Search Google Fonts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
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
