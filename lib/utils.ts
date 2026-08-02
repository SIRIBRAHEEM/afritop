export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Generate a short, human-friendly id like "AT-K2F9MZ". */
export function uid(prefix: string): string {
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Normalize a phone number to international format for a given country. */
export function normalizePhone(prefix: string, digits: string): string {
  const clean = digits.replace(/\D/g, "");
  return `${prefix}${clean}`;
}

export function isValidPhone(prefix: string, digits: string, expectedDigits: number): boolean {
  const clean = digits.replace(/\D/g, "");
  return clean.length === expectedDigits && /^[0-9]+$/.test(clean);
}

export function isValidMeter(digits: string): boolean {
  const clean = digits.replace(/\D/g, "");
  return clean.length >= 6 && clean.length <= 20;
}

/** Shorten an Ethereum-style address for display: 0x1234…abcd */
export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}
