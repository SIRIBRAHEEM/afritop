import { Globe, Smartphone, Zap, type LucideIcon } from "lucide-react";
import type { ServiceId } from "@/lib/catalog";

const ICONS: Record<ServiceId, LucideIcon> = {
  airtime: Smartphone,
  data: Globe,
  electricity: Zap,
};

/**
 * Consistent line-icon for a service, matched to the flat design system.
 * Uses lucide-react (MIT) — same stroke family as the rest of the app.
 */
export function ServiceIcon({ id, className }: { id: ServiceId; className?: string }) {
  const Icon = ICONS[id];
  return <Icon className={className} aria-hidden="true" />;
}
