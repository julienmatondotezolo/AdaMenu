import { Plus } from "lucide-react";
import React from "react";

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FloatingActionButton({
  onClick,
  label = "Add",
  icon = <Plus className="w-5 h-5" />,
  variant = "primary",
  size = "md",
  className = "",
}: FloatingActionButtonProps) {
  const baseClasses =
    "group relative inline-flex items-center justify-center font-medium rounded-full shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-blue-500/25 hover:shadow-blue-500/40",
    secondary:
      "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 focus:ring-gray-500",
  };

  const sizeClasses = {
    sm: "h-10 px-4 text-sm",
    md: "h-12 px-6 text-base",
    lg: "h-14 px-8 text-lg",
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {/* Background animation */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon */}
      <span className="relative flex items-center space-x-2">
        <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
        {label && <span>{label}</span>}
      </span>

      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-30 bg-white transition-opacity duration-150" />
    </button>
  );
}
