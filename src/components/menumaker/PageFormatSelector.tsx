/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import { ArrowLeft, Check, Download, Plus, Upload, X } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

import { fontService } from "../../lib/fontService";
import { useMenuMakerStore } from "../../stores/menumaker";
import { DEFAULT_FONTS, GoogleFont, ProjectFont } from "../../types/menumaker";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface PageFormatSelectorProps {
  onFormatSelected: () => void;
  onReturn: () => void;
}

export function PageFormatSelector({ onFormatSelected, onReturn }: PageFormatSelectorProps) {
  const [selectedFormat, setSelectedFormat] = useState("A4");
  const [customWidth, setCustomWidth] = useState(210);
  const [customHeight, setCustomHeight] = useState(297);
  const [projectName, setProjectName] = useState("Untitled Menu");

  // Font selection state
  const [selectedFonts, setSelectedFonts] = useState<ProjectFont[]>([...DEFAULT_FONTS]);
  const [showGoogleFonts, setShowGoogleFonts] = useState(false);
  const [showFontSelection, setShowFontSelection] = useState(false);
  const [googleFonts, setGoogleFonts] = useState<GoogleFont[]>([]);
  const [isLoadingGoogleFonts, setIsLoadingGoogleFonts] = useState(false);
  const [isUploadingFont, setIsUploadingFont] = useState(false);

  const { createProject } = useMenuMakerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Google Fonts
  const loadGoogleFonts = useCallback(async () => {
    setIsLoadingGoogleFonts(true);
    try {
      const fonts = await fontService.getGoogleFonts(100);

      setGoogleFonts(fonts);
      setShowGoogleFonts(true);
    } catch (error) {
      console.error("Failed to load Google Fonts:", error);
    } finally {
      setIsLoadingGoogleFonts(false);
    }
  }, []);

  // Add Google Font to selection
  const handleAddGoogleFont = async (googleFont: GoogleFont) => {
    const projectFont = fontService.googleFontToProjectFont(googleFont);

    // Check if already added
    const exists = selectedFonts.some((font) => font.id === projectFont.id);

    if (exists) return;

    setSelectedFonts((prev) => [...prev, projectFont]);
  };

  // Handle custom font upload
  const handleCustomFontUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) return;

    setIsUploadingFont(true);

    try {
      for (const file of Array.from(files)) {
        const customFontFile = await fontService.loadCustomFont(file);

        if (customFontFile) {
          // Check if a font with this family name already exists
          const existingFontIndex = selectedFonts.findIndex((font) => font.familyName === customFontFile.familyName);

          if (existingFontIndex >= 0) {
            // Add to existing font family
            const existingFont = selectedFonts[existingFontIndex];
            const updatedFont = {
              ...existingFont,
              customFontFiles: [...(existingFont.customFontFiles || []), customFontFile],
              variants: [...new Set([...existingFont.variants, customFontFile.weight.toString()])],
              isLoaded: true,
            };

            setSelectedFonts((prev) => prev.map((font, index) => (index === existingFontIndex ? updatedFont : font)));
          } else {
            // Create new font family
            const projectFont = fontService.customFontFilesToProjectFont([customFontFile], customFontFile.familyName);

            projectFont.isLoaded = true;
            setSelectedFonts((prev) => [...prev, projectFont]);
          }
        }
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

  // Remove font from selection
  const handleRemoveFont = (fontId: string) => {
    setSelectedFonts((prev) => prev.filter((font) => font.id !== fontId));
  };

  const handleCreateProject = async () => {
    try {
      // Create project with selected format and fonts
      if (selectedFormat === "CUSTOM") {
        await createProject(projectName, selectedFormat, customWidth, customHeight);
      } else {
        await createProject(projectName, selectedFormat);
      }

      // Add selected fonts to the project
      const { project } = useMenuMakerStore.getState();

      if (project) {
        // Separate fonts by type
        const googleFontsToAdd = selectedFonts.filter((font) => font.type === "google");
        const customFontsToAdd = selectedFonts.filter((font) => font.type === "custom");

        // Add Google Fonts
        for (const googleFont of googleFontsToAdd) {
          if (googleFont.googleFontData) {
            await useMenuMakerStore.getState().addGoogleFont(googleFont.googleFontData);
          }
        }

        // Add Custom Fonts (they're already saved to IndexedDB during upload)
        // We just need to update the project's font list
        if (customFontsToAdd.length > 0) {
          const updatedProject = {
            ...project,
            fonts: {
              ...project.fonts,
              customFonts: [...project.fonts.customFonts, ...customFontsToAdd],
            },
            updatedAt: new Date().toISOString(),
          };

          // Save the updated project
          try {
            useMenuMakerStore.setState({ project: updatedProject });
            await useMenuMakerStore.getState().saveProject();
          } catch (error) {
            console.error("Failed to save project with custom fonts:", error);
          }
        }
      }

      onFormatSelected();
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" size="sm" onClick={onReturn}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
        <div></div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Menu</h1>
        <p className="text-gray-600 dark:text-gray-300">Configure your menu project settings</p>
      </div>

      {/* Project Name */}
      <div className="mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Project Details</h2>
          <div>
            <Label htmlFor="project-name" className="text-gray-700 dark:text-gray-300 font-medium">
              Project Name
            </Label>
            <Input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-2"
              placeholder="Enter project name..."
            />
          </div>
        </Card>
      </div>

      {/* Page Format Selection */}
      <div className="mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Page Format</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* A4 Format */}
            <Card
              className={`p-4 cursor-pointer transition-all ${
                selectedFormat === "A4"
                  ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setSelectedFormat("A4")}
            >
              <div className="text-center">
                <div className="w-16 h-20 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded mx-auto mb-3 relative">
                  {selectedFormat === "A4" && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">A4</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">210 × 297 mm</p>
              </div>
            </Card>

            {/* A5 Format */}
            <Card
              className={`p-4 cursor-pointer transition-all ${
                selectedFormat === "A5"
                  ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setSelectedFormat("A5")}
            >
              <div className="text-center">
                <div className="w-12 h-16 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded mx-auto mb-3 relative">
                  {selectedFormat === "A5" && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">A5</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">148 × 210 mm</p>
              </div>
            </Card>

            {/* Custom Format */}
            <Card
              className={`p-4 cursor-pointer transition-all ${
                selectedFormat === "CUSTOM"
                  ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setSelectedFormat("CUSTOM")}
            >
              <div className="text-center">
                <div className="w-14 h-18 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-400 dark:border-gray-500 rounded mx-auto mb-3 relative flex items-center justify-center">
                  {selectedFormat === "CUSTOM" && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">Custom</span>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Custom</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Set your own size</p>
              </div>
            </Card>
          </div>

          {/* Custom dimensions */}
          {selectedFormat === "CUSTOM" && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custom-width" className="text-gray-700 dark:text-gray-300 font-medium">
                  Width (mm)
                </Label>
                <Input
                  id="custom-width"
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  min={50}
                  max={1000}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="custom-height" className="text-gray-700 dark:text-gray-300 font-medium">
                  Height (mm)
                </Label>
                <Input
                  id="custom-height"
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  min={50}
                  max={1000}
                  className="mt-2"
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Font Selection */}
      <div className="mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Fonts</h2>
            <Button variant="outline" size="sm" onClick={() => setShowFontSelection(!showFontSelection)}>
              {showFontSelection ? "Hide" : "Manage"} Fonts
            </Button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Default system fonts are included. Add Google Fonts or upload custom fonts for your project.
          </p>

          {/* Current font count */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {selectedFonts.length} fonts selected ({selectedFonts.filter((f) => f.type === "system").length} system,{" "}
            {selectedFonts.filter((f) => f.type === "google").length} Google,{" "}
            {selectedFonts.filter((f) => f.type === "custom").length} custom)
          </div>

          {showFontSelection && (
            <div className="space-y-4">
              {/* Font Management Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadGoogleFonts} disabled={isLoadingGoogleFonts}>
                  <Download className="w-4 h-4 mr-2" />
                  {isLoadingGoogleFonts ? "Loading..." : "Add Google Fonts"}
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
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFont}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploadingFont ? "Uploading..." : "Upload Custom Fonts"}
                </Button>
              </div>

              {/* Selected Fonts List */}
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-3">
                <div className="space-y-2">
                  {selectedFonts.map((font) => (
                    <div
                      key={font.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{font.displayName}</span>
                        <span
                          className={`ml-2 px-2 py-1 text-xs rounded ${
                            font.type === "system"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : font.type === "google"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                          }`}
                        >
                          {font.type}
                        </span>
                      </div>
                      {font.type !== "system" && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFont(font.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Create Button */}
      <div className="text-center">
        <Button
          onClick={handleCreateProject}
          size="lg"
          className="px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          disabled={!projectName.trim()}
        >
          Create Menu Project
        </Button>
      </div>

      {/* Google Fonts Modal */}
      {showGoogleFonts && (
        <GoogleFontsModal
          googleFonts={googleFonts}
          selectedFonts={selectedFonts}
          onAddFont={handleAddGoogleFont}
          onClose={() => setShowGoogleFonts(false)}
        />
      )}

      {/* Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          All formats are optimized for 300 DPI printing quality
        </p>
      </div>
    </div>
  );
}

// Google Fonts Modal Component
interface GoogleFontsModalProps {
  googleFonts: GoogleFont[];
  selectedFonts: ProjectFont[];
  onAddFont: (font: GoogleFont) => void;
  onClose: () => void;
}

function GoogleFontsModal({ googleFonts, selectedFonts, onAddFont, onClose }: GoogleFontsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredGoogleFonts = googleFonts.filter((font) => {
    const matchesSearch = font.family.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || font.category === selectedCategory;
    const notAlreadySelected = !selectedFonts.some(
      (selected) => selected.type === "google" && selected.googleFontData?.family === font.family,
    );

    return matchesSearch && matchesCategory && notAlreadySelected;
  });

  const categories = Array.from(new Set(googleFonts.map((font) => font.category)));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Google Fonts</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search Google Fonts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
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
                  <Plus className="w-4 h-4 mr-2" />
                  Add Font
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
