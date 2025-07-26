/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
import { Check, ChevronRight, Database, Loader2, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { DataElement, DataType } from "../../types/menumaker";
import { Button } from "../ui/button";

interface DataSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (dataConfig: DataConfiguration) => void;
  initialSelection?: {
    dataType?: DataType;
    categoryId?: string;
    subcategoryId?: string;
  };
}

export interface DataConfiguration {
  dataType: DataType;
  categoryId?: string;
  subcategoryId?: string;
  categoryData?: any;
  subcategoryData?: any;
}

export function DataSelectorModal({ isOpen, onClose, onConfirm, initialSelection }: DataSelectorModalProps) {
  const { project, currentPageId, addElement, menuData } = useMenuMakerStore();

  // Selection state
  const [selectedDataType, setSelectedDataType] = useState<DataConfiguration["dataType"] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [selectedSubcategoryData, setSelectedSubcategoryData] = useState<any>(null);
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>([]);

  // UI state
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Data Type, 2: Category, 3: Subcategory
  const [isLoading, setIsLoading] = useState(false);

  // Data options
  const dataTypeOptions = [
    {
      id: "category" as const,
      label: "Category",
      description: "Display a complete category section",
      icon: "📁",
      requiresCategory: true,
      requiresSubcategory: false,
    },
    {
      id: "subcategory" as const,
      label: "Subcategory",
      description: "Display a specific subcategory section",
      icon: "📂",
      requiresCategory: true,
      requiresSubcategory: true,
    },
    {
      id: "menuitem" as const,
      label: "Menu Items",
      description: "Display menu items from a subcategory",
      icon: "🍽️",
      requiresCategory: true,
      requiresSubcategory: true,
    },
    {
      id: "sidedish" as const,
      label: "Side Dishes",
      description: "Display available side dishes",
      icon: "🥗",
      requiresCategory: false,
      requiresSubcategory: false,
    },
    {
      id: "sauce" as const,
      label: "Sauces",
      description: "Display available sauces and supplements",
      icon: "🧄",
      requiresCategory: false,
      requiresSubcategory: false,
    },
    {
      id: "allergen" as const,
      label: "Allergens",
      description: "Display allergen information",
      icon: "⚠️",
      requiresCategory: false,
      requiresSubcategory: false,
    },
  ];

  // Get categories from store
  const categories = menuData.categories?.sort((a: any, b: any) => a.order - b.order) || [];

  // Initialize with initial selection
  useEffect(() => {
    if (initialSelection && isOpen) {
      if (initialSelection.dataType) {
        setSelectedDataType(initialSelection.dataType);
        const option = dataTypeOptions.find((opt) => opt.id === initialSelection.dataType);

        if (option?.requiresCategory) {
          setStep(2);
        }
      }
      if (initialSelection.categoryId) {
        setSelectedCategory(initialSelection.categoryId);
        const categoryData = categories.find((cat: any) => cat.id === initialSelection.categoryId);

        setSelectedCategoryData(categoryData || null);
        setAvailableSubcategories(categoryData?.subCategories || []);
      }
      if (initialSelection.subcategoryId) {
        setSelectedSubcategory(initialSelection.subcategoryId);
        const subcategoryData = availableSubcategories.find((sub: any) => sub.id === initialSelection.subcategoryId);

        setSelectedSubcategoryData(subcategoryData || null);
      }
    }
  }, [initialSelection, isOpen, categories]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDataType(null);
      setSelectedCategory("");
      setSelectedCategoryData(null);
      setSelectedSubcategory("");
      setSelectedSubcategoryData(null);
      setAvailableSubcategories([]);
      setStep(1);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle data type selection
  const handleDataTypeSelect = useCallback((dataType: DataConfiguration["dataType"]) => {
    setSelectedDataType(dataType);
    const option = dataTypeOptions.find((opt) => opt.id === dataType);

    if (option?.requiresCategory) {
      setStep(2);
    } else {
      // For data types that don't require category selection, we can proceed directly
      setStep(1); // Stay on step 1 but enable confirm
    }
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);
      const categoryData = categories.find((cat: any) => cat.id === categoryId);

      setSelectedCategoryData(categoryData || null);
      setAvailableSubcategories(categoryData?.subCategories || []);
      setSelectedSubcategory(""); // Reset subcategory
      setSelectedSubcategoryData(null);

      const option = dataTypeOptions.find((opt) => opt.id === selectedDataType);

      if (option?.requiresSubcategory) {
        setStep(3);
      }
    },
    [selectedDataType, categories],
  );

  // Handle subcategory selection
  const handleSubcategorySelect = useCallback(
    (subcategoryId: string) => {
      setSelectedSubcategory(subcategoryId);
      const subcategoryData = availableSubcategories.find((sub: any) => sub.id === subcategoryId);

      setSelectedSubcategoryData(subcategoryData || null);
    },
    [availableSubcategories],
  );

  // Check if selection is complete
  const isSelectionComplete = useCallback(() => {
    if (!selectedDataType) return false;

    const option = dataTypeOptions.find((opt) => opt.id === selectedDataType);

    if (!option) return false;

    if (option.requiresCategory && !selectedCategory) return false;
    if (option.requiresSubcategory && !selectedSubcategory) return false;

    return true;
  }, [selectedDataType, selectedCategory, selectedSubcategory]);

  // Handle confirm
  const handleConfirm = useCallback(async () => {
    if (!isSelectionComplete()) return;

    setIsLoading(true);

    try {
      const dataConfig: DataConfiguration = {
        dataType: selectedDataType!,
        categoryId: selectedCategory || undefined,
        subcategoryId: selectedSubcategory || undefined,
        categoryData: selectedCategoryData,
        subcategoryData: selectedSubcategoryData,
      };

      if (onConfirm) {
        // Custom confirm handler (for DataPanel usage)
        onConfirm(dataConfig);
      } else {
        // Default behavior: create data element (for toolbar usage)
        await createDataElement(dataConfig);
      }

      onClose();
    } catch (error) {
      console.error("Error confirming data selection:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    isSelectionComplete,
    selectedDataType,
    selectedCategory,
    selectedSubcategory,
    selectedCategoryData,
    selectedSubcategoryData,
    onConfirm,
    onClose,
  ]);

  // Create data element (default behavior)
  const createDataElement = useCallback(
    async (config: DataConfiguration) => {
      if (!currentPageId || !project) return;

      const currentPage = project.pages.find((page) => page.id === currentPageId);

      if (!currentPage || currentPage.layers.length === 0) return;
      // Calculate center position based on page format
      const centerX = (currentPage.format.width - 1000) / 2;
      const centerY = (currentPage.format.height - 400) / 2;

      // Create data element with default styling
      const dataElement: Omit<DataElement, "id"> = {
        type: "data" as const,
        x: centerX,
        y: centerY,
        width: config.dataType === "menuitem" ? 800 : 500,
        height: config.dataType === "menuitem" ? (config.subcategoryData.menuItems.length * 65) + 100 : 65,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: 1,
        locked: false,
        visible: true,
        opacity: 1,
        dataType: config.dataType as DataType,
        dataId: config.subcategoryId || config.categoryId || "",
        backgroundColor: "#ffffff",
        backgroundOpacity: 1,
        borderColor: "#000000",
        borderSize: 3,
        borderType: "solid",
        borderRadius: 0,
        textColor: "#000000",
        fontSize: 48,
        fontFamily: "Arial, sans-serif",
        fontWeight: config.dataType === "category" ? "bold" : "normal",
        lineSpacing: 1.2,
        itemNameLanguage: "en",
        categoryData: config.categoryData,
        subcategoryData: config.subcategoryData,
        subcategoryTitleTextFontSize: 58,
        subcategoryTitleTextMarginBottom: 30,
        // Menu item specific defaults
        showSubcategoryTitle: config.dataType === "menuitem" ? true : undefined,
        showMenuDescription: config.dataType === "menuitem" ? false : undefined,
        showPrice: config.dataType === "menuitem" ? true : undefined,
        showCurrencySign: config.dataType === "menuitem" ? true : undefined,
        priceColor: config.dataType === "menuitem" ? "#000000" : undefined,
        priceFontFamily: config.dataType === "menuitem" ? "Arial, sans-serif" : undefined,
        priceFontWeight: config.dataType === "menuitem" ? "normal" : undefined,
        priceSeparator: config.dataType === "menuitem" ? "," : undefined,
        menuLayout: config.dataType === "menuitem" ? "left" : undefined,
      };

      // Add to first layer
      addElement(currentPageId, currentPage.layers[0].id, dataElement);
    },
    [currentPageId, project, addElement],
  );

  // Get current step title
  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Select Data Type";
      case 2:
        return "Select Category";
      case 3:
        return "Select Subcategory";
      default:
        return "Select Data";
    }
  };

  // Get progress percentage
  const getProgress = () => {
    if (!selectedDataType) return 0;

    const option = dataTypeOptions.find((opt) => opt.id === selectedDataType);

    if (!option) return 0;

    if (!option.requiresCategory) return 100;
    if (!selectedCategory) return 33;
    if (!option.requiresSubcategory) return 100;
    if (!selectedSubcategory) return 66;
    return 100;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{getStepTitle()}</h2>
              <p className="text-sm text-gray-500">Choose the data you want to display</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Data Type</span>
            {selectedDataType && dataTypeOptions.find((opt) => opt.id === selectedDataType)?.requiresCategory && (
              <span>Category</span>
            )}
            {selectedDataType && dataTypeOptions.find((opt) => opt.id === selectedDataType)?.requiresSubcategory && (
              <span>Subcategory</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Data Type Selection */}
          {step === 1 && (
            <div>
              <p className="text-gray-600 mb-6">Choose what type of data you want to display on your menu.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                {dataTypeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleDataTypeSelect(option.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center group hover:border-blue-300 hover:shadow-md ${
                      selectedDataType === option.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-50 group-hover:bg-blue-50">
                        <span className="text-2xl">{option.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-1">{option.label}</h3>
                        <p className="text-xs text-gray-500 leading-tight">{option.description}</p>
                      </div>
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        {selectedDataType === option.id && <Check className="w-4 h-4 text-blue-600" />}
                        {(option.requiresCategory || option.requiresSubcategory) && (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Category Selection */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 mb-4">
                <button onClick={() => setStep(1)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  ← Back to Data Types
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Select a category to {selectedDataType === "subcategory" ? "choose a subcategory from" : selectedDataType === "menuitem" ? "display menu items from" : "display"}.
              </p>

              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No categories available</p>
                </div>
              ) : (
                categories.map((category: any) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left group hover:border-blue-300 hover:shadow-md ${
                      selectedCategory === category.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {category.names?.en || category.name}
                        </h3>
                        {category.subCategories?.length > 0 && (
                          <p className="text-sm text-gray-500">{category.subCategories.length} subcategories</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedCategory === category.id && <Check className="w-5 h-5 text-blue-600" />}
                        {(selectedDataType === "menuitem" || selectedDataType === "subcategory") && <ChevronRight className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 3: Subcategory Selection */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 mb-4">
                <button onClick={() => setStep(2)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  ← Back to Categories
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Select a subcategory from{" "}
                <strong>{selectedCategoryData?.names?.en || selectedCategoryData?.name}</strong>.
              </p>

              {availableSubcategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No subcategories available in this category</p>
                </div>
              ) : (
                availableSubcategories.map((subcategory: any) => (
                  <button
                    key={subcategory.id}
                    onClick={() => handleSubcategorySelect(subcategory.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left group hover:border-blue-300 hover:shadow-md ${
                      selectedSubcategory === subcategory.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                            {subcategory.names?.en || subcategory.name}
                          </h3>
                          {subcategory.description && <p className="text-sm text-gray-500">{subcategory.description}</p>}
                          {selectedDataType === "menuitem" && subcategory.menuItems?.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              {subcategory.menuItems.length} menu item{subcategory.menuItems.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        {selectedSubcategory === subcategory.id && <Check className="w-5 h-5 text-blue-600" />}
                      </div>
                      
                      {/* Show menu items preview when this subcategory is selected and dataType is menuitem */}
                      {selectedDataType === "menuitem" && 
                       selectedSubcategory === subcategory.id && 
                       subcategory.menuItems?.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">Menu Items Preview:</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {subcategory.menuItems.slice(0, 5).map((item: any, index: number) => (
                              <div key={item.id || index} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700 truncate flex-1">
                                  {item.names?.en || item.name}
                                </span>
                                {item.price && (
                                  <span className="text-blue-600 font-medium ml-2">
                                    €{item.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            ))}
                            {subcategory.menuItems.length > 5 && (
                              <div className="text-xs text-gray-500 italic">
                                ...and {subcategory.menuItems.length - 5} more items
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>

          <div className="flex items-center space-x-3">
            {step > 1 &&
              selectedDataType &&
              dataTypeOptions.find((opt) => opt.id === selectedDataType)?.requiresCategory && (
              <Button variant="outline" onClick={() => setStep(step === 3 ? 2 : 1)} disabled={isLoading}>
                  Back
              </Button>
            )}

            <Button onClick={handleConfirm} disabled={!isSelectionComplete() || isLoading} className="min-w-[120px]">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Canvas"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
