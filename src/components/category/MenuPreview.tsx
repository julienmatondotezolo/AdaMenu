/* eslint-disable prettier/prettier */
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import React, { useEffect, useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { CanvasArea } from "../menumaker/CanvasArea";
import { Button } from "../ui/button";

interface MenuPreviewProps {
  categories?: any[];
  selectedCategoryId?: string;
  selectedSubCategoryId?: string;
}

export function MenuPreview({ categories, selectedCategoryId, selectedSubCategoryId }: MenuPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const { project, currentPageId, setMenuData, menuData, setTool, loadFirstProject } = useMenuMakerStore();

  // Set tool to select for preview mode (read-only) and load first project
  useEffect(() => {
    setTool("select");
    
    // Load first project if no project is currently loaded
    if (!project) {
      loadFirstProject();
    }
  }, [setTool, loadFirstProject, project]);

  // Update menu data when categories change
  useEffect(() => {
    if (categories && Array.isArray(categories) && categories.length > 0) {
      // Transform categories data to match the store format with proper validation
      const transformedCategories = categories.map((category: any) => ({
        ...category,
        subCategories: Array.isArray(category.subCategories)
          ? category.subCategories.map((sub: any) => ({
            ...sub,
            menuItems: Array.isArray(sub.menuItems) ? sub.menuItems : [],
          }))
          : [],
      }));

      setMenuData(transformedCategories);
    } else {
      // Clear menu data if categories are invalid
      setMenuData([]);
    }
  }, [categories, setMenuData]);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!isVisible) {
    return (
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
        <Button
          onClick={handleToggleVisibility}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full p-3"
          title="Show Menu Preview"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`fixed right-0 top-0 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl transition-all duration-300 ease-in-out z-30 ${
        isExpanded ? "w-2/5" : "w-80"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Menu Preview</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {project ? project.name : "Live menu visualization"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={handleToggleExpanded}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={isExpanded ? "Collapse Preview" : "Expand Preview"}
          >
            {isExpanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          <Button
            onClick={handleToggleVisibility}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Hide Preview"
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 h-full overflow-hidden">
        {project && currentPageId ? (
          <div className="h-full">
            <CanvasArea />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Menu Project</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Create a menu project in MenuMaker to see the preview here.
            </p>
            <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
              <p>Selected Category: {selectedCategoryId || "None"}</p>
              <p>Selected Subcategory: {selectedSubCategoryId || "None"}</p>
              <p>Available Categories: {categories?.length || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Categories: {categories?.length || 0}</span>
          <span>Menu Items: {menuData.menuItems?.length || 0}</span>
        </div>
        {project && (
          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">
            Project: {project.name} ({project.pages.length} page{project.pages.length !== 1 ? 's' : ''})
          </div>
        )}
      </div>
    </div>
  );
}
