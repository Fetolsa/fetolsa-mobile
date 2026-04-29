import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Loader2 } from "lucide-react";
import { getOrderStatus, statusToStep, formatNaira, type OrderStatusResult, type OrderStatusStep } from "../lib/order-api";

interface StepDef {
  key: OrderStatusStep;
  label: string;
  index: number;
}

const STEPS: StepDef[] = [
  { key: "confirmed", label: "Order Confirmed", index: 1 },
  { key: "preparing", label: "Preparing", index: 2 },
  { key: "rider_assigned", label: "Rider Assigned", index: 3 },
  { key: "picked_up", label: "Picked Up", index: 4 },
  { key: "delivered", label: "Delivered", index: 5 },
];

export default function TrackPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderStatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const result = await getOrderStatus(orderId);
        if (cancelled) return;
        setOrder(result);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load order");
      } finally {
        if (!cancelled) {
          timer = setTimeout(poll, 10000); // re-poll every 10s
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No order specified</p>
      </div>
    );
  }

  if (!order && !error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-muted-foreground font-condensed">Loading order...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <p className="text-destructive font-medium mb-3">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-condensed font-bold uppercase tracking-wide"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  const currentStep = statusToStep(order!.status || order!.order_status);
  const currentIndex = STEPS.find((s) => s.key === currentStep)?.index ?? 1;
  const isCancelled = currentStep === "cancelled";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-primary/20">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="font-display text-xl tracking-wider text-primary">ORDER TRACKING</h1>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-md mx-auto space-y-4">
        {(currentStep === "rider_assigned" || currentStep === "picked_up") && order!.rider_name ? (
          <div className="bg-card rounded-xl border border-primary/20 p-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-condensed text-muted-foreground uppercase">Rider</p>
              <p className="text-foreground font-semibold">{order!.rider_name}</p>
              {order!.rider_phone && (
                <a href={`tel:${order!.rider_phone}`} className="text-sm text-primary flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" /> {order!.rider_phone}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-primary/20 p-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <p className="text-muted-foreground text-sm font-condensed">Waiting for rider...</p>
          </div>
        )}

        <div className="bg-card rounded-xl border border-primary/20 p-5">
          <p className="text-xs font-condensed text-muted-foreground uppercase tracking-wide">Order ID</p>
          <p className="text-foreground font-bold text-lg mb-5">{orderId}</p>

          <div className="space-y-1">
            {STEPS.map((step, i) => {
              const isDone = step.index < currentIndex;
              const isActive = step.index === currentIndex;
              const isInactive = step.index > currentIndex;
              const isLast = i === STEPS.length - 1;

              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCancelled
                          ? "bg-destructive/20 text-destructive"
                          : isDone || isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? "\u2713" : step.index}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 h-8 ${
                          isDone ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <p
                      className={`font-condensed font-bold uppercase tracking-wide text-sm ${
                        isInactive ? "text-muted-foreground" : "text-foreground"
                      } ${isActive ? "text-primary" : ""}`}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {isCancelled && (
            <p className="mt-4 text-center text-destructive font-condensed text-sm">
              This order was cancelled
            </p>
          )}
        </div>

        <div className="bg-card rounded-xl border border-primary/20 p-5">
          <p className="text-xs font-condensed text-muted-foreground uppercase tracking-wide mb-3">
            Items
          </p>
          {order!.items?.map((item) => (
            <div key={item.item_code} className="flex justify-between text-sm py-1">
              <span className="text-foreground">
                x{item.qty} {item.item_name}
              </span>
              <span className="text-muted-foreground">{formatNaira(item.rate * item.qty)}</span>
            </div>
          ))}

          <div className="border-t border-primary/20 mt-3 pt-3 space-y-1 text-sm">
            {order!.subtotal !== undefined && (
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatNaira(order!.subtotal)}</span>
              </div>
            )}
            {order!.delivery_fee !== undefined && order!.delivery_fee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>{formatNaira(order!.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-primary pt-1">
              <span>Total</span>
              <span>{formatNaira(order!.total)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}