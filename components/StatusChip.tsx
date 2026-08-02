import type { OrderStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

const MAP: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  pending_payment: {
    label: "Awaiting payment",
    cls: "bg-sun-100 text-sun-800",
    dot: "bg-sun-500",
  },
  paid: {
    label: "Paid",
    cls: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  delivered: {
    label: "Delivered",
    cls: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  failed: {
    label: "Failed",
    cls: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-ink-100 text-ink-500",
    dot: "bg-ink-400",
  },
};

export function StatusChip({ status }: { status: OrderStatus }) {
  const s = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        s.cls,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
