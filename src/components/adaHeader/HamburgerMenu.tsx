import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useState } from "react";

import { LanguageSwitcher } from "./LanguageSwitcher";

interface HamburgerMenuProps {
  className?: string;
}

export function HamburgerMenu({ className }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className={`relative z-50 ${className}`}>
      <button onClick={toggleMenu} className="p-2 hover:bg-white/10 rounded-lg">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Slide-out menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-primary dark:bg-gray-900 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full text-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button onClick={toggleMenu} className="p-2 hover:bg-white/10 rounded-lg">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="space-y-6">
              {/* Language Selection */}
              <div>
                <h3 className="text-sm font-medium mb-2">Language</h3>
                <LanguageSwitcher />
              </div>

              {/* Dark Mode Toggle */}
              <div>
                <h3 className="text-sm font-medium mb-2">Theme</h3>
                <button
                  onClick={toggleTheme}
                  className="flex items-center space-x-2 w-full p-2 rounded-lg hover:bg-white/10"
                >
                  {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={toggleMenu} aria-hidden="true" />}
    </div>
  );
}
