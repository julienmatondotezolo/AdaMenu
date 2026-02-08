"use client";

import { AlertTriangle, ExternalLink, Plus, Search, UtensilsCrossed } from "lucide-react";
import { useLocale } from "next-intl";
import React, { useEffect, useState } from "react";

import { fetchAllergen, fetchCompleteMenu } from "@/_services/ada/adaMenuService";

/* ─── EU 14 Standard Allergen Icons ──────────────────────────────────── */
const allergenMeta: Record<string, { emoji: string; color: string; bgLight: string; bgDark: string }> = {
  gluten: { emoji: "🌾", color: "text-amber-700", bgLight: "bg-amber-50", bgDark: "dark:bg-amber-900/20" },
  crustaceans: { emoji: "🦐", color: "text-red-700", bgLight: "bg-red-50", bgDark: "dark:bg-red-900/20" },
  eggs: { emoji: "🥚", color: "text-yellow-700", bgLight: "bg-yellow-50", bgDark: "dark:bg-yellow-900/20" },
  fish: { emoji: "🐟", color: "text-blue-700", bgLight: "bg-blue-50", bgDark: "dark:bg-blue-900/20" },
  peanuts: { emoji: "🥜", color: "text-orange-700", bgLight: "bg-orange-50", bgDark: "dark:bg-orange-900/20" },
  soybeans: { emoji: "🫘", color: "text-green-700", bgLight: "bg-green-50", bgDark: "dark:bg-green-900/20" },
  milk: { emoji: "🥛", color: "text-sky-700", bgLight: "bg-sky-50", bgDark: "dark:bg-sky-900/20" },
  nuts: { emoji: "🌰", color: "text-amber-800", bgLight: "bg-amber-50", bgDark: "dark:bg-amber-900/20" },
  celery: { emoji: "🥬", color: "text-emerald-700", bgLight: "bg-emerald-50", bgDark: "dark:bg-emerald-900/20" },
  mustard: { emoji: "🟡", color: "text-yellow-700", bgLight: "bg-yellow-50", bgDark: "dark:bg-yellow-900/20" },
  sesame: { emoji: "⚪", color: "text-stone-700", bgLight: "bg-stone-50", bgDark: "dark:bg-stone-900/20" },
  sulphites: { emoji: "🍷", color: "text-purple-700", bgLight: "bg-purple-50", bgDark: "dark:bg-purple-900/20" },
  lupin: { emoji: "🌸", color: "text-pink-700", bgLight: "bg-pink-50", bgDark: "dark:bg-pink-900/20" },
  molluscs: { emoji: "🐚", color: "text-teal-700", bgLight: "bg-teal-50", bgDark: "dark:bg-teal-900/20" },
};

function getMeta(name: string) {
  const key = name?.toLowerCase()?.trim();

  return (
    allergenMeta[key] || {
      emoji: "⚠️",
      color: "text-gray-700",
      bgLight: "bg-gray-50",
      bgDark: "dark:bg-gray-800",
    }
  );
}

/* ─── Allergen Card ──────────────────────────────────────────────────── */
function AllergenCard({ allergen, locale, itemCount }: { allergen: any; locale: string; itemCount: number }) {
  const name = allergen.names?.[locale] || allergen.name || "Unknown";
  const meta = getMeta(allergen.name);

  return (
    <div
      className={`group ${meta.bgLight} ${meta.bgDark} rounded-2xl border border-gray-100 dark:border-gray-800 p-5 card-hover cursor-pointer relative overflow-hidden`}
    >
      {/* Decorative large emoji background */}
      <div className="absolute -bottom-4 -right-4 text-6xl opacity-10 group-hover:opacity-15 transition-opacity duration-300 select-none">
        {meta.emoji}
      </div>

      <div className="relative">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center mb-4 shadow-sm text-2xl">
          {meta.emoji}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-sm text-[#33373B] dark:text-white mb-1">{name}</h3>

        {/* Item count */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <UtensilsCrossed size={11} />
          <span>
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* ─── Allergens Page ─────────────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function AllergensPage() {
  const locale = useLocale();

  const [allergens, setAllergens] = useState<any[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [allergensRes, menuRes] = await Promise.allSettled([fetchAllergen(), fetchCompleteMenu()]);

        if (allergensRes.status === "fulfilled" && Array.isArray(allergensRes.value)) {
          setAllergens(allergensRes.value);
        }

        // Count items per allergen
        if (menuRes.status === "fulfilled" && Array.isArray(menuRes.value)) {
          const counts: Record<string, number> = {};

          for (const cat of menuRes.value) {
            const catItems = cat.menuItems || [];

            for (const menuItem of catItems) {
              if (menuItem.allergens && Array.isArray(menuItem.allergens)) {
                for (const a of menuItem.allergens) {
                  counts[a.id] = (counts[a.id] || 0) + 1;
                }
              }
            }
            // subcategories
            if (cat.subCategories) {
              for (const sub of cat.subCategories) {
                const subItems = sub.menuItems || [];

                for (const menuItem of subItems) {
                  if (menuItem.allergens && Array.isArray(menuItem.allergens)) {
                    for (const a of menuItem.allergens) {
                      counts[a.id] = (counts[a.id] || 0) + 1;
                    }
                  }
                }
              }
            }
          }
          setItemCounts(counts);
        }
      } catch (e) {
        console.error("Failed to load allergens:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = allergens.filter((a) => {
    if (!search) return true;

    const name = (a.names?.[locale] || a.name || "").toLowerCase();

    return name.includes(search.toLowerCase());
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#33373B] dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-500" />
            </div>
            Allergens
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm ml-[46px]">
            EU 14 standard allergens · Manage allergen info
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium text-sm rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all self-start">
          <Plus size={18} />
          Add Allergen
        </button>
      </div>

      {/* EU compliance notice */}
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-4 mb-6">
        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center flex-shrink-0">
          <ExternalLink size={14} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">EU Regulation 1169/2011</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            All 14 major allergens must be declared on menus in Belgium. Ensure each menu item has correct allergen
            information.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search allergens..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-[#33373B] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* ─── Grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse"
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-14" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-amber-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {search ? "No allergens match your search" : "No allergens found"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((allergen) => (
            <AllergenCard
              key={allergen.id}
              allergen={allergen}
              locale={locale}
              itemCount={itemCounts[allergen.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
