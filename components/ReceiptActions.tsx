"use client";

import { useState } from "react";
import type { ReceiptEntry } from "@/lib/receipt-journal";

/**
 * Download / share actions for a delivered receipt.
 *
 * The receipt card is captured as a crisp 2× PNG (html-to-image clones the
 * live DOM node, so it renders exactly what's on screen, theme included),
 * then either downloaded directly, embedded in an A4 PDF (jspdf), or handed
 * to the native share sheet — on phones that means WhatsApp, X, email, etc.
 *
 * Both libraries are heavy (~450 KB combined), so they're loaded lazily
 * inside the click handlers instead of shipping with the page.
 */
export function ReceiptActions({
  receiptId,
  entry,
}: {
  /** id of the DOM node holding the receipt card to capture */
  receiptId: string;
  entry: ReceiptEntry;
}) {
  const [busy, setBusy] = useState<"png" | "pdf" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const slug = entry.id.replace(/[^\w-]/g, "") || "receipt";
  const date = new Date(entry.createdAt);
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
  const fileName = `afritop-${slug}-${day}`;

  /** Render the receipt card into a PNG blob (theme-aware paper background). */
  async function captureBlob(): Promise<Blob> {
    const node = document.getElementById(receiptId);
    if (!node) throw new Error("Receipt not found on this page.");
    const dark = document.documentElement.classList.contains("dark");
    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(node, {
      pixelRatio: 2,
      // The glass card is translucent — give it a solid paper backdrop so the
      // exported image is clean, matching the user's current theme.
      backgroundColor: dark ? "#0b0b0c" : "#e6ed0a",
      cacheBust: true,
      // Fonts are already painted in the live DOM; re-embedding them adds
      // network work and a failure mode for zero visible gain.
      skipFonts: true,
    });
    if (!blob) throw new Error("capture failed");
    return blob;
  }

  function triggerDownload(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function downloadPng(): Promise<void> {
    setBusy("png");
    setError(null);
    setNote(null);
    try {
      triggerDownload(await captureBlob(), `${fileName}.png`);
      setNote("PNG saved — check your Downloads folder.");
    } catch {
      setError("Couldn't generate the image. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf(): Promise<void> {
    setBusy("pdf");
    setError(null);
    setNote(null);
    try {
      const blob = await captureBlob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(blob);
      });
      const img = new Image();
      img.src = dataUrl;
      await img.decode();

      const { jsPDF } = await import("jspdf");
      const orientation: "portrait" | "landscape" =
        img.width > img.height ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const scale = Math.min(pw / img.width, ph / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      pdf.addImage(dataUrl, "PNG", (pw - w) / 2, (ph - h) / 2, w, h);
      pdf.save(`${fileName}.pdf`);
      setNote("PDF saved — check your Downloads folder.");
    } catch {
      setError("Couldn't build the PDF. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function share(): Promise<void> {
    setBusy("share");
    setError(null);
    setNote(null);
    let blob: Blob | null = null;
    try {
      blob = await captureBlob();
      const file = new File([blob], `${fileName}.png`, { type: "image/png" });
      const summary = `My Afritop ${entry.service} receipt (${entry.providerShort} · ${entry.amountLocal} ${entry.currency}) — ${entry.id}`;

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Afritop receipt",
          text: summary,
        });
        return;
      }
      if (typeof navigator.share === "function") {
        // Desktop fallback: share the summary text instead of a file.
        await navigator.share({ title: "Afritop receipt", text: summary });
        return;
      }
      // No share support at all — download the image so it can be shared manually.
      triggerDownload(blob, `${fileName}.png`);
      setNote("Sharing isn't supported here, so I downloaded the image — share it from your gallery.");
    } catch (err) {
      // User dismissing the sheet is not an error. Any other failure (e.g. the
      // browser rejecting the call because the capture took too long) falls
      // back to a download instead of showing a scary error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (blob) {
        triggerDownload(blob, `${fileName}.png`);
        setNote("Couldn't open the share sheet, so I downloaded the image instead.");
      } else {
        setError("Couldn't share the receipt. Please try again.");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 border-2 border-ink-950 bg-surface p-5 shadow-hard-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-500">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5M12 15V3" />
            </svg>
            Keep or share your receipt
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Download it as an image or PDF, or share it straight to WhatsApp, X and more.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void downloadPng()}
            className="inline-flex items-center gap-2 border-2 border-ink-950 bg-night px-4 py-2.5 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "png" ? <Spinner /> : <ImageIcon />}
            Download PNG
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void downloadPdf()}
            className="inline-flex items-center gap-2 border-2 border-ink-950 bg-paper px-4 py-2.5 text-xs font-bold text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "pdf" ? <Spinner /> : <PdfIcon />}
            Download PDF
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void share()}
            className="inline-flex items-center gap-2 border-2 border-ink-950 bg-brand-50 px-4 py-2.5 text-xs font-bold text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "share" ? <Spinner /> : <ShareIcon />}
            Share
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 border-2 border-ink-950 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-500/15 dark:text-red-400">
          {error}
        </p>
      )}
      {note && (
        <p aria-live="polite" className="mt-4 border-2 border-ink-950 bg-brand-50 px-3 py-2 text-xs font-bold text-ink-950">
          {note}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 15h6M9 11h2" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
