"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-base font-semibold leading-relaxed text-gray-700 dark:text-gray-300 transition-colors duration-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), "mb-2 block", className)} {...props} />
));

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
