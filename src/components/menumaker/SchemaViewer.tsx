import { ChevronDown, ChevronRight, Code, FileText } from "lucide-react";
import React, { useState } from "react";

import { MENU_PROJECT_SCHEMA } from "../../types/menumaker";
import { Button } from "../ui/button";

export function SchemaViewer() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewSchema = () => {
    const schemaString = JSON.stringify(MENU_PROJECT_SCHEMA, null, 2);
    const newWindow = window.open("", "_blank");

    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Menu Project Schema</title>
            <style>
              body { font-family: 'Monaco', 'Courier New', monospace; padding: 20px; background: #f8f9fa; }
              pre { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: auto; }
              h1 { color: #333; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <h1>📋 Menu Project Schema (MENU_PROJECT_SCHEMA)</h1>
            <pre>${schemaString}</pre>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <FileText className="w-4 h-4" />
        Schema Details
      </Button>

      {isExpanded && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">📋 MENU_PROJECT_SCHEMA Structure</h4>

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4">
            <p>
              <strong>Required Fields:</strong> id, name, createdAt, updatedAt, pages, settings
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <p>
                  <strong>📄 Pages:</strong>
                </p>
                <ul className="ml-4 space-y-1 text-xs">
                  <li>• Page format (A4, A5, Custom)</li>
                  <li>• Background settings</li>
                  <li>• Layers with elements</li>
                  <li>• Thumbnails</li>
                </ul>
              </div>
              <div>
                <p>
                  <strong>🎨 Elements:</strong>
                </p>
                <ul className="ml-4 space-y-1 text-xs">
                  <li>• Text elements with typography</li>
                  <li>• Image elements with filters</li>
                  <li>• Data elements for menu items</li>
                  <li>• Background & shape elements</li>
                </ul>
              </div>
            </div>
          </div>

          <Button onClick={handleViewSchema} variant="outline" size="sm" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            View Full Schema
          </Button>
        </div>
      )}
    </div>
  );
}
