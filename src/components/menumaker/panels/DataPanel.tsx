/* eslint-disable jsx-a11y/label-has-associated-control */
import { Database, Edit3 } from "lucide-react";
import React, { useEffect, useState } from "react";

import { useMenuMakerStore } from "../../../stores/menumaker";
import { Label } from "../../ui/label";
import { type DataConfiguration, DataSelectorModal } from "../DataSelectorModal";

export function DataPanel() {
  const { currentPageId, project, updateElement, editorState } = useMenuMakerStore();

  // Data selector modal state
  const [showDataSelector, setShowDataSelector] = useState(false);

  // Data type selection
  const [selectedDataType, setSelectedDataType] = useState<"category" | "subcategory" | "menuitem">("category");

  // Style properties
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderSize, setBorderSize] = useState(0);
  const [borderType, setBorderType] = useState<"solid" | "dashed" | "dotted">("solid");
  const [borderRadius, setBorderRadius] = useState(0);
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [fontWeight, setFontWeight] = useState<
    "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
  >("normal");
  const [lineSpacing, setLineSpacing] = useState(1.2);
  const [itemNameLanguage, setItemNameLanguage] = useState<"en" | "fr" | "it" | "nl">("en");

  // Position and size properties
  const [elementX, setElementX] = useState(50);
  const [elementY, setElementY] = useState(50);
  const [elementWidth, setElementWidth] = useState(200);
  const [elementHeight, setElementHeight] = useState(100);

  // Category/Subcategory title properties
  const [titleLanguage, setTitleLanguage] = useState<"en" | "fr" | "it" | "nl">("en");
  const [titleTextColor, setTitleTextColor] = useState("#000000");
  const [titleTextFontSize, setTitleTextFontSize] = useState(48);
  const [titleTextFontFamily, setTitleTextFontFamily] = useState("Arial, sans-serif");
  const [titleTextFontWeight, setTitleTextFontWeight] = useState<
    "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
  >("normal");
  const [titleAlign, setTitleAlign] = useState<"left" | "center" | "right">("left");

  // Menu item specific properties
  const [showSubcategoryTitle, setShowSubcategoryTitle] = useState(true);
  const [showMenuDescription, setShowMenuDescription] = useState(false);
  const [showPrice, setShowPrice] = useState(true);
  const [showCurrencySign, setShowCurrencySign] = useState(true);
  const [priceColor, setPriceColor] = useState("#000000");
  const [priceFontFamily, setPriceFontFamily] = useState("Arial, sans-serif");
  const [priceFontWeight, setPriceFontWeight] = useState<
    "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
  >("normal");
  const [priceSeparator, setPriceSeparator] = useState<"." | ",">(".");
  const [menuLayout, setMenuLayout] = useState<"left" | "justified">("left");
  const [startIndex, setStartIndex] = useState(0);

  // Subcategory title properties
  const [subcategoryTitleTextColor, setSubcategoryTitleTextColor] = useState("#000000");
  const [subcategoryTitleTextFontSize, setSubcategoryTitleTextFontSize] = useState(64);
  const [subcategoryTitleTextFontFamily, setSubcategoryTitleTextFontFamily] = useState("Arial, sans-serif");
  const [subcategoryTitleTextFontWeight, setSubcategoryTitleTextFontWeight] = useState<
    "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
  >("bold");
  const [showDivider, setShowDivider] = useState(false);
  const [dividerColor, setDividerColor] = useState("#000000");
  const [dividerSize, setDividerSize] = useState(1);
  const [dividerWidth, setDividerWidth] = useState<"full" | "title" | "custom">("full");
  const [dividerCustomWidth, setDividerCustomWidth] = useState(100);
  const [dividerSpaceTop, setDividerSpaceTop] = useState(0);
  const [dividerSpaceBottom, setDividerSpaceBottom] = useState(50);
  const [subcategoryTitleTextMarginTop, setSubcategoryTitleTextMarginTop] = useState(0);
  const [subcategoryTitleTextMarginLeft, setSubcategoryTitleTextMarginLeft] = useState(0);
  const [subcategoryTitleTextMarginRight, setSubcategoryTitleTextMarginRight] = useState(0);
  const [subcategoryTitleTextMarginBottom, setSubcategoryTitleTextMarginBottom] = useState(10);
  const [subcategoryTitleLanguage, setSubcategoryTitleLanguage] = useState<"en" | "fr" | "it" | "nl">("en");

  // Menu description properties
  const [showMenuDescriptionTextColor, setShowMenuDescriptionTextColor] = useState("#000");
  const [showMenuDescriptionTextFontSize, setShowMenuDescriptionTextFontSize] = useState(51); // 20% less than subcategoryTitle default
  const [showMenuDescriptionTextFontWeight, setShowMenuDescriptionTextFontWeight] = useState<
    "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
  >("normal");
  const [showMenuDescriptionTextMarginTop, setShowMenuDescriptionTextMarginTop] = useState(2);
  const [showMenuDescriptionTextMarginLeft, setShowMenuDescriptionTextMarginLeft] = useState(0);
  const [showMenuDescriptionTextMarginRight, setShowMenuDescriptionTextMarginRight] = useState(0);
  const [showMenuDescriptionTextMarginBottom, setShowMenuDescriptionTextMarginBottom] = useState(5);
  const [showMenuDescriptionLanguage, setShowMenuDescriptionLanguage] = useState<"en" | "fr" | "it" | "nl">("en");
  const [showMenuDescriptionLineBreakChars, setShowMenuDescriptionLineBreakChars] = useState(50);

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

  // Get display text for the data selection button
  const getDataSelectionText = () => {
    if (!selectedDataElement) {
      return "Select Data Type";
    }

    const { dataType, categoryData, subcategoryData } = selectedDataElement;

    switch (dataType) {
      case "category":
        return `Category: ${categoryData?.names?.en || categoryData?.name || "Category"}`;
      case "subcategory":
        return `Subcategory: ${subcategoryData?.names?.en || subcategoryData?.name || "Unknown"}`;
      case "menuitem": {
        const subcategoryName = subcategoryData?.names?.en || subcategoryData?.name || "Unknown Subcategory";

        return `${subcategoryName} menu items`;
      }
      case "sidedish":
        return "Side Dishes";
      case "sauce":
        return "Sauces & Supplements";
      case "allergen":
        return "Allergen Information";
      default:
        return "Select Data Type";
    }
  };

  // Handle data selection from modal
  const handleDataSelection = (dataConfig: DataConfiguration) => {
    if (!isEditingMode || !selectedDataElement || !currentPageId || !project) return;

    const currentPage = project.pages.find((page) => page.id === currentPageId);

    if (!currentPage) return;

    const updatedElement = {
      ...selectedDataElement,
      dataType: dataConfig.dataType,
      dataId: dataConfig.subcategoryId || dataConfig.categoryId || "",
      categoryData: dataConfig.categoryData,
      subcategoryData: dataConfig.subcategoryData,
      startIndex: dataConfig.startIndex,
    };

    // Find the layer containing this element
    const layer = currentPage.layers.find((layer) =>
      layer.elements.some((element) => element.id === selectedDataElement.id),
    );

    if (layer) {
      updateElement(currentPageId, layer.id, selectedDataElement.id, updatedElement);
    }
  };

  // Populate form when editing an existing element (prevent infinite loops)
  const [isPopulatingForm, setIsPopulatingForm] = useState(false);

  useEffect(() => {
    if (selectedDataElement && !isPopulatingForm) {
      setIsPopulatingForm(true);

      setSelectedDataType(selectedDataElement.dataType as "menuitem" | "category" | "subcategory");
      setElementX(Math.round(selectedDataElement.x || 50));
      setElementY(Math.round(selectedDataElement.y || 50));
      setElementWidth(Math.round(selectedDataElement.width || 200));
      setElementHeight(Math.round(selectedDataElement.height || 100));
      setBackgroundColor(selectedDataElement.backgroundColor || "#ffffff");
      setBackgroundOpacity(selectedDataElement.backgroundOpacity || 0);
      setBorderColor(selectedDataElement.borderColor || "#000000");
      setBorderSize(selectedDataElement.borderSize || 0);
      setBorderType(selectedDataElement.borderType || "solid");
      setBorderRadius(selectedDataElement.borderRadius || 0);
      setTextColor(selectedDataElement.textColor || "#000000");
      setFontSize(selectedDataElement.fontSize || 48);
      setFontFamily(selectedDataElement.fontFamily || "Arial, sans-serif");
      setFontWeight(selectedDataElement.fontWeight || "normal");
      setLineSpacing(selectedDataElement.lineSpacing || 1.2);
      setItemNameLanguage(selectedDataElement.itemNameLanguage || "en");

      // Category/Subcategory title properties
      setTitleLanguage(selectedDataElement.titleLanguage || "en");
      setTitleTextColor(selectedDataElement.titleTextColor || "#000000");
      setTitleTextFontSize(selectedDataElement.titleTextFontSize || 48);
      setTitleTextFontFamily(selectedDataElement.titleTextFontFamily || "Arial, sans-serif");
      setTitleTextFontWeight(selectedDataElement.titleTextFontWeight || "normal");
      setTitleAlign(selectedDataElement.titleAlign || "left");

      // Menu item specific properties
      setShowSubcategoryTitle(selectedDataElement.showSubcategoryTitle !== false); // Default to true
      setShowMenuDescription(selectedDataElement.showMenuDescription === true); // Default to false
      setShowPrice(selectedDataElement.showPrice !== false); // Default to true
      setShowCurrencySign(selectedDataElement.showCurrencySign !== false); // Default to true
      setPriceColor(selectedDataElement.priceColor || "#000000");
      setPriceFontFamily(selectedDataElement.priceFontFamily || "Arial, sans-serif");
      setPriceFontWeight(selectedDataElement.priceFontWeight || "normal");
      setPriceSeparator(selectedDataElement.priceSeparator || ".");
      setMenuLayout(selectedDataElement.menuLayout || "left"); // Default to left
      setStartIndex(selectedDataElement.startIndex || 0);

      // Subcategory title properties
      setSubcategoryTitleTextColor(selectedDataElement.subcategoryTitleTextColor || "#000000");
      setSubcategoryTitleTextFontSize(selectedDataElement.subcategoryTitleTextFontSize || 58);
      setSubcategoryTitleTextFontFamily(selectedDataElement.subcategoryTitleTextFontFamily || "Arial, sans-serif");
      setSubcategoryTitleTextFontWeight(selectedDataElement.subcategoryTitleTextFontWeight || "bold");
      setShowDivider(selectedDataElement.showDivider || false);
      setDividerColor(selectedDataElement.dividerColor || "#000000");
      setDividerSize(selectedDataElement.dividerSize || 1);
      setDividerWidth(selectedDataElement.dividerWidth || "full");
      setDividerCustomWidth(selectedDataElement.dividerCustomWidth || 100);
      setDividerSpaceTop(selectedDataElement.dividerSpaceTop || 0);
      setDividerSpaceBottom(selectedDataElement.dividerSpaceBottom || 0);
      setSubcategoryTitleTextMarginTop(selectedDataElement.subcategoryTitleTextMarginTop || 0);
      setSubcategoryTitleTextMarginLeft(selectedDataElement.subcategoryTitleTextMarginLeft || 0);
      setSubcategoryTitleTextMarginRight(selectedDataElement.subcategoryTitleTextMarginRight || 0);
      setSubcategoryTitleTextMarginBottom(selectedDataElement.subcategoryTitleTextMarginBottom || 0);
      setSubcategoryTitleLanguage(selectedDataElement.subcategoryTitleLanguage || "en");

      // Menu description properties
      setShowMenuDescriptionTextColor(selectedDataElement.showMenuDescriptionTextColor || "#1E1E1E");
      setShowMenuDescriptionTextFontSize(
        selectedDataElement.showMenuDescriptionTextFontSize ||
          Math.round((selectedDataElement.subcategoryTitleTextFontSize || 48) * 0.8),
      );
      setShowMenuDescriptionTextFontWeight(selectedDataElement.showMenuDescriptionTextFontWeight || "normal");
      setShowMenuDescriptionTextMarginTop(selectedDataElement.showMenuDescriptionTextMarginTop || 2);
      setShowMenuDescriptionTextMarginLeft(selectedDataElement.showMenuDescriptionTextMarginLeft || 0);
      setShowMenuDescriptionTextMarginRight(selectedDataElement.showMenuDescriptionTextMarginRight || 0);
      setShowMenuDescriptionTextMarginBottom(selectedDataElement.showMenuDescriptionTextMarginBottom || 0);
      setShowMenuDescriptionLanguage(selectedDataElement.showMenuDescriptionLanguage || "en");
      setShowMenuDescriptionLineBreakChars(selectedDataElement.showMenuDescriptionLineBreakChars || 50);

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
    elementX,
    elementY,
    elementWidth,
    elementHeight,
    backgroundColor,
    backgroundOpacity,
    borderColor,
    borderSize,
    borderType,
    borderRadius,
    textColor,
    fontSize,
    fontFamily,
    fontWeight,
    lineSpacing,
    itemNameLanguage,
    titleLanguage,
    titleTextColor,
    titleTextFontSize,
    titleTextFontFamily,
    titleTextFontWeight,
    titleAlign,
    showSubcategoryTitle,
    showMenuDescription,
    showPrice,
    showCurrencySign,
    priceColor,
    priceFontFamily,
    priceFontWeight,
    priceSeparator,
    menuLayout,
    subcategoryTitleTextColor,
    subcategoryTitleTextFontSize,
    subcategoryTitleTextFontFamily,
    subcategoryTitleTextFontWeight,
    showDivider,
    dividerColor,
    dividerSize,
    dividerWidth,
    dividerCustomWidth,
    dividerSpaceTop,
    dividerSpaceBottom,
    subcategoryTitleTextMarginTop,
    subcategoryTitleTextMarginLeft,
    subcategoryTitleTextMarginRight,
    subcategoryTitleTextMarginBottom,
    subcategoryTitleLanguage,
    showMenuDescriptionTextColor,
    showMenuDescriptionTextFontSize,
    showMenuDescriptionTextFontWeight,
    showMenuDescriptionTextMarginTop,
    showMenuDescriptionTextMarginLeft,
    showMenuDescriptionTextMarginRight,
    showMenuDescriptionTextMarginBottom,
    showMenuDescriptionLanguage,
    showMenuDescriptionLineBreakChars,
  ]);

  // Update selected element automatically when properties change
  const updateSelectedElement = () => {
    if (!isEditingMode || !selectedDataElement || !currentPageId || !project) return;

    const currentPage = project.pages.find((page) => page.id === currentPageId);

    if (!currentPage) return;

    const updatedElement = {
      ...selectedDataElement,
      x: elementX,
      y: elementY,
      width: elementWidth,
      height: elementHeight,
      // Keep existing data selection - changes happen via modal
      backgroundColor,
      backgroundOpacity,
      borderColor,
      borderSize,
      borderType,
      borderRadius,
      textColor,
      fontSize,
      fontFamily,
      fontWeight,
      lineSpacing,
      itemNameLanguage,
      // Category/Subcategory title properties
      titleLanguage: selectedDataType === "category" || selectedDataType === "subcategory" ? titleLanguage : undefined,
      titleTextColor:
        selectedDataType === "category" || selectedDataType === "subcategory" ? titleTextColor : undefined,
      titleTextFontSize:
        selectedDataType === "category" || selectedDataType === "subcategory" ? titleTextFontSize : undefined,
      titleTextFontFamily:
        selectedDataType === "category" || selectedDataType === "subcategory" ? titleTextFontFamily : undefined,
      titleTextFontWeight:
        selectedDataType === "category" || selectedDataType === "subcategory" ? titleTextFontWeight : undefined,
      titleAlign: selectedDataType === "category" || selectedDataType === "subcategory" ? titleAlign : undefined,
      // Menu item specific properties
      showSubcategoryTitle: selectedDataType === "menuitem" ? showSubcategoryTitle : undefined,
      showMenuDescription: selectedDataType === "menuitem" ? showMenuDescription : undefined,
      showPrice: selectedDataType === "menuitem" ? showPrice : undefined,
      showCurrencySign: selectedDataType === "menuitem" ? showCurrencySign : undefined,
      priceColor: selectedDataType === "menuitem" ? priceColor : undefined,
      priceFontFamily: selectedDataType === "menuitem" ? priceFontFamily : undefined,
      priceFontWeight: selectedDataType === "menuitem" ? priceFontWeight : undefined,
      priceSeparator: selectedDataType === "menuitem" ? priceSeparator : undefined,
      menuLayout: selectedDataType === "menuitem" ? menuLayout : undefined,
      startIndex: selectedDataType === "menuitem" ? startIndex : undefined,
      // Subcategory title properties
      subcategoryTitleTextColor:
        selectedDataType === "menuitem" && showSubcategoryTitle ? subcategoryTitleTextColor : undefined,
      subcategoryTitleTextFontSize:
        selectedDataType === "menuitem" && showSubcategoryTitle ? subcategoryTitleTextFontSize : undefined,
      subcategoryTitleTextFontFamily:
        selectedDataType === "menuitem" && showSubcategoryTitle ? subcategoryTitleTextFontFamily : undefined,
      subcategoryTitleTextFontWeight:
        selectedDataType === "menuitem" && showSubcategoryTitle ? subcategoryTitleTextFontWeight : undefined,
      showDivider: selectedDataType === "menuitem" && showSubcategoryTitle ? showDivider : undefined,
      dividerColor: selectedDataType === "menuitem" && showSubcategoryTitle && showDivider ? dividerColor : undefined,
      dividerSize: selectedDataType === "menuitem" && showSubcategoryTitle && showDivider ? dividerSize : undefined,
      dividerWidth: selectedDataType === "menuitem" && showSubcategoryTitle && showDivider ? dividerWidth : undefined,
      dividerCustomWidth:
        selectedDataType === "menuitem" && showSubcategoryTitle && showDivider ? dividerCustomWidth : undefined,
      dividerSpaceTop:
        selectedDataType === "menuitem" && showSubcategoryTitle && showDivider ? dividerSpaceTop : undefined,
      dividerSpaceBottom:
        selectedDataType === "menuitem" && showSubcategoryTitle && showDivider ? dividerSpaceBottom : undefined,
      subcategoryTitleTextMarginTop:
        selectedDataType === "menuitem" && showSubcategoryTitle ? subcategoryTitleTextMarginTop : undefined,
      subcategoryTitleTextMarginLeft:
        selectedDataType === "menuitem" && showSubcategoryTitle ? subcategoryTitleTextMarginLeft : undefined,
      subcategoryTitleTextMarginRight:
        selectedDataType === "menuitem" && showSubcategoryTitle ? subcategoryTitleTextMarginRight : undefined,
      subcategoryTitleTextMarginBottom:
        selectedDataType === "menuitem" && showSubcategoryTitle ? subcategoryTitleTextMarginBottom : undefined,
      subcategoryTitleLanguage:
        selectedDataType === "menuitem" && showSubcategoryTitle ? subcategoryTitleLanguage : undefined,
      // Menu description properties
      showMenuDescriptionTextColor:
        selectedDataType === "menuitem" && showMenuDescription ? showMenuDescriptionTextColor : undefined,
      showMenuDescriptionTextFontSize:
        selectedDataType === "menuitem" && showMenuDescription ? showMenuDescriptionTextFontSize : undefined,
      showMenuDescriptionTextFontWeight:
        selectedDataType === "menuitem" && showMenuDescription ? showMenuDescriptionTextFontWeight : undefined,
      showMenuDescriptionTextMarginTop:
        selectedDataType === "menuitem" && showMenuDescription ? showMenuDescriptionTextMarginTop : undefined,
      showMenuDescriptionTextMarginLeft:
        selectedDataType === "menuitem" && showMenuDescription ? showMenuDescriptionTextMarginLeft : undefined,
      showMenuDescriptionTextMarginRight:
        selectedDataType === "menuitem" && showMenuDescription ? showMenuDescriptionTextMarginRight : undefined,
      showMenuDescriptionTextMarginBottom:
        selectedDataType === "menuitem" && showMenuDescription ? showMenuDescriptionTextMarginBottom : undefined,
      showMenuDescriptionLanguage:
        selectedDataType === "menuitem" && showMenuDescription ? showMenuDescriptionLanguage : undefined,
      showMenuDescriptionLineBreakChars:
        selectedDataType === "menuitem" && showMenuDescription ? showMenuDescriptionLineBreakChars : undefined,
    };

    // Find the layer containing this element
    const layer = currentPage.layers.find((layer) =>
      layer.elements.some((element) => element.id === selectedDataElement.id),
    );

    if (layer) {
      updateElement(currentPageId, layer.id, selectedDataElement.id, updatedElement);
    }
  };

  if (!project || !currentPageId) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Data Selector Button */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Data Selection</Label>
          <button
            onClick={() => setShowDataSelector(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 text-sm">
                  {getDataSelectionText()}
                </h3>
                <p className="text-xs text-gray-500">Click to change data source</p>
              </div>
              <Edit3 className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
            </div>
          </button>
        </div>

        {/* Position & Size Section */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Position & Size</h4>

          {/* X and Y Position */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">X</Label>
              <input
                type="number"
                step="1"
                value={elementX}
                onChange={(e) => setElementX(Math.round(Number(e.target.value)))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-2xl text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Y</Label>
              <input
                type="number"
                step="1"
                value={elementY}
                onChange={(e) => setElementY(Math.round(Number(e.target.value)))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-2xl text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Width and Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Width</Label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={elementWidth}
                  onChange={(e) => setElementWidth(Math.round(Number(e.target.value)))}
                  className="w-full px-3 py-2 pr-8 bg-gray-50 border border-gray-300 rounded-2xl text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                  <button
                    type="button"
                    onClick={() => setElementWidth(elementWidth + 10)}
                    className="text-gray-400 hover:text-gray-600 text-xs leading-none"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => setElementWidth(Math.max(10, elementWidth - 10))}
                    className="text-gray-400 hover:text-gray-600 text-xs leading-none"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Height</Label>
              <input
                type="number"
                step="1"
                value={elementHeight}
                onChange={(e) => setElementHeight(Math.round(Number(e.target.value)))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-2xl text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Category/Subcategory Title Properties (only if category or subcategory is selected) */}
        {(selectedDataType === "category" || selectedDataType === "subcategory") && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {selectedDataType === "category" ? "Category" : "Subcategory"} Title Properties
            </h4>

            {/* Title Language */}
            <div className="mb-3">
              <Label className="text-sm font-medium">Title Language</Label>
              <select
                value={titleLanguage}
                onChange={(e) => setTitleLanguage(e.target.value as "en" | "fr" | "it" | "nl")}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="it">Italiano</option>
                <option value="nl">Nederlands</option>
              </select>
            </div>

            {/* Title Color */}
            <div className="mb-3">
              <Label className="text-sm font-medium">Title Color</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={titleTextColor}
                  onChange={(e) => setTitleTextColor(e.target.value)}
                  className="h-8 w-16 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={titleTextColor}
                  onChange={(e) => setTitleTextColor(e.target.value)}
                  className="flex-1 p-1 text-xs border border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Title Font Size */}
            <div className="mb-3">
              <Label className="text-sm font-medium">Title Font Size</Label>
              <input
                type="range"
                min="12"
                max="120"
                value={titleTextFontSize}
                onChange={(e) => setTitleTextFontSize(Number(e.target.value))}
                className="w-full mt-1"
              />
              <div className="text-xs text-gray-500 text-right">{titleTextFontSize}px</div>
            </div>

            {/* Title Font Family */}
            <div className="mb-3">
              <Label className="text-sm font-medium">Title Font Family</Label>
              <select
                value={titleTextFontFamily}
                onChange={(e) => setTitleTextFontFamily(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="Poppins, sans-serif">Poppins</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
                <option value="Times New Roman, serif">Times New Roman</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="Tahoma, sans-serif">Tahoma</option>
                <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                <option value="Impact, sans-serif">Impact</option>
                <option value="Comic Sans MS, cursive">Comic Sans MS</option>
                <option value="Courier New, monospace">Courier New</option>
              </select>
            </div>

            {/* Title Font Weight */}
            <div className="mb-3">
              <Label className="text-sm font-medium">Title Font Weight</Label>
              <select
                value={titleTextFontWeight}
                onChange={(e) =>
                  setTitleTextFontWeight(
                    e.target.value as
                      | "normal"
                      | "bold"
                      | "100"
                      | "200"
                      | "300"
                      | "400"
                      | "500"
                      | "600"
                      | "700"
                      | "800"
                      | "900",
                  )
                }
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="100">100 - Thin</option>
                <option value="200">200 - Extra Light</option>
                <option value="300">300 - Light</option>
                <option value="400">400 - Normal</option>
                <option value="500">500 - Medium</option>
                <option value="600">600 - Semi Bold</option>
                <option value="700">700 - Bold</option>
                <option value="800">800 - Extra Bold</option>
                <option value="900">900 - Black</option>
              </select>
            </div>

            {/* Title Alignment */}
            <div className="mb-3">
              <Label className="text-sm font-medium">Title Alignment</Label>
              <select
                value={titleAlign}
                onChange={(e) => setTitleAlign(e.target.value as "left" | "center" | "right")}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        )}

        {/* Menu Item Properties (only if menuitem is selected) */}
        {selectedDataType === "menuitem" && (
          <div className="border-t pt-4">
            {/* Menu items text properties */}
            <div className="border-b pb-4 mb-4 space-y-4">
              {/* Menu Item Title */}
              <h5 className="font-medium text-gray-800 mb-3">Menu Item Title</h5>

              {/* Item Language */}
              <section>
                <Label className="text-sm font-medium">Item Language</Label>
                <select
                  value={itemNameLanguage}
                  onChange={(e) => setItemNameLanguage(e.target.value as "en" | "fr" | "it" | "nl")}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="it">Italiano</option>
                  <option value="nl">Nederlands</option>
                </select>
              </section>

              {/* Items Color */}
              <section>
                <Label className="text-sm font-medium">Items Color</Label>
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
              </section>

              {/* Font Size */}
              <section>
                <Label className="text-sm font-medium">Items Font Size</Label>
                <input
                  type="range"
                  min="12"
                  max="120"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full mt-1"
                />
                <div className="text-xs text-gray-500 text-right">{fontSize}px</div>
              </section>

              {/* Font Family */}
              <section>
                <Label className="text-sm font-medium">Items Font Family</Label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                >
                  <option value="Poppins, sans-serif">Poppins</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Helvetica, sans-serif">Helvetica</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="Tahoma, sans-serif">Tahoma</option>
                  <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                  <option value="Impact, sans-serif">Impact</option>
                  <option value="Comic Sans MS, cursive">Comic Sans MS</option>
                  <option value="Courier New, monospace">Courier New</option>
                </select>
              </section>

              {/* Font Weight */}
              <section>
                <Label className="text-sm font-medium">Items Font Weight</Label>
                <select
                  value={fontWeight}
                  onChange={(e) =>
                    setFontWeight(
                      e.target.value as
                        | "normal"
                        | "bold"
                        | "100"
                        | "200"
                        | "300"
                        | "400"
                        | "500"
                        | "600"
                        | "700"
                        | "800"
                        | "900",
                    )
                  }
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="100">100 - Thin</option>
                  <option value="200">200 - Extra Light</option>
                  <option value="300">300 - Light</option>
                  <option value="400">400 - Normal</option>
                  <option value="500">500 - Medium</option>
                  <option value="600">600 - Semi Bold</option>
                  <option value="700">700 - Bold</option>
                  <option value="800">800 - Extra Bold</option>
                  <option value="900">900 - Black</option>
                </select>
              </section>

              {/* Vertical Line Spacing */}
              <section>
                <Label className="text-sm font-medium">Items Vertical Line Spacing</Label>
                <input
                  type="range"
                  min="0.8"
                  max="3.0"
                  step="0.1"
                  value={lineSpacing}
                  onChange={(e) => setLineSpacing(Number(e.target.value))}
                  className="w-full mt-1"
                />
                <div className="text-xs text-gray-500 text-right">{lineSpacing.toFixed(1)}x</div>
              </section>

              {/* Start Index Selection */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-sm font-medium text-blue-900">Start from Menu Item</Label>
                <div className="mt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, (selectedDataElement?.subcategoryData?.menuItems?.length || 1) - 1)}
                        value={startIndex}
                        onChange={(e) => setStartIndex(Number(e.target.value))}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={selectedDataElement?.subcategoryData?.menuItems?.length || 1}
                        value={startIndex + 1}
                        onChange={(e) => setStartIndex(Math.max(0, Number(e.target.value) - 1))}
                        className="w-16 px-2 py-1 text-sm border border-blue-300 rounded-md text-center"
                      />
                      <span className="text-sm text-blue-700">
                        of {selectedDataElement?.subcategoryData?.menuItems?.length || 0}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    <strong>Starting item:</strong>{" "}
                    {selectedDataElement?.subcategoryData?.menuItems?.[startIndex]?.names?.en ||
                      selectedDataElement?.subcategoryData?.menuItems?.[startIndex]?.name ||
                      "N/A"}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => setStartIndex(0)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        startIndex === 0 ? "bg-blue-600 text-white" : "bg-blue-200 text-blue-700 hover:bg-blue-300"
                      }`}
                    >
                      Start
                    </button>
                    {(selectedDataElement?.subcategoryData?.menuItems?.length || 0) > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setStartIndex(Math.floor((selectedDataElement?.subcategoryData?.menuItems?.length || 0) / 2))
                        }
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          startIndex === Math.floor((selectedDataElement?.subcategoryData?.menuItems?.length || 0) / 2)
                            ? "bg-blue-600 text-white"
                            : "bg-blue-200 text-blue-700 hover:bg-blue-300"
                        }`}
                      >
                        Middle
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Item Price */}
            <div className="border-b pb-4 mb-4">
              {/* Show Price Toggle */}
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-sm font-medium">Show Price</Label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {showPrice && (
                <div className="space-y-3">
                  {/* Menu Item Price */}
                  <h5 className="font-medium text-gray-800 mb-3">Menu Item Price</h5>
                  {/* Show Currency Sign Toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Show € Sign</Label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCurrencySign}
                        onChange={(e) => setShowCurrencySign(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Price Color */}
                  <div>
                    <Label className="text-sm font-medium">Price Color</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={priceColor}
                        onChange={(e) => setPriceColor(e.target.value)}
                        className="h-8 w-16 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={priceColor}
                        onChange={(e) => setPriceColor(e.target.value)}
                        className="flex-1 p-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  {/* Price Font Family */}
                  <div>
                    <Label className="text-sm font-medium">Price Font Family</Label>
                    <select
                      value={priceFontFamily}
                      onChange={(e) => setPriceFontFamily(e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    >
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Helvetica, sans-serif">Helvetica</option>
                      <option value="Times New Roman, serif">Times New Roman</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Verdana, sans-serif">Verdana</option>
                      <option value="Tahoma, sans-serif">Tahoma</option>
                      <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                      <option value="Impact, sans-serif">Impact</option>
                      <option value="Comic Sans MS, cursive">Comic Sans MS</option>
                      <option value="Courier New, monospace">Courier New</option>
                    </select>
                  </div>

                  {/* Price Font Weight */}
                  <div>
                    <Label className="text-sm font-medium">Price Font Weight</Label>
                    <select
                      value={priceFontWeight}
                      onChange={(e) =>
                        setPriceFontWeight(
                          e.target.value as
                            | "normal"
                            | "bold"
                            | "100"
                            | "200"
                            | "300"
                            | "400"
                            | "500"
                            | "600"
                            | "700"
                            | "800"
                            | "900",
                        )
                      }
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="100">100 - Thin</option>
                      <option value="200">200 - Extra Light</option>
                      <option value="300">300 - Light</option>
                      <option value="400">400 - Normal</option>
                      <option value="500">500 - Medium</option>
                      <option value="600">600 - Semi Bold</option>
                      <option value="700">700 - Bold</option>
                      <option value="800">800 - Extra Bold</option>
                      <option value="900">900 - Black</option>
                    </select>
                  </div>

                  {/* Price Separator */}
                  <div>
                    <Label className="text-sm font-medium">Price Decimal Separator</Label>
                    <select
                      value={priceSeparator}
                      onChange={(e) => setPriceSeparator(e.target.value as "." | ",")}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    >
                      <option value=".">Dot (10.00)</option>
                      <option value=",">Comma (10,00)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Show Subcategory Title Toggle */}
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-medium">Show Subcategory Title</Label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSubcategoryTitle}
                  onChange={(e) => setShowSubcategoryTitle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Subcategory Title Properties - only show when showSubcategoryTitle is true */}
            {showSubcategoryTitle && (
              <div className="border-b pb-4 mb-4">
                <h5 className="font-medium text-gray-800 mb-3">Subcategory Title</h5>

                {/* Subcategory Title Language */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Title Language</Label>
                  <select
                    value={subcategoryTitleLanguage}
                    onChange={(e) => setSubcategoryTitleLanguage(e.target.value as "en" | "fr" | "it" | "nl")}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="it">Italiano</option>
                    <option value="nl">Nederlands</option>
                  </select>
                </div>

                {/* Subcategory Title Color */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Title Color</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={subcategoryTitleTextColor}
                      onChange={(e) => setSubcategoryTitleTextColor(e.target.value)}
                      className="h-8 w-16 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={subcategoryTitleTextColor}
                      onChange={(e) => setSubcategoryTitleTextColor(e.target.value)}
                      className="flex-1 p-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                </div>

                {/* Subcategory Title Font Size */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Title Font Size</Label>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={subcategoryTitleTextFontSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);

                      setSubcategoryTitleTextFontSize(newSize);
                      // Auto-update description font size to be 20% smaller
                      if (showMenuDescription) {
                        setShowMenuDescriptionTextFontSize(Math.round(newSize * 0.8));
                      }
                    }}
                    className="w-full mt-1"
                  />
                  <div className="text-xs text-gray-500 text-right">{subcategoryTitleTextFontSize}px</div>
                </div>

                {/* Subcategory Title Font Family */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Title Font Family</Label>
                  <select
                    value={subcategoryTitleTextFontFamily}
                    onChange={(e) => setSubcategoryTitleTextFontFamily(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Poppins, sans-serif">Poppins</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="Tahoma, sans-serif">Tahoma</option>
                    <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                    <option value="Impact, sans-serif">Impact</option>
                    <option value="Comic Sans MS, cursive">Comic Sans MS</option>
                    <option value="Courier New, monospace">Courier New</option>
                  </select>
                </div>

                {/* Subcategory Title Font Weight */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Title Font Weight</Label>
                  <select
                    value={subcategoryTitleTextFontWeight}
                    onChange={(e) =>
                      setSubcategoryTitleTextFontWeight(
                        e.target.value as
                          | "normal"
                          | "bold"
                          | "100"
                          | "200"
                          | "300"
                          | "400"
                          | "500"
                          | "600"
                          | "700"
                          | "800"
                          | "900",
                      )
                    }
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="100">100 - Thin</option>
                    <option value="200">200 - Extra Light</option>
                    <option value="300">300 - Light</option>
                    <option value="400">400 - Normal</option>
                    <option value="500">500 - Medium</option>
                    <option value="600">600 - Semi Bold</option>
                    <option value="700">700 - Bold</option>
                    <option value="800">800 - Extra Bold</option>
                    <option value="900">900 - Black</option>
                  </select>
                </div>

                {/* Show Divider Toggle */}
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-sm font-medium">Show Divider</Label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDivider}
                      onChange={(e) => setShowDivider(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Divider Properties - only show when showDivider is true */}
                {showDivider && (
                  <div className="mb-4 space-y-3 pl-4 border-l-2 border-gray-200">
                    <h6 className="font-medium text-gray-700 text-sm">Divider Settings</h6>

                    {/* Divider Color */}
                    <div>
                      <Label className="text-sm font-medium">Divider Color</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={dividerColor}
                          onChange={(e) => setDividerColor(e.target.value)}
                          className="h-8 w-16 rounded border border-gray-300"
                        />
                        <input
                          type="text"
                          value={dividerColor}
                          onChange={(e) => setDividerColor(e.target.value)}
                          className="flex-1 p-1 text-xs border border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    {/* Divider Size */}
                    <div>
                      <Label className="text-sm font-medium">Divider Size</Label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={dividerSize}
                        onChange={(e) => setDividerSize(Number(e.target.value))}
                        className="w-full mt-1"
                      />
                      <div className="text-xs text-gray-500 text-right">{dividerSize}px</div>
                    </div>

                    {/* Divider Width */}
                    <div>
                      <Label className="text-sm font-medium">Divider Width</Label>
                      <select
                        value={dividerWidth}
                        onChange={(e) => setDividerWidth(e.target.value as "full" | "title" | "custom")}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      >
                        <option value="full">Full Width</option>
                        <option value="title">Title Width</option>
                        <option value="custom">Custom Width</option>
                      </select>
                    </div>

                    {/* Custom Width - only show when dividerWidth is custom */}
                    {dividerWidth === "custom" && (
                      <div>
                        <Label className="text-sm font-medium">Custom Width (%)</Label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={dividerCustomWidth}
                          onChange={(e) => setDividerCustomWidth(Number(e.target.value))}
                          className="w-full mt-1"
                        />
                        <div className="text-xs text-gray-500 text-right">{dividerCustomWidth}%</div>
                      </div>
                    )}

                    {/* Divider Spacing */}
                    <div>
                      <Label className="text-sm font-medium">Divider Spacing</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <Label className="text-xs text-gray-600">Top</Label>
                          <input
                            type="number"
                            min="0"
                            max="200"
                            value={dividerSpaceTop}
                            onChange={(e) => setDividerSpaceTop(Number(e.target.value))}
                            className="w-full p-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Bottom</Label>
                          <input
                            type="number"
                            min="0"
                            max="200"
                            value={dividerSpaceBottom}
                            onChange={(e) => setDividerSpaceBottom(Number(e.target.value))}
                            className="w-full p-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subcategory Title Margins */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Title Margins</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label className="text-xs text-gray-600">Top</Label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={subcategoryTitleTextMarginTop}
                        onChange={(e) => setSubcategoryTitleTextMarginTop(Number(e.target.value))}
                        className="w-full p-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Bottom</Label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={subcategoryTitleTextMarginBottom}
                        onChange={(e) => setSubcategoryTitleTextMarginBottom(Number(e.target.value))}
                        className="w-full p-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Left</Label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={subcategoryTitleTextMarginLeft}
                        onChange={(e) => setSubcategoryTitleTextMarginLeft(Number(e.target.value))}
                        className="w-full p-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Right</Label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={subcategoryTitleTextMarginRight}
                        onChange={(e) => setSubcategoryTitleTextMarginRight(Number(e.target.value))}
                        className="w-full p-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show Menu Description Toggle */}
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-medium">Show Menu Description</Label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMenuDescription}
                  onChange={(e) => setShowMenuDescription(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Menu Description Properties - only show when showMenuDescription is true */}
            {showMenuDescription && (
              <div className="border-b pb-4 mb-4">
                <h5 className="font-medium text-gray-800 mb-3">Menu Description</h5>

                {/* Menu Description Color */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Description Color</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={showMenuDescriptionTextColor}
                      onChange={(e) => setShowMenuDescriptionTextColor(e.target.value)}
                      className="h-8 w-16 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={showMenuDescriptionTextColor}
                      onChange={(e) => setShowMenuDescriptionTextColor(e.target.value)}
                      className="flex-1 p-1 text-xs border border-gray-300 rounded"
                    />
                  </div>
                </div>

                {/* Menu Description Font Size */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Description Font Size</Label>
                  <input
                    type="range"
                    min="6"
                    max="48"
                    value={showMenuDescriptionTextFontSize}
                    onChange={(e) => setShowMenuDescriptionTextFontSize(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                  <div className="text-xs text-gray-500 text-right">{showMenuDescriptionTextFontSize}px</div>
                </div>

                {/* Menu Description Font Weight */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Description Font Weight</Label>
                  <select
                    value={showMenuDescriptionTextFontWeight}
                    onChange={(e) =>
                      setShowMenuDescriptionTextFontWeight(
                        e.target.value as
                          | "normal"
                          | "bold"
                          | "100"
                          | "200"
                          | "300"
                          | "400"
                          | "500"
                          | "600"
                          | "700"
                          | "800"
                          | "900",
                      )
                    }
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="100">100 - Thin</option>
                    <option value="200">200 - Extra Light</option>
                    <option value="300">300 - Light</option>
                    <option value="400">400 - Normal</option>
                    <option value="500">500 - Medium</option>
                    <option value="600">600 - Semi Bold</option>
                    <option value="700">700 - Bold</option>
                    <option value="800">800 - Extra Bold</option>
                    <option value="900">900 - Black</option>
                  </select>
                </div>

                {/* Menu Description Margins */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Description Margins</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label className="text-xs text-gray-600">Top</Label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={showMenuDescriptionTextMarginTop}
                        onChange={(e) => setShowMenuDescriptionTextMarginTop(Number(e.target.value))}
                        className="w-full p-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Bottom</Label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={showMenuDescriptionTextMarginBottom}
                        onChange={(e) => setShowMenuDescriptionTextMarginBottom(Number(e.target.value))}
                        className="w-full p-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Left</Label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={showMenuDescriptionTextMarginLeft}
                        onChange={(e) => setShowMenuDescriptionTextMarginLeft(Number(e.target.value))}
                        className="w-full p-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Right</Label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={showMenuDescriptionTextMarginRight}
                        onChange={(e) => setShowMenuDescriptionTextMarginRight(Number(e.target.value))}
                        className="w-full p-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Menu Description Language */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Description Language</Label>
                  <select
                    value={showMenuDescriptionLanguage}
                    onChange={(e) => setShowMenuDescriptionLanguage(e.target.value as "en" | "fr" | "it" | "nl")}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="it">Italiano</option>
                    <option value="nl">Nederlands</option>
                  </select>
                </div>

                {/* Menu Description Line Break Characters */}
                <div className="mb-3">
                  <Label className="text-sm font-medium">Line Break After Characters</Label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={showMenuDescriptionLineBreakChars}
                    onChange={(e) => setShowMenuDescriptionLineBreakChars(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={showMenuDescriptionLineBreakChars}
                      onChange={(e) => setShowMenuDescriptionLineBreakChars(Number(e.target.value))}
                      className="w-20 p-1 text-xs border border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-500">characters</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Description will break to new line after this many characters
                  </div>
                </div>
              </div>
            )}

            {/* Menu Layout Selection */}
            <div className="mb-3">
              <Label className="text-sm font-medium">Layout</Label>
              <select
                value={menuLayout}
                onChange={(e) => setMenuLayout(e.target.value as "left" | "justified")}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="left">Left Aligned (Text and price together)</option>
                <option value="justified">Justified (Text left, price right)</option>
              </select>
            </div>
          </div>
        )}

        {/* Background and Border Properties */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Section Appearance</h4>

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
          </div>

          {/* Background Opacity */}
          <div className="mb-3">
            <Label className="text-sm font-medium">Background Opacity</Label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={backgroundOpacity}
              onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
              className="w-full mt-1"
            />
            <div className="text-xs text-gray-500 text-right">
              {Math.round(backgroundOpacity * 100)}% {backgroundOpacity === 0 ? "(Transparent)" : ""}
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
        </div>
      </div>

      {/* Data Selector Modal */}
      {isEditingMode && (
        <DataSelectorModal
          isOpen={showDataSelector}
          onClose={() => setShowDataSelector(false)}
          onConfirm={handleDataSelection}
          initialSelection={{
            dataType: selectedDataElement?.dataType,
            categoryId: selectedDataElement?.categoryData?.id,
            subcategoryId: selectedDataElement?.subcategoryData?.id,
          }}
        />
      )}
    </div>
  );
}
