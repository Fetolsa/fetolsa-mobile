import { Repeat, ChevronRight } from "lucide-react";
import type { CustomerOrder } from "../lib/auth-api";
import { formatNaira } from "../lib/order-api";

interface Props {
  order: CustomerOrder;
  onReorder: (order: CustomerOrder) => void;
  onView: (orderId: string) => void;
}

function statusBadgeClass(status?: string): string {
  const s = (status || "").toLowerCase();
  if (s.includes("delivered")) return "bg-primary/15 text-primary";
  if (s.includes("cancel")) return "bg-destructive/15 text-destructive";
  if (s.includes("preparing") || s.includes("rider") || s.includes("picked"))
    return "bg-secondary/20 text-secondary-foreground";
  return "bg-muted text-muted-foreground";
}

export function OrderHistoryCard({ order, onReorder, onView }: Props) {
  const total = order.grand_total ?? order.total ?? 0;
  const itemCount = (order.items || []).reduce((s, i) => s + (i.qty || 0), 0);
  const dateLabel = order.order_date
    ? new Date(order.order_date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "";

  const canReorder = (order.items || []).length > 0;

  return (
    <div style={{ backgroundColor: "#faf7f2", borderColor: "#e8e4dc" }}
      className="rounded-xl border p-3.5 space-y-2.5">
      <button
        onClick={() => onView(order.name)}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="font-condensed font-bold text-sm uppercase tracking-wide text-foreground truncate">
            {order.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dateLabel}
            {itemCount > 0 ? ` \u00B7 ${itemCount} item${itemCount > 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-foreground">
            {formatNaira(total)}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>

      <div className="flex items-center justify-between gap-3">
        {order.status && (
          <span
            className={`px-2 py-1 rounded-full text-[11px] font-condensed font-semibold uppercase tracking-wide ${statusBadgeClass(order.status)}`}
          >
            {order.status}
          </span>
        )}
        {canReorder && (
          <button
            onClick={() => onReorder(order)}
            className="ml-auto flex items-center gap-1.5 text-primary text-sm font-condensed font-semibold uppercase tracking-wide hover:opacity-80 transition-opacity"
          >
            <Repeat className="w-3.5 h-3.5" /> Reorder
          </button>
        )}
      </div>
    </div>
  );
}