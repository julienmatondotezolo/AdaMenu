"use client";

import {
  AlertTriangle,
  ArrowRight,
  Eye,
  FileText,
  LayoutDashboard,
  List,
  Plus,
  Salad,
  UtensilsCrossed,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { fetchAllergen, fetchCategories, fetchCompleteMenu, fetchSidedish } from "@/_services/ada/adaMenuService";
import { useRouter } from "@/navigation";

interface StatsData {
  categories: number;
  menuItems: number;
  allergens: number;
  sideDishes: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData>({
    categories: 0,
    menuItems: 0,
    allergens: 0,
    sideDishes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [categories, menu, allergens, sidedishes] = await Promise.allSettled([
          fetchCategories(),
          fetchCompleteMenu(),
          fetchAllergen(),
          fetchSidedish(),
        ]);

        setStats({
          categories:
            categories.status === "fulfilled" && Array.isArray(categories.value) ? categories.value.length : 0,
          menuItems:
            menu.status === "fulfilled" && Array.isArray(menu.value)
              ? menu.value.reduce((count: number, cat: any) => count + (cat.menuItems?.length || 0), 0)
              : 0,
          allergens: allergens.status === "fulfilled" && Array.isArray(allergens.value) ? allergens.value.length : 0,
          sideDishes:
            sidedishes.status === "fulfilled" && Array.isArray(sidedishes.value) ? sidedishes.value.length : 0,
        });
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#33373B] dark:text-white">Welcome to ADA Menu</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your restaurant menu with ease</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <button
            key={stat.label}
            onClick={() => router.push(stat.href)}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 text-left hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              {stat.icon}
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-bold text-[#33373B] dark:text-white">{stat.value}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-[#8B98FF] transition-colors">
              View all <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#33373B] dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md text-left ${
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
        <h2 className="text-lg font-semibold text-[#33373B] dark:text-white mb-4">Recent Activity</h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-8 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Activity tracking coming soon. Your recent changes will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
