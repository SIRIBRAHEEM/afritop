import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Magic UI-style Marquee — infinite scrolling row via pure CSS animation.
 * Pauses on hover, fades at the edges, safe with prefers-reduced-motion.
 */
export function Marquee({
  children,
  reverse = false,
  pauseOnHover = true,
  speed = 40,
  className,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  pauseOnHover?: boolean;
  speed?: number;
  className?: string;
}) {
  const content = (
    <div className="flex w-max shrink-0 items-center gap-10 pr-10">
      {children}
    </div>
  );

  return (
    <div
      className={cn(
        "group relative flex overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]",
        "motion-reduce:overflow-x-auto",
        className
      )}
    >
      <div
        className={cn(
          "flex w-max animate-marquee items-center",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
          "motion-reduce:animate-none"
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {content}
        <div aria-hidden="true">{content}</div>
      </div>
    </div>
  );
}
