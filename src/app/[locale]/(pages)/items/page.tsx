"use client";

import { List, Search, UtensilsCrossed } from "lucide-react";
import React, { useEffect, useState } from "react";

import { fetchCategories, fetchMenuItemByCategoryId } from "@/_services/ada/adaMenuService";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        const cats = await fetchCategories();

        if (Array.isArray(cats)) {
          setCategories(cats);
          const allItems: MenuItem[] = [];

          for (const cat of cats) {
            try {
              const catItems = await fetchMenuItemByCategoryId({ categoryId: cat.id });

              if (Array.isArray(catItems)) {
                allItems.push(...catItems.map((item: any) => ({ ...item, categoryId: cat.id })));
              }
            } catch {
              // skip failed category
            }
          }
          setItems(allItems);
        }
      } catch (e) {
        console.error("Failed to load items:", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || item.categoryId === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#33373B] dark:text-white flex items-center gap-2">
          <UtensilsCrossed size={24} className="text-primary" />
          Menu Items
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">All menu items across categories</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <List size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No menu items found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {search || filterCategory ? "Try adjusting your filters" : "Create your first menu item in Categories"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const category = categories.find((c) => c.id === item.categoryId);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-[#33373B] dark:text-white text-sm">{item.name}</h3>
                {item.description && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  {item.price !== undefined && (
                    <span className="text-primary font-semibold text-sm">€{Number(item.price).toFixed(2)}</span>
                  )}
                  {category && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                      {category.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
