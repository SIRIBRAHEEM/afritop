"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const WHATSAPP_URL =
  "https://wa.me/2348168969816?text=Hi%20Afritop!%20I%20have%20a%20question%20about%20my%20top-up.";

const STORE_KEY = "afritop-wa-pos";
const EDGE = 12; // min distance from viewport edges
const DRAG_THRESHOLD = 8; // px of movement before a touch counts as a drag

const GRADIENT = "linear-gradient(135deg, #3ce07b 0%, #25d366 48%, #0f9d5f 100%)";
const GLOW = "0 10px 28px -8px rgba(10,10,10,0.55), 0 0 20px -6px rgba(37,211,102,0.65)";
const GLOW_DRAG = "0 16px 38px -10px rgba(10,10,10,0.6), 0 0 30px -4px rgba(37,211,102,0.85)";

interface Pos {
  x: number;
  y: number;
}

// The FAB is size-12 on phones and size-14 from sm up; clamping must use the
// actual rendered size so the button can never be pushed off-screen.
function clamp(p: Pos, size: number): Pos {
  return {
    x: Math.min(Math.max(p.x, EDGE), Math.max(window.innerWidth - size - EDGE, EDGE)),
    y: Math.min(Math.max(p.y, EDGE), Math.max(window.innerHeight - size - EDGE, EDGE)),
  };
}

/**
 * Floating WhatsApp support button — now draggable anywhere on the page.
 * Position is remembered per device (localStorage) and clamped on resize.
 * Premium green-gradient FAB with a soft glow, inset highlight ring, gentle
 * availability ping and a hover label. Tap = open WhatsApp chat; drag = move.
 */
export function WhatsAppButton() {
  const [pos, setPos] = React.useState<Pos | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const btnRef = React.useRef<HTMLAnchorElement | null>(null);
  const sizeRef = React.useRef(56);
  const gesture = React.useRef<{
    moved: boolean;
    startX: number;
    startY: number;
    offX: number;
    offY: number;
    size: number;
  } | null>(null);
  // click fires AFTER pointerup (which clears the gesture), so suppression
  // must live in its own ref to outlive the pointer-up handler.
  const suppressClick = React.useRef(false);

  const readSize = () => {
    const el = btnRef.current;
    if (!el) return sizeRef.current;
    const w = el.getBoundingClientRect().width;
    if (w > 0) sizeRef.current = w;
    return sizeRef.current;
  };

  // Restore a saved position (deferred so SSR/hydration stay stable and no
  // setState runs synchronously inside the effect).
  React.useEffect(() => {
    let saved: Pos | null = null;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Pos;
        if (typeof p.x === "number" && typeof p.y === "number") saved = clamp(p, readSize());
      }
    } catch {
      /* private mode / corrupt value — keep the default corner */
    }
    const t = window.setTimeout(() => {
      if (saved) setPos(saved);
    }, 0);
    const onResize = () => setPos((prev) => (prev ? clamp(prev, readSize()) : prev));
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Size captured once here — re-reading the rect on every pointermove would
    // force a layout pass each frame and jank the drag on low-end phones.
    gesture.current = {
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
      size: rect.width,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const g = gesture.current;
    if (!g) return;
    if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > DRAG_THRESHOLD) {
      g.moved = true;
      setDragging(true);
    }
    if (g.moved) {
      setPos(clamp({ x: e.clientX - g.offX, y: e.clientY - g.offY }, g.size));
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const g = gesture.current;
    suppressClick.current = Boolean(g?.moved);
    if (g?.moved) {
      const rect = e.currentTarget.getBoundingClientRect();
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({ x: rect.left, y: rect.top }));
      } catch {
        /* private mode */
      }
    }
    gesture.current = null;
    setDragging(false);
  };

  return (
    <a
      ref={btnRef}
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      aria-label="Chat with Afritop support on WhatsApp"
      className={cn(
        "group fixed z-[60] grid size-12 select-none place-items-center rounded-full border-2 border-ink-950 touch-none sm:size-14",
        "transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none",
        dragging ? "cursor-grabbing scale-110" : "cursor-grab group-hover:-translate-y-0.5 group-hover:scale-105",
      )}
      style={
        pos
          ? { left: pos.x, top: pos.y, background: GRADIENT, boxShadow: dragging ? GLOW_DRAG : GLOW }
          : { bottom: 20, right: 20, background: GRADIENT, boxShadow: dragging ? GLOW_DRAG : GLOW }
      }
    >
      {/* Availability ping */}
      <span
        className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-white/25 motion-reduce:animate-none"
        aria-hidden="true"
      />
      {/* Inset highlight for a crisp, premium edge */}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" aria-hidden="true" />

      {/* Official WhatsApp glyph */}
      <svg
        viewBox="0 0 24 24"
        className="relative size-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] sm:size-7"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>

      {/* Hover label */}
      <span
        className={cn(
          "pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full border-2 border-ink-950 bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink-950 opacity-0 shadow-[0_8px_20px_-8px_rgba(10,10,10,0.5)] transition-opacity duration-200 group-hover:opacity-100 sm:block",
          dragging && "invisible",
        )}
      >
        Chat on WhatsApp
      </span>
    </a>
  );
}
