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
  MoreHorizontal,
  Plus,
  Salad,
  Settings,
  Sun,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import React, { useCallback, useEffect, useState } from "react";

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

/* ─── Mobile bottom nav tabs ─────────────────────────────────────────── */
const mobileMainTabs: NavItem[] = [
  { label: "Home", icon: <LayoutDashboard size={22} />, href: "/" },
  { label: "Menu", icon: <UtensilsCrossed size={22} />, href: "/categories" },
  // "Add" is handled specially as center tab
  { label: "Allergens", icon: <AlertTriangle size={22} />, href: "/allergens" },
  // "More" is handled specially
];

const mobileMoreItems: NavItem[] = [
  { label: "Menu Items", icon: <UtensilsCrossed size={20} />, href: "/items" },
  { label: "Side Dishes", icon: <Salad size={20} />, href: "/sidedish" },
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
  const [moreOpen, setMoreOpen] = useState(false);

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

  const handleMoreClose = useCallback(() => {
    setMoreOpen(false);
  }, []);

  // Close More sheet on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Desktop sidebar — hidden on mobile */}
      {/* ═══════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Mobile bottom navigation — hidden on desktop */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Home tab */}
          <MobileTabButton
            item={mobileMainTabs[0]}
            active={isActive(mobileMainTabs[0].href)}
            onClick={() => router.push(mobileMainTabs[0].href)}
          />

          {/* Menu tab */}
          <MobileTabButton
            item={mobileMainTabs[1]}
            active={isActive(mobileMainTabs[1].href)}
            onClick={() => router.push(mobileMainTabs[1].href)}
          />

          {/* Center Add button — elevated */}
          <button
            onClick={() => router.push("/categories")}
            className="flex items-center justify-center w-14 h-14 -mt-5 rounded-2xl bg-primary shadow-lg shadow-primary/30 text-white transition-transform active:scale-95"
            aria-label="Add item"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>

          {/* Allergens tab */}
          <MobileTabButton
            item={mobileMainTabs[2]}
            active={isActive(mobileMainTabs[2].href)}
            onClick={() => router.push(mobileMainTabs[2].href)}
          />

          {/* More tab */}
          <MobileTabButton
            item={{ label: "More", icon: <MoreHorizontal size={22} />, href: "" }}
            active={moreOpen}
            onClick={() => setMoreOpen(true)}
          />
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* "More" bottom sheet overlay — mobile only */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] overlay-fade-in"
            onClick={handleMoreClose}
          />

          {/* Sheet */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl sheet-slide-up safe-area-bottom">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-3">
              <h3 className="text-lg font-semibold text-[#33373B] dark:text-white">More</h3>
              <button
                onClick={handleMoreClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Navigation items */}
            <div className="px-4 pb-4 space-y-1">
              {mobileMoreItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      handleMoreClose();
                    }}
                    className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-all ${
                      active
                        ? "bg-primary/10 text-primary dark:text-[#8B98FF] font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className={active ? "text-primary dark:text-[#8B98FF]" : "text-gray-400"}>{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="mx-6 border-t border-gray-100 dark:border-gray-800" />

            {/* Settings section */}
            <div className="px-4 py-4 space-y-3">
              {/* Theme toggle */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <Sun size={20} className="text-gray-400" />
                  ) : (
                    <Moon size={20} className="text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    theme === "dark" ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      theme === "dark" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Language switcher */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Language</span>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        locale === lang.code
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {lang.flag} {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Extra bottom padding for safe area */}
            <div className="h-4" />
          </div>
        </>
      )}
    </>
  );
}

/* ─── Mobile Tab Button Component ────────────────────────────────────── */
function MobileTabButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] rounded-xl transition-colors no-select ${
        active ? "text-primary dark:text-[#8B98FF]" : "text-gray-400 dark:text-gray-500"
      }`}
    >
      <span className={`transition-transform ${active ? "scale-110" : ""}`}>{item.icon}</span>
      <span className={`text-[10px] font-medium ${active ? "text-primary dark:text-[#8B98FF]" : ""}`}>
        {item.label}
      </span>
    </button>
  );
}
