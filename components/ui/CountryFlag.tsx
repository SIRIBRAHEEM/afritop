import type { Country } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Crisp raster country flag from FlagCDN (public-domain flag images served
 * from a free CDN) — renders everywhere, unlike emoji flags which break on
 * Windows Chrome. Add your own border via className (e.g. border-2
 * border-ink-950) to match the flat design.
 */
export function CountryFlag({ country, className }: { country: Country; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- plain <img>: fixed public CDN source, no optimizer needed
    <img
      src={country.flag}
      alt={`${country.name} flag`}
      width={160}
      height={120}
      loading="lazy"
      decoding="async"
      className={cn("object-cover", className)}
    />
  );
}
