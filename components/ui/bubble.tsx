import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Slot } from "@/components/ui/slot";

function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-group"
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  );
}

const bubbleVariants = cva(
  "group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full border-2 border-ink-950 bg-surface shadow-hard-sm",
  {
    variants: {
      variant: {
        default:
          "*:data-[slot=bubble-content]:bg-night *:data-[slot=bubble-content]:text-[#d4ff3f] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-ink-800",
        secondary:
          "*:data-[slot=bubble-content]:bg-paper *:data-[slot=bubble-content]:text-ink-950 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--color-paper),var(--color-ink-950)_8%)]",
        muted:
          "*:data-[slot=bubble-content]:bg-ink-100/60",
        tinted:
          "*:data-[slot=bubble-content]:bg-brand-50 *:data-[slot=bubble-content]:text-ink-950",
        outline:
          "*:data-[slot=bubble-content]:border-2 *:data-[slot=bubble-content]:border-ink-950 *:data-[slot=bubble-content]:bg-surface",
        ghost:
          "border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0",
        destructive:
          "*:data-[slot=bubble-content]:bg-red-500/10 *:data-[slot=bubble-content]:text-red-600 dark:*:data-[slot=bubble-content]:bg-red-500/20 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-red-500/20 dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-red-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Bubble({
  variant = "default",
  align = "start",
  className,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof bubbleVariants> & {
    align?: "start" | "end";
  }) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(bubbleVariants({ variant }), className)}
      {...props}
    />
  );
}

function BubbleContent({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="bubble-content"
      className={cn(
        "w-fit max-w-full min-w-0 overflow-hidden border-2 border-ink-950 px-3.5 py-2.5 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:border-ink-950 [button,a]:focus-visible:ring-ink-950",
        className
      )}
      {...props}
    />
  );
}

const bubbleReactionsVariants = cva(
  "absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-ink-100 px-1.5 py-0.5 text-sm ring-3 ring-surface has-[button]:p-0",
  {
    variants: {
      side: {
        top: "top-0 -translate-y-3/4",
        bottom: "bottom-0 translate-y-3/4",
      },
      align: {
        start: "left-3",
        end: "right-3",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  }
);

function BubbleReactions({
  side = "bottom",
  align = "end",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "end";
  side?: "top" | "bottom";
}) {
  return (
    <div
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    />
  );
}

export { BubbleGroup, Bubble, BubbleContent, BubbleReactions };
