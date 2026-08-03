"use client";

import { useSyncExternalStore } from "react";

export const THEME_KEY = "afritop-theme";

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function onStorage(e: StorageEvent): void {
  if (e.key === THEME_KEY || e.key === null) emit();
}

function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", onStorage);
  listeners.add(cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    listeners.delete(cb);
  };
}

/** The current theme is external state — the `dark` class on <html>. */
function getSnapshot(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function applyTheme(dark: boolean): void {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {
    // Private mode — ignore.
  }
  emit();
}

export function ThemeToggle({ className }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => applyTheme(!dark)}
      className={`grid size-10 place-items-center border-2 border-ink-950 text-ink-600 shadow-hard-sm transition-all hover:bg-ink-100 hover:text-ink-950 ${className ?? ""}`}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}
