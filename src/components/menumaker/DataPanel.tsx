import { Database } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";

import { fetchCategories, fetchMenuItemByCategoryId } from "../../_services/ada/adaMenuService";
import { useMenuMakerStore } from "../../stores/menumaker";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
}

interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  subCategoryId?: string;
  description?: string;
  price?: number;
}

export function DataPanel() {
  const { currentPageId, project, addElement, updateElement, editorState } = useMenuMakerStore();

  // Data states
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Fetch categories using the same logic as Categories.tsx
  const fetchAllCategories = () => fetchCategories();
  const { data: categories } = useQuery("categories", fetchAllCategories, {
    refetchOnWindowFocus: false,
    select: (data) => data.sort((a: any, b: any) => a.order - b.order),
  });

  // Selection states
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedSubCategoryData, setSelectedSubCategoryData] = useState<any>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("");
  const [availableSubCategories, setAvailableSubCategories] = useState<any[]>([]);

  // Data type selection
  const [selectedDataType, setSelectedDataType] = useState<"category" | "subcategory" | "menuitem">("category");

  // Style properties
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderSize, setBorderSize] = useState(1);
  const [borderType, setBorderType] = useState<"solid" | "dashed" | "dotted">("solid");
  const [borderRadius, setBorderRadius] = useState(0);
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(12);

  // Get selected data element if any
  const selectedDataElement = React.useMemo(() => {
    if (!project || !currentPageId || editorState.selectedElementIds.length !== 1) return null;

    const currentPage = project.pages.find((page) => page.id === currentPageId);

    if (!currentPage) return null;

    const selectedElement = currentPage.layers
      .flatMap((layer) => layer.elements)
      .find((element) => editorState.selectedElementIds.includes(element.id) && element.type === "data");

    return selectedElement?.type === "data" ? selectedElement : null;
  }, [project, currentPageId, editorState.selectedElementIds]);

  const isEditingMode = !!selectedDataElement;

  // Load menu items when category changes
  useEffect(() => {
    if (selectedCategory && selectedDataType !== "category") {
      loadMenuItems(selectedCategory);
    }
  }, [selectedCategory, selectedDataType]);

  // Populate form when editing an existing element (prevent infinite loops)
  const [isPopulatingForm, setIsPopulatingForm] = useState(false);

  useEffect(() => {
    if (selectedDataElement && !isPopulatingForm) {
      setIsPopulatingForm(true);

      setSelectedDataType(selectedDataElement.dataType || "category");
      setBackgroundColor(selectedDataElement.backgroundColor || "#ffffff");
      setBorderColor(selectedDataElement.borderColor || "#000000");
      setBorderSize(selectedDataElement.borderSize || 1);
      setBorderType(selectedDataElement.borderType || "solid");
      setBorderRadius(selectedDataElement.borderRadius || 0);
      setTextColor(selectedDataElement.textColor || "#000000");
      setFontSize(selectedDataElement.fontSize || 64);

      // Set data selection based on dataId
      if (selectedDataElement.dataId) {
        if (selectedDataElement.dataType === "category") {
          setSelectedCategory(selectedDataElement.dataId);
          setSelectedCategoryData(selectedDataElement.categoryData || null);
        } else if (selectedDataElement.dataType === "subcategory") {
          setSelectedSubCategory(selectedDataElement.dataId);
          setSelectedSubCategoryData(selectedDataElement.subcategoryData || null);
          // If subcategory is selected, also populate the parent category for the dropdown
          if (selectedDataElement.subcategoryData?.parentCategoryId) {
            setSelectedCategory(selectedDataElement.subcategoryData.parentCategoryId);
            const parentCategory = categories?.find(
              (cat: any) => cat.id === selectedDataElement.subcategoryData.parentCategoryId,
            );

            setSelectedCategoryData(parentCategory || null);
            setAvailableSubCategories(parentCategory?.subCategories || []);
          }
        } else if (selectedDataElement.dataType === "menuitem") {
          setSelectedMenuItem(selectedDataElement.dataId);
        }
      }

      // Reset flag after a brief delay
      setTimeout(() => setIsPopulatingForm(false), 50);
    } else if (!selectedDataElement) {
      setIsPopulatingForm(false);
    }
  }, [selectedDataElement]);

  // Update element automatically when properties change (only in editing mode)
  useEffect(() => {
    if (isEditingMode && selectedDataElement) {
      // Use a timeout to debounce rapid changes and prevent infinite loops
      const timeoutId = setTimeout(() => {
        updateSelectedElement();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    isEditingMode,
    selectedDataType,
    selectedCategory,
    selectedCategoryData,
    selectedSubCategory,
    selectedSubCategoryData,
    selectedMenuItem,
    backgroundColor,
    borderColor,
    borderSize,
    borderType,
    borderRadius,
    textColor,
    fontSize,
  ]);

  const loadMenuItems = async (categoryId: string) => {
    try {
      const data = await fetchMenuItemByCategoryId({ categoryId });

      if (data) {
        setMenuItems(data);
        // Filter subcategories if they exist in the data structure
        const uniqueSubCategories = data
          .filter((item: any) => item.subCategory)
          .map((item: any) => item.subCategory)
          .filter((subCat: any, index: number, self: any[]) => self.findIndex((s) => s.id === subCat.id) === index);

        setSubCategories(uniqueSubCategories);
      }
    } catch (error) {
      console.error("Failed to load menu items:", error);
    }
  };

  // Update selected element automatically when properties change
  const updateSelectedElement = () => {
    if (!isEditingMode || !selectedDataElement || !currentPageId || !project) return;

    const currentPage = project.pages.find((page) => page.id === currentPageId);

    if (!currentPage) return;

    let dataId = "";

    switch (selectedDataType) {
      case "category":
        dataId = selectedCategory;
        break;
      case "subcategory":
        dataId = selectedSubCategory;
        break;
      case "menuitem":
        dataId = selectedMenuItem;
        break;
    }

    const updatedElement = {
      ...selectedDataElement,
      dataType: selectedDataType,
      dataId: dataId,
      categoryData: selectedDataType === "category" ? selectedCategoryData : undefined,
      subcategoryData: selectedDataType === "subcategory" ? selectedSubCategoryData : undefined,
      backgroundColor,
      borderColor,
      borderSize,
      borderType,
      borderRadius,
      textColor,
      fontSize,
    };

    // Find the layer containing this element
    const layer = currentPage.layers.find((layer) =>
      layer.elements.some((element) => element.id === selectedDataElement.id),
    );

    if (layer) {
      updateElement(currentPageId, layer.id, selectedDataElement.id, updatedElement);
    }
  };

  const handleAddOrUpdateDataElement = () => {
    if (!currentPageId || !project) return;

    const currentPage = project.pages.find((page) => page.id === currentPageId);

    if (!currentPage || currentPage.layers.length === 0) return;

    let dataId = "";

    switch (selectedDataType) {
      case "category":
        dataId = selectedCategory;
        break;
      case "subcategory":
        dataId = selectedSubCategory;
        break;
      case "menuitem":
        dataId = selectedMenuItem;
        break;
    }

    // Only handle adding new elements (not editing)
    if (!dataId) {
      alert(`Please select a ${selectedDataType} first`);
      return;
    }

    // Create data element
    const dataElement = {
      type: "data" as const,
      x: 50,
      y: 50,
      width: 200,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: 1,
      locked: false,
      visible: true,
      opacity: 1,
      dataType: selectedDataType,
      dataId: dataId,
      backgroundColor,
      borderColor,
      borderSize,
      borderType,
      borderRadius,
      textColor,
      fontSize,
      categoryData: selectedDataType === "category" ? selectedCategoryData : undefined,
      subcategoryData: selectedDataType === "subcategory" ? selectedSubCategoryData : undefined,
    };

    // Add to first layer
    addElement(currentPageId, currentPage.layers[0].id, dataElement);
  };

  const colorPalette = [
    "#ffffff",
    "#f8f9fa",
    "#e9ecef",
    "#dee2e6",
    "#ced4da",
    "#adb5bd",
    "#6c757d",
    "#495057",
    "#343a40",
    "#212529",
    "#000000",
    "#dc3545",
    "#fd7e14",
    "#ffc107",
    "#28a745",
    "#20c997",
    "#17a2b8",
    "#007bff",
    "#6f42c1",
    "#e83e8c",
    "#fd1d53",
    "#20c9a6",
  ];

  if (!project || !currentPageId) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Data Type Selection */}
        <div>
          <Label className="text-sm font-medium">Data Type</Label>
          <select
            value={selectedDataType}
            onChange={(e) => setSelectedDataType(e.target.value as "category" | "subcategory" | "menuitem")}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
          >
            <option value="category">Category</option>
            <option value="subcategory">Subcategory</option>
            <option value="menuitem">Menu Item</option>
          </select>
        </div>

        {/* Category Selection */}
        <div>
          <Label className="text-sm font-medium">Category</Label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              const categoryId = e.target.value;

              setSelectedCategory(categoryId);
              // Find and store the full category data
              const categoryData = categories?.find((cat: any) => cat.id === categoryId);

              setSelectedCategoryData(categoryData || null);
            }}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Category</option>
            {categories?.map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.names?.en || category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Selection (only if subcategory is selected) */}
        {selectedDataType === "subcategory" && (
          <div>
            <Label className="text-sm font-medium">Subcategory</Label>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              disabled={!selectedCategory}
            >
              <option value="">Select Subcategory</option>
              {subCategories.map((subCategory: any) => (
                <option key={subCategory.id} value={subCategory.id}>
                  {subCategory.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Menu Item Selection (only if menuitem is selected) */}
        {selectedDataType === "menuitem" && (
          <div>
            <Label className="text-sm font-medium">Menu Item</Label>
            <select
              value={selectedMenuItem}
              onChange={(e) => setSelectedMenuItem(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              disabled={!selectedCategory}
            >
              <option value="">Select Menu Item</option>
              {menuItems.map((menuItem: any) => (
                <option key={menuItem.id} value={menuItem.id}>
                  {menuItem.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Style Properties */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Appearance</h4>

          {/* Background Color */}
          <div className="mb-3">
            <Label className="text-sm font-medium">Background Color</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-8 w-16 rounded border border-gray-300"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 p-1 text-xs border border-gray-300 rounded"
              />
            </div>
            <div className="grid grid-cols-11 gap-1 mt-2">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => setBackgroundColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Border Color */}
          <div className="mb-3">
            <Label className="text-sm font-medium">Border Color</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="h-8 w-16 rounded border border-gray-300"
              />
              <input
                type="text"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="flex-1 p-1 text-xs border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Border Size */}
          <div className="mb-3">
            <Label className="text-sm font-medium">Border Size</Label>
            <input
              type="range"
              min="0"
              max="10"
              value={borderSize}
              onChange={(e) => setBorderSize(Number(e.target.value))}
              className="w-full mt-1"
            />
            <div className="text-xs text-gray-500 text-right">{borderSize}px</div>
          </div>

          {/* Border Type */}
          <div className="mb-3">
            <Label className="text-sm font-medium">Border Type</Label>
            <select
              value={borderType}
              onChange={(e) => setBorderType(e.target.value as "solid" | "dashed" | "dotted")}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>

          {/* Border Radius */}
          <div className="mb-3">
            <Label className="text-sm font-medium">Border Radius</Label>
            <input
              type="range"
              min="0"
              max="50"
              value={borderRadius}
              onChange={(e) => setBorderRadius(Number(e.target.value))}
              className="w-full mt-1"
            />
            <div className="text-xs text-gray-500 text-right">{borderRadius}px</div>
          </div>

          {/* Text Color */}
          <div className="mb-3">
            <Label className="text-sm font-medium">Text Color</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-8 w-16 rounded border border-gray-300"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="flex-1 p-1 text-xs border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Font Size */}
          <div className="mb-3">
            <Label className="text-sm font-medium">Font Size</Label>
            <input
              type="range"
              min="12"
              max="120"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full mt-1"
            />
            <div className="text-xs text-gray-500 text-right">{fontSize}px</div>
          </div>
        </div>

        {/* Add Button - only show when not editing */}
        {!isEditingMode && (
          <Button onClick={handleAddOrUpdateDataElement} className="w-full">
            <Database className="w-4 h-4 mr-2" />
            Add Data Element
          </Button>
        )}
      </div>
    </div>
  );
}
