"use client";

import { Eye, EyeOff, Filter, List, Loader2, Search, UtensilsCrossed, X } from "lucide-react";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { fetchCategories, fetchCompleteMenu, toggleMenuItemVisibility } from "@/_services/ada/adaMenuService";

interface MenuItem {
  id: string;
  name: string;
  names?: Record<string, string>;
  description?: string;
  descriptions?: Record<string, string>;
  price?: number;
  categoryId?: string;
  categoryName?: string;
  hidden?: boolean;
  allergens?: any[];
}

interface Category {
  id: string;
  name: string;
  names?: Record<string, string>;
  subCategories?: Category[];
}

export default function MenuItemsPage() {
  const locale = useLocale();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, menu] = await Promise.allSettled([fetchCategories(), fetchCompleteMenu()]);

        const categoryList: Category[] = [];
        const allItems: MenuItem[] = [];

        if (cats.status === "fulfilled" && Array.isArray(cats.value)) {
          categoryList.push(...cats.value);
          setCategories(cats.value);
        }

        if (menu.status === "fulfilled" && Array.isArray(menu.value)) {
          for (const cat of menu.value) {
            const catName = cat.names?.[locale] || cat.name || "Unknown";

            if (cat.menuItems) {
              for (const item of cat.menuItems) {
                allItems.push({
                  ...item,
                  name: item.names?.[locale] || item.name || "Unknown",
                  description: item.descriptions?.[locale] || item.description || "",
                  categoryId: cat.id,
                  categoryName: catName,
                });
              }
            }

            if (cat.subCategories) {
              for (const sub of cat.subCategories) {
                const subName = sub.names?.[locale] || sub.name || catName;
                if (sub.menuItems) {
                  for (const item of sub.menuItems) {
                    allItems.push({
                      ...item,
                      name: item.names?.[locale] || item.name || "Unknown",
                      description: item.descriptions?.[locale] || item.description || "",
                      categoryId: sub.id,
                      categoryName: subName,
                    });
                  }
                }
              }
            }
          }
        }

        setItems(allItems);
      } catch (e) {
        console.error("Failed to load items:", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [locale]);

  const handleToggleVisibility = useCallback(
    async (item: MenuItem) => {
      if (togglingId) return;
      setTogglingId(item.id);

      // Optimistic update
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, hidden: !i.hidden } : i)));

      try {
        await toggleMenuItemVisibility({
          menuId: item.id,
          hidden: !item.hidden,
        });
      } catch {
        // Revert on error
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, hidden: item.hidden } : i)));
      } finally {
        setTogglingId(null);
      }
    },
    [togglingId],
  );

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || item.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique category names for chips
  const uniqueCategories = Array.from(
    new Map(
      items.map((item) => [item.categoryId, { id: item.categoryId || "", name: item.categoryName || "" }]),
    ).values(),
  ).filter((cat) => cat.id);

  const visibleCount = filteredItems.filter((i) => !i.hidden).length;
  const hiddenCount = filteredItems.filter((i) => i.hidden).length;

  return (
    <div className="flex flex-col h-full">
      {/* ═══ Header ═══ */}
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 sm:pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-[#33373B] dark:text-white">Menu Items</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {visibleCount} visible · {hiddenCount} hidden
              </p>
            </div>
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden p-2.5 rounded-xl border transition-colors ${
              showFilters || filterCategory
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 dark:border-gray-700 text-gray-500"
            }`}
          >
            <Filter size={18} />
          </button>
        </div>

        {/* Search bar — sticky on mobile */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#33373B] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Category filter chips — horizontal scrollable */}
        <div
          className={`overflow-x-auto scrollbar-hide scroll-touch ${
            showFilters || !showFilters ? "block" : "hidden md:block"
          }`}
        >
          <div className="flex items-center gap-2 pb-3">
            <button
              onClick={() => setFilterCategory("")}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                !filterCategory
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              All ({items.length})
            </button>
            {uniqueCategories.map((cat) => {
              const count = items.filter((i) => i.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(filterCategory === cat.id ? "" : cat.id)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    filterCategory === cat.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Items list ═══ */}
      <div className="flex-1 overflow-y-auto scroll-touch px-4 sm:px-6">
        {loading ? (
          <div className="space-y-3 py-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <List size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No menu items found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {search || filterCategory ? "Try adjusting your filters" : "Create your first menu item in Categories"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {/* ═══ Mobile list view ═══ */}
            <div className="md:hidden space-y-2">
              {filteredItems.map((item) => (
                <MobileMenuItemCard
                  key={item.id}
                  item={item}
                  togglingId={togglingId}
                  onToggle={handleToggleVisibility}
                />
              ))}
            </div>

            {/* ═══ Desktop grid view ═══ */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-shadow ${
                      item.hidden ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-[#33373B] dark:text-white text-sm line-clamp-1">{item.name}</h3>
                      <button
                        onClick={() => handleToggleVisibility(item)}
                        disabled={togglingId === item.id}
                        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ml-2 ${
                          item.hidden
                            ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        }`}
                      >
                        {togglingId === item.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : item.hidden ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    {item.description && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      {item.price !== undefined && (
                        <span className="text-primary font-semibold text-sm">€{Number(item.price).toFixed(2)}</span>
                      )}
                      {item.categoryName && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                          {item.categoryName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Spacer for scroll */}
        <div className="h-4" />
      </div>
    </div>
  );
}

/* ─── Mobile Menu Item Card ──────────────────────────────────────────── */
function MobileMenuItemCard({
  item,
  togglingId,
  onToggle,
}: {
  item: MenuItem;
  togglingId: string | null;
  onToggle: (item: MenuItem) => void;
}) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3.5 transition-all ${
        item.hidden ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Availability dot */}
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.hidden ? "bg-red-500" : "bg-emerald-500"}`} />

        {/* Item info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`font-medium text-sm truncate ${
                item.hidden ? "text-gray-400 dark:text-gray-500 line-through" : "text-[#33373B] dark:text-white"
              }`}
            >
              {item.name}
            </h3>
            {item.price !== undefined && (
              <span className="text-sm font-semibold text-primary flex-shrink-0">€{Number(item.price).toFixed(2)}</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            {item.description && (
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate flex-1">{item.description}</p>
            )}
            {item.categoryName && (
              <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded flex-shrink-0">
                {item.categoryName}
              </span>
            )}
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => onToggle(item)}
          disabled={togglingId === item.id}
          className={`flex-shrink-0 p-2.5 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
            item.hidden
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          }`}
        >
          {togglingId === item.id ? (
            <Loader2 size={18} className="animate-spin" />
          ) : item.hidden ? (
            <Eye size={18} />
          ) : (
            <EyeOff size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
