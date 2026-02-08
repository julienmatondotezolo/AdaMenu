/* eslint-disable newline-after-var */
"use client";

import { AlertTriangle, Euro, Globe, Image as ImageIcon, Loader2, Save, Trash2, Upload, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Switch } from "@/components/ui/switch";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface MenuItem {
  id?: string;
  name?: string;
  names?: Record<string, string>;
  description?: string;
  descriptions?: Record<string, string>;
  price?: number;
  categoryId?: string;
  allergens?: any[];
  hidden?: boolean;
  image?: string;
  sideDishes?: any[];
  supplements?: any[];
}

interface Category {
  id: string;
  name?: string;
  names?: Record<string, string>;
  subCategories?: Category[];
}

interface MenuItemEditorProps {
  item: MenuItem | null;
  categories: Category[];
  allergens: any[];
  locale: string;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onSave: (data: any) => void;
}

/* ─── Language tabs ──────────────────────────────────────────────────── */
const LANGS = [
  { code: "nl", label: "NL", flag: "🇳🇱" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "en", label: "EN", flag: "🇬🇧" },
];

/* ─── EU Allergen data ───────────────────────────────────────────────── */
const allergenEmojis: Record<string, string> = {
  gluten: "🌾",
  crustaceans: "🦐",
  eggs: "🥚",
  fish: "🐟",
  peanuts: "🥜",
  soybeans: "🫘",
  milk: "🥛",
  nuts: "🌰",
  celery: "🥬",
  mustard: "🟡",
  sesame: "⚪",
  sulphites: "🍷",
  lupin: "🌸",
  molluscs: "🐚",
};

/* ─── Section component ──────────────────────────────────────────────── */
function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* ─── MenuItemEditor ─────────────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════ */
export function MenuItemEditor({ item, categories, allergens, locale, onClose, onSave }: MenuItemEditorProps) {
  const isNew = !item?.id;
  const overlayRef = useRef<HTMLDivElement>(null);

  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [langTab, setLangTab] = useState(locale);

  // Form state
  const [names, setNames] = useState<Record<string, string>>(item?.names || { nl: "", fr: "", en: "" });

  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    item?.descriptions || { nl: "", fr: "", en: "" },
  );

  const [price, setPrice] = useState(item?.price?.toString() || "");
  const [categoryId, setCategoryId] = useState(item?.categoryId || "");

  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(
    new Set(item?.allergens?.map((a: any) => a.id) || []),
  );

  const [hidden, setHidden] = useState(item?.hidden || false);
  const [imagePreview, setImagePreview] = useState(item?.image || "");
  const [dragOver, setDragOver] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, [handleClose]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...(item || {}),
        names,
        descriptions,
        price: parseFloat(price) || 0,
        categoryId,
        allergens: Array.from(selectedAllergens),
        hidden,
        image: imagePreview,
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAllergen = (id: string) => {
    setSelectedAllergens((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get all subcategories for the selected category
  const flatCategories: { id: string; name: string; indent: boolean }[] = [];

  categories.forEach((cat) => {
    flatCategories.push({
      id: cat.id,
      name: cat.names?.[locale] || cat.name || "",
      indent: false,
    });
    if (cat.subCategories) {
      cat.subCategories.forEach((sub) => {
        flatCategories.push({
          id: sub.id,
          name: sub.names?.[locale] || sub.name || "",
          indent: true,
        });
      });
    }
  });

  return (
    <>
      {/* Overlay */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm ${
          closing ? "overlay-fade-out" : "overlay-fade-in"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl flex flex-col ${
          closing ? "drawer-slide-out" : "drawer-slide-in"
        }`}
      >
        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#33373B] dark:text-white">
            {isNew ? "New Menu Item" : "Edit Item"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* ─── Scrollable content ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Image upload */}
          <Section title="Photo" icon={<ImageIcon size={12} />}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleImageDrop}
              className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : imagePreview
                    ? "border-transparent"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {imagePreview ? (
                <div className="relative h-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImagePreview("")}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <Trash2 size={14} className="text-white" />
                  </button>
                </div>
              ) : (
                // eslint-disable-next-line jsx-a11y/label-has-associated-control
                <label className="flex flex-col items-center justify-center py-10 cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <Upload size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Drop image here or <span className="text-primary">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>
          </Section>

          {/* Name with language tabs */}
          <Section title="Item Name" icon={<Globe size={12} />}>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-3">
              {LANGS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLangTab(lang.code)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    langTab === lang.code
                      ? "bg-white dark:bg-gray-700 shadow-sm text-[#33373B] dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
                >
                  <span>{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={names[langTab] || ""}
              onChange={(e) => setNames({ ...names, [langTab]: e.target.value })}
              placeholder={`Item name (${langTab.toUpperCase()})`}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-[#33373B] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </Section>

          {/* Description */}
          <Section title="Description">
            <textarea
              value={descriptions[langTab] || ""}
              onChange={(e) => setDescriptions({ ...descriptions, [langTab]: e.target.value })}
              placeholder={`Description (${langTab.toUpperCase()})`}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-[#33373B] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </Section>

          {/* Price */}
          <Section title="Price" icon={<Euro size={12} />}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-[#33373B] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </Section>

          {/* Category */}
          <Section title="Category">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-[#33373B] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 16px center",
              }}
            >
              <option value="">Select category</option>
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.indent ? `  └ ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </Section>

          {/* Allergens */}
          <Section title="Allergens" icon={<AlertTriangle size={12} />}>
            <div className="grid grid-cols-2 gap-2">
              {allergens.map((allergen: any) => {
                const isSelected = selectedAllergens.has(allergen.id);
                const emoji = allergenEmojis[allergen.name?.toLowerCase()] || "⚠️";
                const allergenName = allergen.names?.[locale] || allergen.name || "Unknown";

                return (
                  <button
                    key={allergen.id}
                    onClick={() => toggleAllergen(allergen.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                      isSelected
                        ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="truncate text-xs font-medium">{allergenName}</span>
                    {isSelected && (
                      <span className="ml-auto flex-shrink-0 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path
                            d="M1.5 4L3 5.5L6.5 2"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Availability */}
          <Section title="Availability">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <p className="text-sm font-medium text-[#33373B] dark:text-white">
                  {hidden ? "Hidden from menu" : "Visible to customers"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {hidden ? "This item won't appear on your menu" : "Customers can see and order this item"}
                </p>
              </div>
              <Switch checked={!hidden} onCheckedChange={(checked) => setHidden(!checked)} />
            </div>
          </Section>
        </div>

        {/* ─── Sticky footer ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isNew ? "Create Item" : "Save Changes"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
