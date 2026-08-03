import type { OrderStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Cypherpunk status chip — beige tile, bold 2px black border, square dot in
 * a semantic color. All chips share one hard, technical look.
 */
const MAP: Record<OrderStatus, { label: string; dot: string }> = {
  pending_payment: {
    label: "Awaiting payment",
    dot: "bg-sun-500",
  },
  paid: {
    label: "Paid",
    dot: "bg-blue-500",
  },
  delivered: {
    label: "Delivered",
    dot: "bg-emerald-500",
  },
  failed: {
    label: "Failed",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-ink-400",
  },
};

export function StatusChip({ status }: { status: OrderStatus }) {
  const s = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border-2 border-ink-950 bg-surface px-2.5 py-1 text-xs font-bold text-ink-950 shadow-hard-sm",
      )}
    >
      <span className={cn("size-1.5", s.dot)} />
      {s.label}
    </span>
  );
}
