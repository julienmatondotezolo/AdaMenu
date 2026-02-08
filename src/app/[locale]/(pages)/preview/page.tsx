"use client";

import { ExternalLink, Eye } from "lucide-react";
import React from "react";

export default function PreviewPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#33373B] dark:text-white flex items-center gap-2">
          <Eye size={24} className="text-primary" />
          Live Preview
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Preview how your menu looks to customers</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Eye size={32} className="text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-[#33373B] dark:text-white mb-2">Live Preview Coming Soon</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          Preview your digital menu as your customers will see it. Real-time updates as you make changes.
        </p>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
          <ExternalLink size={16} />
          Open Menu Maker Instead
        </button>
      </div>
    </div>
  );
}
