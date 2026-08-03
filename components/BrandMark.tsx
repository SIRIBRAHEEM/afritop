"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Official brand mark with a graceful fallback.
 *
 * Renders the brand's logo image inside a clean white circular badge; if the
 * image fails to load (offline, blocked CDN, retired URL) it falls back to the
 * brand-colored initial avatar — so the UI never shows a broken image.
 */
export function BrandMark({
  logo,
  name,
  short,
  color,
  size = 28,
  className,
}: {
  logo?: string;
  name: string;
  short: string;
  color: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (logo && !failed) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden border-2 border-ink-950 bg-white",
          className,
        )}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-contain p-1"
        />
      </span>
    );
  }

  return (
    <span
      className={cn("grid shrink-0 place-items-center font-extrabold text-ink-950", className)}
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.36 }}
    >
      {short.charAt(0)}
    </span>
  );
}
