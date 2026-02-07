/* eslint-disable prettier/prettier */
import {
  AlertCircle,
  Camera,
  Check,
  Download,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { AI_API_URL } from "../../lib/config";
import { indexedDBService } from "../../lib/indexedDBService";
import { MenuProject } from "../../types/menumaker";
import { Button } from "../ui/button";
import { Dialog } from "../ui/Dialog";
import { Input } from "../ui/input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = "upload" | "processing" | "result" | "error";

interface AIImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void; // called after a successful import so parent can refresh
}

interface GenerationMeta {
  generationTime?: number;
}

// ---------------------------------------------------------------------------
// Validation helper (mirrors ProjectManager's validateMenuProject)
// ---------------------------------------------------------------------------

function validateMenuProject(data: unknown): data is MenuProject {
  try {
    if (typeof data !== "object" || data === null) return false;
    const d = data as Record<string, unknown>;
    if (typeof d.id !== "string") return false;
    if (typeof d.name !== "string") return false;
    if (typeof d.createdAt !== "string") return false;
    if (typeof d.updatedAt !== "string") return false;
    if (!Array.isArray(d.pages)) return false;
    if (typeof d.settings !== "object") return false;

    for (const page of d.pages as any[]) {
      if (typeof page !== "object" || page === null) return false;
      if (typeof page.id !== "string") return false;
      if (typeof page.name !== "string") return false;
      if (typeof page.format !== "object") return false;
      if (typeof page.backgroundColor !== "string") return false;
      if (!Array.isArray(page.layers)) return false;

      for (const layer of page.layers) {
        if (typeof layer !== "object" || layer === null) return false;
        if (typeof layer.id !== "string") return false;
        if (typeof layer.name !== "string") return false;
        if (typeof layer.visible !== "boolean") return false;
        if (typeof layer.locked !== "boolean") return false;
        if (typeof layer.opacity !== "number") return false;
        if (!Array.isArray(layer.elements)) return false;

        for (const el of layer.elements) {
          if (typeof el !== "object" || el === null) return false;
          if (typeof el.id !== "string") return false;
          if (!["text", "image", "background", "data", "shape"].includes(el.type)) return false;
          if (typeof el.x !== "number") return false;
          if (typeof el.y !== "number") return false;
          if (typeof el.width !== "number") return false;
          if (typeof el.height !== "number") return false;
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROGRESS_MESSAGES = [
  "Analyzing menu layout…",
  "Detecting colors and typography…",
  "Mapping elements and positions…",
  "Generating template…",
];

function countElements(project: MenuProject) {
  let text = 0;
  let shapes = 0;
  let images = 0;

  for (const page of project.pages) {
    for (const layer of page.layers) {
      for (const el of layer.elements) {
        if (el.type === "text" || el.type === "data") text++;
        else if (el.type === "shape") shapes++;
        else if (el.type === "image") images++;
      }
    }
  }
  return { text, shapes, images };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIImportModal({ open, onClose, onImported }: AIImportModalProps) {
  // State
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [pageFormat, setPageFormat] = useState<"A4" | "A5">("A4");
  const [progressIdx, setProgressIdx] = useState(0);
  const [result, setResult] = useState<MenuProject | null>(null);
  const [meta, setMeta] = useState<GenerationMeta>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset everything when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep("upload");
      setFile(null);
      setPreview(null);
      setRestaurantName("");
      setPageFormat("A4");
      setProgressIdx(0);
      setResult(null);
      setMeta({});
      setErrorMsg("");
      setIsDragging(false);
    }
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      abortRef.current?.abort();
    };
  }, [open]);

  // Cycle progress messages
  useEffect(() => {
    if (step === "processing") {
      setProgressIdx(0);
      progressTimer.current = setInterval(() => {
        setProgressIdx((i) => (i + 1) % PROGRESS_MESSAGES.length);
      }, 3500);
    } else if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [step]);

  // ------ File handling ------

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const removeFile = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [preview]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  // Drag & drop
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // ------ Generate ------

  const handleGenerate = async () => {
    if (!file) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setStep("processing");

    try {
      const form = new FormData();
      form.append("photo", file);
      if (restaurantName.trim()) form.append("restaurantName", restaurantName.trim());
      form.append("pageFormat", pageFormat);

      const res = await fetch(`${AI_API_URL}/api/menu/generate-template`, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || body?.message || `Server error (${res.status})`);
      }

      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || "Invalid response from server.");
      }

      const project: MenuProject = json.data;

      if (!validateMenuProject(project)) {
        throw new Error("The generated template has an invalid structure. Please try again.");
      }

      setResult(project);
      setMeta(json.meta || {});
      setStep("result");
    } catch (err: any) {
      if (err.name === "AbortError") {
        setStep("upload");
        return;
      }
      console.error("AI Import error:", err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStep("error");
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setStep("upload");
  };

  // ------ Import to IndexedDB ------

  const handleImport = async () => {
    if (!result) return;
    try {
      // Give a new ID + timestamps to avoid collisions
      const imported: MenuProject = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        name: result.name ? `${result.name} (AI)` : "AI Imported Menu",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await indexedDBService.saveProject(imported);
      onImported();
      onClose();
    } catch (err) {
      console.error("Failed to save imported project:", err);
      setErrorMsg("Failed to save the project. Please try again.");
      setStep("error");
    }
  };

  // ------ Download JSON ------

  const handleDownload = () => {
    if (!result) return;
    const jsonStr = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(result.name || "ai-menu").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ------ Render ------

  const counts = result ? countElements(result) : null;

  return (
    <Dialog open={open} setIsOpen={(v) => !v && onClose()}>
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-t-2xl">
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">AI Menu Import</h2>
              <p className="text-sm text-white/80 mt-0.5">
                Upload a photo of any menu and our AI will recreate it digitally
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* ---- STEP: Upload ---- */}
          {step === "upload" && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                role="button"
                tabIndex={0}
                className={`
                  relative flex flex-col items-center justify-center
                  w-full min-h-[240px] rounded-2xl border-2 border-dashed
                  transition-all duration-300 cursor-pointer
                  ${
                    isDragging
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-[1.01]"
                      : file
                        ? "border-green-400 bg-green-50/50 dark:bg-green-900/10"
                        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10"
                  }
                `}
                onClick={() => !file && fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !file) fileInputRef.current?.click();
                }}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                {file && preview ? (
                  <div className="relative p-4 flex flex-col items-center gap-3">
                    <img
                      src={preview}
                      alt="Menu preview"
                      className="max-h-48 rounded-xl shadow-lg object-contain"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium truncate max-w-[260px]">
                      {file.name}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/60 text-red-600 dark:text-red-400 transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <Camera className="w-8 h-8 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                        Drop a menu photo here or click to browse
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        JPG, PNG or WEBP — max 20 MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onInputChange}
                className="hidden"
              />

              {/* Restaurant name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Restaurant Name <span className="text-gray-400">(optional)</span>
                </label>
                <Input
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g. Chez Marie"
                />
              </div>

              {/* Page format toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Page Format
                </label>
                <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {(["A4", "A5"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setPageFormat(fmt)}
                      className={`px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                        pageFormat === fmt
                          ? "bg-purple-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={!file}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                Generate Template
              </Button>
            </div>
          )}

          {/* ---- STEP: Processing ---- */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-purple-400/30" />
                <div className="relative p-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>

              <div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 transition-all duration-500">
                  {PROGRESS_MESSAGES[progressIdx]}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  This usually takes 30–60 seconds
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleCancel}
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* ---- STEP: Result ---- */}
          {step === "result" && result && counts && (
            <div className="flex flex-col items-center py-10 gap-6 text-center">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Template Generated!</h3>
                {meta.generationTime && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Completed in {(meta.generationTime / 1000).toFixed(1)}s
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                <Stat label="Text elements" value={counts.text} />
                <Stat label="Shapes" value={counts.shapes} />
                <Stat label="Images" value={counts.images} />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button
                  onClick={handleImport}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  <Upload className="w-4 h-4" />
                  Import to Menumaker
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download JSON
                </Button>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setMeta({});
                  setStep("upload");
                }}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline mt-1"
              >
                ← Try Again
              </button>
            </div>
          )}

          {/* ---- STEP: Error ---- */}
          {step === "error" && (
            <div className="flex flex-col items-center py-10 gap-6 text-center">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Something went wrong</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 max-w-sm">
                  {errorMsg || "An unexpected error occurred."}
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left text-sm text-amber-800 dark:text-amber-200 max-w-sm w-full">
                <p className="font-semibold mb-1">Tips</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Make sure the photo is clear and well-lit</li>
                  <li>Avoid blurry or angled shots</li>
                  <li>Crop to show only the menu area</li>
                </ul>
              </div>

              <Button
                onClick={() => {
                  setErrorMsg("");
                  setStep("upload");
                }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Small stat card used in the result view
// ---------------------------------------------------------------------------

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
