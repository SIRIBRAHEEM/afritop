import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI-style BorderBeam — a slowly rotating conic-gradient light that
 * traces the edge of a card. Pure CSS, GPU-friendly, reduced-motion safe.
 */
export function BorderBeam({
  className,
  size = 220,
  duration = 9,
  colorFrom = "#e2a532",
  colorTo = "#446f48",
}: {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)}
    >
      <div
        className="absolute left-1/2 top-1/2 animate-border-beam"
        style={
          {
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${duration}s`,
            background: `conic-gradient(from 0deg, transparent 0 340deg, ${colorFrom} 355deg, ${colorTo} 360deg)`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
