"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Types for our PDF text elements
interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
}

interface EditingElement extends TextElement {
  isEditing: boolean;
}

export const PDFViewer: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [textElements, setTextElements] = useState<EditingElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scale, setScale] = useState(1.5);

  // Load PDF.js
  useEffect(() => {
    const loadPdfjs = () => {
      // Create and load the PDF.js script
      const script = document.createElement("script");

      script.type = "module";
      script.innerHTML = `
        import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs';
        window.pdfjsLib = pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs';
        window.pdfjsLoaded = true;
      `;
      document.head.appendChild(script);
    };

    loadPdfjs();
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || file.type !== "application/pdf") {
      alert("Please select a valid PDF file");
      return;
    }

    setIsLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Wait for PDF.js to load and then use it
      let pdfjsLib = (window as any).pdfjsLib;

      if (!pdfjsLib) {
        // Wait for PDF.js to load
        await new Promise((resolve) => {
          const checkLoaded = () => {
            if ((window as any).pdfjsLoaded) {
              pdfjsLib = (window as any).pdfjsLib;
              resolve(true);
            } else {
              setTimeout(checkLoaded, 100);
            }
          };

          checkLoaded();
        });
      }

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);

      // Load first page
      await renderPage(pdf, 1);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Error loading PDF file");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const renderPage = useCallback(
    async (pdf: any, pageNumber: number) => {
      if (!pdf || !canvasRef.current || !textCanvasRef.current) return;

      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const textCanvas = textCanvasRef.current;
        const context = canvas.getContext("2d");
        const textContext = textCanvas.getContext("2d");

        if (!context || !textContext) return;

        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        textCanvas.height = viewport.height;
        textCanvas.width = viewport.width;

        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Extract text content
        const textContent = await page.getTextContent();
        const textElements: EditingElement[] = [];

        textContent.items.forEach((item: any, index: number) => {
          if (item.str.trim()) {
            const transform = item.transform;
            const x = transform[4];
            const y = viewport.height - transform[5];
            const fontSize = transform[0];

            textElements.push({
              id: `text-${pageNumber}-${index}`,
              text: item.str,
              x: x,
              y: y,
              width: item.width || item.str.length * fontSize * 0.6,
              height: fontSize,
              opacity: 1,
              fontSize: fontSize,
              fontFamily: item.fontName || "Arial",
              isEditing: false,
            });
          }
        });

        setTextElements(textElements);
        renderTextElements(textContext, textElements, viewport);
      } catch (error) {
        console.error("Error rendering page:", error);
      }
    },
    [scale],
  );

  const renderTextElements = useCallback(
    (context: CanvasRenderingContext2D, elements: EditingElement[], viewport: any) => {
      context.clearRect(0, 0, viewport.width, viewport.height);

      elements.forEach((element) => {
        context.save();
        context.globalAlpha = element.opacity;
        context.font = `${element.fontSize}px ${element.fontFamily}`;
        context.fillStyle = element.isEditing ? "blue" : "red";
        context.strokeStyle = element.isEditing ? "blue" : "red";
        context.lineWidth = 1;

        // Draw text
        context.fillText(element.text, element.x, element.y);

        // Draw bounding box
        context.strokeRect(element.x, element.y - element.fontSize, element.width, element.height);

        context.restore();
      });
    },
    [],
  );

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!textCanvasRef.current) return;

      const canvas = textCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      // Find clicked text element
      for (const element of textElements) {
        if (x >= element.x && x <= element.x + element.width && y >= element.y - element.fontSize && y <= element.y) {
          setSelectedElement(element.id);

          // Toggle editing state
          setTextElements((prev) =>
            prev.map((el) => ({
              ...el,
              isEditing: el.id === element.id ? !el.isEditing : false,
            })),
          );

          return;
        }
      }

      // Clicked outside any text element
      setSelectedElement(null);
      setTextElements((prev) => prev.map((el) => ({ ...el, isEditing: false })));
    },
    [textElements],
  );

  const updateTextElement = useCallback(
    (id: string, updates: Partial<TextElement>) => {
      setTextElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)));

      // Re-render text elements
      if (textCanvasRef.current && pdfDocument) {
        const context = textCanvasRef.current.getContext("2d");

        if (context) {
          const updatedElements = textElements.map((el) => (el.id === id ? { ...el, ...updates } : el));

          renderTextElements(context, updatedElements, {
            width: textCanvasRef.current.width,
            height: textCanvasRef.current.height,
          });
        }
      }
    },
    [textElements, pdfDocument, renderTextElements],
  );

  const changePage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDocument || pageNumber < 1 || pageNumber > totalPages) return;

      setCurrentPage(pageNumber);
      await renderPage(pdfDocument, pageNumber);
    },
    [pdfDocument, totalPages, renderPage],
  );

  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPage(pdfDocument, currentPage);
    }
  }, [pdfDocument, currentPage, renderPage]);

  const selectedElementData = textElements.find((el) => el.id === selectedElement);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Loading..." : "Upload PDF"}
        </Button>

        <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />

        {pdfDocument && (
          <div className="flex items-center gap-2">
            <Button onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1} variant="outline" size="sm">
              Previous
            </Button>

            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>

            <div className="flex items-center gap-2 ml-4">
              <Label htmlFor="scale" className="text-sm">
                Scale:
              </Label>
              <Input
                id="scale"
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-20"
              />
              <span className="text-sm">{Math.round(scale * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-4">
        {/* PDF Viewer */}
        <div className="flex-1 relative bg-gray-100 rounded-lg overflow-auto">
          {pdfDocument ? (
            <div className="relative inline-block">
              <canvas ref={canvasRef} className="absolute top-0 left-0 z-0" />
              <canvas
                ref={textCanvasRef}
                className="absolute top-0 left-0 z-10 cursor-pointer"
                onClick={handleCanvasClick}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">No PDF uploaded</p>
                <p className="text-sm">Click &quot;Upload PDF&quot; to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Text Editor Panel */}
        {selectedElementData && (
          <Card className="w-80 p-4">
            <h3 className="text-lg font-semibold mb-4">Edit Text Properties</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="text-value" className="text-sm font-medium">
                  Text Value
                </Label>
                <Input
                  id="text-value"
                  value={selectedElementData.text}
                  onChange={(e) => updateTextElement(selectedElement!, { text: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="opacity" className="text-sm font-medium">
                  Opacity: {Math.round(selectedElementData.opacity * 100)}%
                </Label>
                <Input
                  id="opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedElementData.opacity}
                  onChange={(e) => updateTextElement(selectedElement!, { opacity: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="font-size" className="text-sm font-medium">
                  Font Size: {Math.round(selectedElementData.fontSize)}px
                </Label>
                <Input
                  id="font-size"
                  type="range"
                  min="8"
                  max="72"
                  step="1"
                  value={selectedElementData.fontSize}
                  onChange={(e) => updateTextElement(selectedElement!, { fontSize: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">
                  Position: ({Math.round(selectedElementData.x)}, {Math.round(selectedElementData.y)})
                </p>
                <p className="text-xs text-gray-500">
                  Size: {Math.round(selectedElementData.width)} × {Math.round(selectedElementData.height)}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/*  */}
    </div>
  );
};
