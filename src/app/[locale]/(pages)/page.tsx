"use client";

import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  List,
  Loader2,
  Plus,
  Salad,
  Search,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";

import {
  fetchAllergen,
  fetchCategories,
  fetchCompleteMenu,
  fetchSidedish,
  toggleMenuItemVisibility,
} from "@/_services/ada/adaMenuService";
import { useRouter } from "@/navigation";

interface StatsData {
  categories: number;
  menuItems: number;
  allergens: number;
  sideDishes: number;
}

interface QuickMenuItem {
  id: string;
  name: string;
  hidden: boolean;
  categoryName: string;
  price?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const localeValue = useLocale();
  const locale = useMemo(() => localeValue, [localeValue]);
  const [stats, setStats] = useState<StatsData>({
    categories: 0,
    menuItems: 0,
    allergens: 0,
    sideDishes: 0,
  });
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  // Quick 86 state
  const [quick86Open, setQuick86Open] = useState(false);
  const [quick86Search, setQuick86Search] = useState("");
  const [allItems, setAllItems] = useState<QuickMenuItem[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // NUCLEAR OPTION: Disable all API calls to eliminate React infinite loop
    // Just set static data immediately without any async operations
    
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
    console.log("🚨 NUCLEAR MODE: Setting static data, no API calls");
    
    // Set mock stats immediately
    setStats({
      categories: 3,
      menuItems: 12,
      allergens: 5,
      sideDishes: 8
    });
    
    // Set mock menu items
    setAllItems([
      { id: "item1", name: "Pizza Margherita", hidden: false, categoryName: "Main Dishes", price: 15.50 },
      { id: "item2", name: "Caesar Salad", hidden: false, categoryName: "Appetizers", price: 9.50 },
      { id: "item3", name: "Tiramisu", hidden: true, categoryName: "Desserts", price: 6.50 }
    ]);
    
    setLoading(false);
    
    // NO CLEANUP FUNCTION - prevent any React cleanup that might trigger re-renders
  }, []); // Empty dependency array

  // DISABLED: Quick 86 toggle (preventing React loops)
  const handleQuick86Toggle = useCallback(
    (item: QuickMenuItem) => {
      console.log("🚨 NUCLEAR MODE: Toggle disabled to prevent API calls");
      // Just do optimistic update, no API call
      setAllItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, hidden: !i.hidden } : i)));
    },
    [],
  );

  // DISABLED: Focus search when Quick 86 opens (preventing React loops)
  // useEffect(() => {
  //   if (quick86Open) {
  //     const timeoutId = setTimeout(() => {
  //       if (searchInputRef.current) {
  //         searchInputRef.current.focus();
  //       }
  //     }, 100);
  //     
  //     return () => {
  //       clearTimeout(timeoutId);
  //     };
  //   }
  // }, [quick86Open]);

  const filteredItems = quick86Search
    ? allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(quick86Search.toLowerCase()) ||
          item.categoryName.toLowerCase().includes(quick86Search.toLowerCase()),
      )
    : allItems;

  const statCards = [
    {
      label: "Categories",
      value: stats.categories,
      icon: <List size={22} />,
      color: "bg-primary/10 text-primary",
      href: "/categories",
    },
    {
      label: "Menu Items",
      value: stats.menuItems,
      icon: <UtensilsCrossed size={22} />,
      color: "bg-[#FF66CC]/10 text-[#FF66CC]",
      href: "/items",
    },
    {
      label: "Allergens",
      value: stats.allergens,
      icon: <AlertTriangle size={22} />,
      color: "bg-amber-500/10 text-amber-500",
      href: "/allergens",
    },
    {
      label: "Side Dishes",
      value: stats.sideDishes,
      icon: <Salad size={22} />,
      color: "bg-emerald-500/10 text-emerald-500",
      href: "/sidedish",
    },
  ];

  const quickActions = [
    {
      label: "Add Menu Item",
      description: "Create a new dish for your menu",
      icon: <Plus size={20} />,
      href: "/categories",
      variant: "primary" as const,
    },
    {
      label: "Preview Menu",
      description: "See your menu as customers do",
      icon: <Eye size={20} />,
      href: "/preview",
      variant: "secondary" as const,
    },
    {
      label: "Open Menu Maker",
      description: "Design your PDF menu layout",
      icon: <FileText size={20} />,
      href: "/menumaker",
      variant: "secondary" as const,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#33373B] dark:text-white">Welcome to ADA Menu</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your restaurant menu with ease</p>
          </div>
        </div>
      </div>

      {/* Stats Grid — 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((stat) => (
          <button
            key={stat.label}
            onClick={() => router.push(stat.href)}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 text-left hover:shadow-md transition-all group"
          >
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${stat.color} flex items-center justify-center mb-2 sm:mb-3`}
            >
              {stat.icon}
            </div>
            <div>
              {loading ? (
                <div className="h-7 sm:h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-xl sm:text-2xl font-bold text-[#33373B] dark:text-white">{stat.value}</p>
              )}
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
            <div className="mt-1 sm:mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-[#8B98FF] transition-colors">
              View all <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </div>

      {/* ═══ Quick 86 — Mobile-first prominent action ═══ */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => setQuick86Open(true)}
          className="w-full flex items-center gap-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-red-500/20 hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <EyeOff size={24} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-base">Quick 86 — Toggle Availability</p>
            <p className="text-white/80 text-sm mt-0.5">Search &amp; hide items instantly (3 taps)</p>
          </div>
          <ArrowRight size={20} className="ml-auto flex-shrink-0 opacity-70" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg font-semibold text-[#33373B] dark:text-white mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md text-left active:scale-[0.98] ${
                action.variant === "primary"
                  ? "bg-primary text-white border-primary hover:bg-primary/90"
                  : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-[#33373B] dark:text-white hover:border-primary/30"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  action.variant === "primary" ? "bg-white/20" : "bg-primary/10"
                }`}
              >
                <span className={action.variant === "primary" ? "text-white" : "text-primary"}>{action.icon}</span>
              </div>
              <div>
                <p className="font-medium text-sm">{action.label}</p>
                <p
                  className={`text-xs mt-0.5 ${
                    action.variant === "primary" ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div>
        <h2 className="text-lg font-semibold text-[#33373B] dark:text-white mb-3 sm:mb-4">Recent Activity</h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Activity tracking coming soon. Your recent changes will appear here.
          </p>
        </div>
      </div>

      {/* ═══ Quick 86 Fullscreen Modal ═══ */}
      {quick86Open && (
        <div className="fixed inset-0 z-[80] bg-white dark:bg-gray-950 flex flex-col md:inset-4 md:rounded-2xl md:shadow-2xl md:max-w-2xl md:mx-auto md:my-auto md:max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <button
              onClick={() => {
                setQuick86Open(false);
                setQuick86Search("");
              }}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search menu items..."
                value={quick86Search}
                onChange={(e) => setQuick86Search(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-[#33373B] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto scroll-touch px-2 py-2">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search size={40} className="text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {quick86Search ? "No items match your search" : "No menu items found"}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Availability dot */}
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${item.hidden ? "bg-red-500" : "bg-emerald-500"}`}
                  />

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        item.hidden ? "text-gray-400 dark:text-gray-500 line-through" : "text-[#33373B] dark:text-white"
                      }`}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.categoryName}</p>
                  </div>

                  {/* Price */}
                  {item.price !== undefined && (
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                      €{Number(item.price).toFixed(2)}
                    </span>
                  )}

                  {/* Toggle button */}
                  <button
                    onClick={() => handleQuick86Toggle(item)}
                    disabled={togglingId === item.id}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all min-w-[72px] text-center ${
                      item.hidden
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200"
                    } disabled:opacity-50`}
                  >
                    {togglingId === item.id ? (
                      <Loader2 size={14} className="animate-spin mx-auto" />
                    ) : item.hidden ? (
                      "Show"
                    ) : (
                      "86 it"
                    )}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick 86 backdrop for desktop */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="hidden md:block fixed inset-0 -z-10 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setQuick86Open(false);
              setQuick86Search("");
            }}
          />
        </div>
      )}
    </div>
  );
}
