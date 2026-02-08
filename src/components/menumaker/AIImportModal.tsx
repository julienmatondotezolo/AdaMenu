/* eslint-disable prettier/prettier */
import {
  AlertCircle,
  Check,
  Download,
  FileImage,
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
  onImported: () => void;
}

interface GenerationMeta {
  generationTime?: number;
}

// ---------------------------------------------------------------------------
// Validation helper
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
  "Detecting colors & typography…",
  "Mapping positions…",
  "Generating template…",
];

function countElements(project: MenuProject) {
  let text = 0;
  let shapes = 0;
  let images = 0;
  let data = 0;

  for (const page of project.pages) {
    for (const layer of page.layers) {
      for (const el of layer.elements) {
        if (el.type === "text") text++;
        else if (el.type === "data") data++;
        else if (el.type === "shape") shapes++;
        else if (el.type === "image") images++;
      }
    }
  }
  return { text, shapes, images, data, total: text + shapes + images + data };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIImportModal({ open, onClose, onImported }: AIImportModalProps) {
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

  // Reset on open/close
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

  // File handling
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setErrorMsg("Unsupported file type. Please upload a JPG, PNG, or WEBP image.");
      setStep("error");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setErrorMsg(`File is too large (${formatFileSize(f.size)}). Maximum size is 20 MB.`);
      setStep("error");
      return;
    }
    // Revoke previous preview URL to prevent memory leak
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, [preview]);

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

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];

    if (f) handleFile(f);
  };

  // Generate
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
      if (err.name === "AbortError") { setStep("upload"); return; }
      console.error("AI Import error:", err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStep("error");
    }
  };

  const handleCancel = () => { abortRef.current?.abort(); setStep("upload"); };

  // Import to IndexedDB
  const handleImport = async () => {
    if (!result) return;
    try {
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

  // Download JSON
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

  const counts = result ? countElements(result) : null;

  return (
    <Dialog open={open} setIsOpen={(v) => !v && onClose()}>
      <div className="flex flex-col max-h-[85vh]">
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#4D6AFF]/10 border border-[#4D6AFF]/20">
              <Sparkles className="w-5 h-5 text-[#4D6AFF]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Menu Import
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload a photo of any menu and our AI will recreate it digitally
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 dark:border-gray-800 mx-6 mt-2" />

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ──── STEP: Upload ──── */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                role="button"
                tabIndex={0}
                className={`relative flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${isDragging ? "border-[#4D6AFF] bg-[#4D6AFF]/5" : file ? "border-[#4D6AFF]/40 bg-[#4D6AFF]/[0.02]" : "border-gray-200 dark:border-gray-700 hover:border-[#4D6AFF]/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}
                onClick={() => !file && fileInputRef.current?.click()}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !file) fileInputRef.current?.click(); }}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                {file && preview ? (
                  /* ── File selected: show as card ── */
                  <div className="flex items-center gap-4 w-full p-4">
                    <img
                      src={preview}
                      alt="Menu preview"
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* ── Empty: show upload prompt ── */
                  <div className="flex flex-col items-center gap-3 py-10">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                      <Upload className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-[#4D6AFF] hover:text-[#3d56d9] cursor-pointer">
                          Click to upload
                        </span>
                        {" "}or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        JPG, PNG or WEBP (max 20 MB)
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
                id="ai-import-file"
              />

              {/* Restaurant name */}
              <div>
                <label htmlFor="ai-restaurant-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Restaurant Name
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <Input
                  id="ai-restaurant-name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g. Chez Marie"
                  className="h-10"
                />
              </div>

              {/* Page format */}
              <div>
                <span id="ai-page-format-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Page Format
                </span>
                <div role="group" aria-labelledby="ai-page-format-label" className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {(["A4", "A5"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setPageFormat(fmt)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        pageFormat === fmt
                          ? "bg-[#4D6AFF] text-white"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ──── STEP: Processing ──── */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-14 gap-5">
              <div className="relative flex items-center justify-center w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-[#4D6AFF]/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4D6AFF] animate-spin" />
                <Sparkles className="w-6 h-6 text-[#4D6AFF]" />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white transition-all duration-500">
                  {PROGRESS_MESSAGES[progressIdx]}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  This usually takes 15–60 seconds
                </p>
              </div>

              <button
                onClick={handleCancel}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mt-2"
              >
                Cancel
              </button>
            </div>
          )}

          {/* ──── STEP: Result ──── */}
          {step === "result" && result && counts && (
            <div className="space-y-5">
              {/* Success banner */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Template generated successfully
                  </p>
                  {meta.generationTime && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      Completed in {(meta.generationTime / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
              </div>

              {/* Element breakdown */}
              <div className="grid grid-cols-4 gap-3">
                <StatCard label="Total" value={counts.total} accent />
                <StatCard label="Text" value={counts.text} />
                <StatCard label="Shapes" value={counts.shapes} />
                <StatCard label="Images" value={counts.images} />
              </div>

              {/* Menu info */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <FileImage className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {result.name || "AI Generated Menu"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {result.pages.length} page{result.pages.length !== 1 ? "s" : ""} · {(result.settings as any)?.defaultFormat || pageFormat} · {counts.total} elements
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ──── STEP: Error ──── */}
          {step === "error" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Generation failed
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                    {errorMsg || "An unexpected error occurred."}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tips for better results
                </p>
                <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-300 mt-0.5">•</span>
                    Make sure the photo is clear and well-lit
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-300 mt-0.5">•</span>
                    Avoid blurry or heavily angled shots
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-300 mt-0.5">•</span>
                    Crop to show only the menu area
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/50">
          {step === "upload" && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="h-10 px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!file}
                className="h-10 px-5 bg-[#4D6AFF] hover:bg-[#3d56d9] text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Template
              </Button>
            </>
          )}

          {step === "result" && (
            <>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="h-10 px-4 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </Button>
              <Button
                onClick={handleImport}
                className="h-10 px-5 bg-[#4D6AFF] hover:bg-[#3d56d9] text-white flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import to Menumaker
              </Button>
            </>
          )}

          {step === "error" && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="h-10 px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={() => { setErrorMsg(""); setStep("upload"); }}
                className="h-10 px-5 bg-[#4D6AFF] hover:bg-[#3d56d9] text-white flex items-center gap-2"
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Stat card for result view
// ---------------------------------------------------------------------------

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center border ${
      accent
        ? "bg-[#4D6AFF]/5 border-[#4D6AFF]/20"
        : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
    }`}>
      <p className={`text-xl font-bold ${
        accent ? "text-[#4D6AFF]" : "text-gray-900 dark:text-white"
      }`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
