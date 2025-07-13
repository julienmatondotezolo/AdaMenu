import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <div className="relative group">
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-base text-gray-900 dark:text-white transition-all duration-300 ease-in-out shadow-sm hover:shadow-md focus:shadow-lg",
        "focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20",
        "placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900 dark:file:text-white",
        "hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-700/50",
        className,
      )}
      ref={ref}
      {...props}
    />

    {/* Focus ring animation */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />

    {/* Subtle inner shadow for depth */}
    <div className="absolute inset-0 rounded-2xl shadow-inner opacity-0 group-focus-within:opacity-20 transition-opacity duration-300 pointer-events-none" />
  </div>
));

Input.displayName = "Input";

export { Input };
