"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Aceternity-style SpotlightCard — a soft radial glow that follows the
 * cursor across the card. Uses CSS custom properties, no animation lib.
 */
export function SpotlightCard({
  className,
  children,
  spotlightColor = "rgba(226,165,50,0.14)",
  ...props
}: React.ComponentProps<"div"> & { spotlightColor?: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const onMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
    el.style.setProperty("--spot-color", spotlightColor);
  }, [spotlightColor]);

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={cn("group/spotlight relative", className)}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        style={{
          background:
            "radial-gradient(240px circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--spot-color, rgba(226,165,50,0.14)), transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
