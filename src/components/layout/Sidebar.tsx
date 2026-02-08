"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  LayoutDashboard,
  List,
  Moon,
  Salad,
  Sun,
  UtensilsCrossed,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";

import { usePathname, useRouter } from "@/navigation";

type Locale = "en" | "fr" | "nl";

const STORAGE_KEY = "ada-menu-language";
const SIDEBAR_KEY = "ada-sidebar-collapsed";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/" },
  { label: "Categories", icon: <List size={20} />, href: "/categories" },
  { label: "Menu Items", icon: <UtensilsCrossed size={20} />, href: "/items" },
  { label: "Side Dishes", icon: <Salad size={20} />, href: "/sidedish" },
  { label: "Allergens", icon: <AlertTriangle size={20} />, href: "/allergens" },
  { label: "Menu Maker", icon: <FileText size={20} />, href: "/menumaker" },
  { label: "Live Preview", icon: <Eye size={20} />, href: "/preview" },
];

const languages: { code: Locale; label: string; flag: string }[] = [
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "nl", label: "NL", flag: "🇳🇱" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(SIDEBAR_KEY);

    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;

    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  const changeLanguage = (language: Locale) => {
    localStorage.setItem(STORAGE_KEY, language);
    router.push(pathname, { locale: language });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${
          collapsed ? "w-[60px]" : "w-[240px]"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center h-14 border-b border-gray-200 dark:border-gray-800 ${collapsed ? "justify-center px-2" : "px-4"}`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-[#33373B] dark:text-white whitespace-nowrap">ADA Menu</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <button
                    onClick={() => router.push(item.href)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center w-full rounded-lg transition-all duration-150 ${
                      collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                    } ${
                      active
                        ? "bg-primary/10 text-primary dark:text-[#8B98FF] font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <span className={`flex-shrink-0 ${active ? "text-primary dark:text-[#8B98FF]" : ""}`}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section: Language, Theme, Collapse */}
        <div className="border-t border-gray-200 dark:border-gray-800 py-3 px-2 space-y-2">
          {/* Language switcher */}
          <div className={`flex ${collapsed ? "flex-col items-center gap-1" : "items-center gap-1 px-1"}`}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                title={lang.label}
                className={`rounded-md text-xs font-medium transition-all ${collapsed ? "p-1.5" : "px-2 py-1.5"} ${
                  locale === lang.code
                    ? "bg-primary text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {collapsed ? lang.flag : lang.label}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center w-full rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${
              collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
            }`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={toggleCollapse}
            className={`flex items-center w-full rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${
              collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
            }`}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.href);

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                  active ? "text-primary dark:text-[#8B98FF]" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {item.icon}
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
