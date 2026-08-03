import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Slot } from "@/components/ui/slot";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border-2 border-ink-950 text-sm font-bold transition-all outline-none focus-visible:border-ink-800 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-night text-[#d4ff3f] shadow-hard-sm hover:bg-ink-800 hover:-translate-y-0.5 hover:shadow-hard",
        secondary: "bg-ink-100 text-ink-950 hover:bg-ink-200",
        ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-950",
        outline: "border-2 border-ink-950 bg-surface text-ink-950 hover:bg-ink-100 shadow-hard-sm",
        brand: "bg-night text-[#d4ff3f] shadow-hard-sm hover:bg-ink-800 hover:-translate-y-0.5 hover:shadow-hard",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-4 text-xs",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-xs": "size-7 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
