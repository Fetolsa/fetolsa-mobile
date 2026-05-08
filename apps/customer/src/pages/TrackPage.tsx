import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Phone, Loader2, ChefHat, Package,
  Truck, CheckCircle2, XCircle, Store, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  getOrderStatus, statusToStep, formatNaira,
  type OrderStatusResult, type OrderStatusStep,
} from "../lib/order-api";
import { tenant } from "../tenant.generated";

interface StepDef {
  key: OrderStatusStep;
  label: string;
  shortLabel: string;
  index: number;
}

const STEPS: StepDef[] = [
  { key: "confirmed",       label: "Order Confirmed",  shortLabel: "Confirmed",  index: 1 },
  { key: "preparing",       label: "Preparing",        shortLabel: "Preparing",  index: 2 },
  { key: "rider_assigned",  label: "Rider Assigned",   shortLabel: "Rider",      index: 3 },
  { key: "picked_up",       label: "On the Way",       shortLabel: "On the way", index: 4 },
  { key: "delivered",       label: "Delivered",        shortLabel: "Delivered",  index: 5 },
];

const PICKUP_STEPS: StepDef[] = [
  { key: "confirmed",       label: "Order Confirmed",  shortLabel: "Confirmed",  index: 1 },
  { key: "preparing",       label: "Preparing",        shortLabel: "Preparing",  index: 2 },
  { key: "rider_assigned",  label: "Ready for Pickup", shortLabel: "Ready",      index: 3 },
  { key: "picked_up",       label: "Collected",        shortLabel: "Collected",  index: 4 },
  { key: "delivered",       label: "Completed",        shortLabel: "Done",       index: 5 },
];

interface HeroState {
  bg: string;
  fg: string;
  eyebrow: string;
  title: string;
  subline: string;
  Icon: typeof ChefHat;
  iconBg: string;
}

function getHeroState(
  step: OrderStatusStep,
  isPickup: boolean,
  isCancelled: boolean,
): HeroState {
  if (isCancelled) {
    return {
      bg: "#1a1a1a", fg: "#ffffff",
      eyebrow: "Order cancelled",
      title: "Cancelled",
      subline: "Your order is no longer active",
      Icon: XCircle, iconBg: "rgba(230,0,25,0.2)",
    };
  }
  switch (step) {
    case "confirmed":
      return {
        bg: "#1a1a1a", fg: "#ffffff",
        eyebrow: "Confirmed",
        title: "Order received",
        subline: "We'll start preparing soon",
        Icon: CheckCircle2, iconBg: "rgba(255,255,255,0.15)",
      };
    case "preparing":
      return {
        bg: "#1a1a1a", fg: "#ffffff",
        eyebrow: "Preparing",
        title: "Cooking now",
        subline: "Estimated 15-25 min",
        Icon: ChefHat, iconBg: "rgba(255,255,255,0.15)",
      };
    case "rider_assigned":
      return {
        bg: "#E60019", fg: "#ffffff",
        eyebrow: isPickup ? "Ready for pickup" : "Rider assigned",
        title: isPickup ? "Ready to collect" : "Rider on the way to pickup",
        subline: isPickup ? "Head to the branch" : "Out for delivery soon",
        Icon: isPickup ? Store : Package, iconBg: "rgba(255,255,255,0.2)",
      };
    case "picked_up":
      return {
        bg: "#E60019", fg: "#ffffff",
        eyebrow: isPickup ? "Collected" : "Out for delivery",
        title: isPickup ? "Order collected" : "Almost there",
        subline: isPickup ? "Enjoy your meal" : "Arriving soon",
        Icon: isPickup ? CheckCircle2 : Truck, iconBg: "rgba(255,255,255,0.2)",
      };
    case "delivered":
      return {
        bg: "#1a1a1a", fg: "#ffffff",
        eyebrow: isPickup ? "Completed" : "Delivered",
        title: "Enjoy!",
        subline: "Thanks for ordering",
        Icon: CheckCircle2, iconBg: "rgba(230,0,25,0.25)",
      };
    default:
      return {
        bg: "#1a1a1a", fg: "#ffffff",
        eyebrow: "Pending",
        title: "Awaiting confirmation",
        subline: "Just a moment",
        Icon: Loader2, iconBg: "rgba(255,255,255,0.15)",
      };
  }
}

export default function TrackPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderStatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

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
          timer = setTimeout(poll, 10000);
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
      <div style={{ backgroundColor: "#faf7f2" }} className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No order specified</p>
      </div>
    );
  }

  if (!order && !error) {
    return (
      <div style={{ backgroundColor: "#faf7f2" }} className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 style={{ color: "#E60019" }} className="w-8 h-8 animate-spin mb-3" />
        <p className="text-muted-foreground font-condensed">Loading order...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div style={{ backgroundColor: "#faf7f2" }} className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-destructive font-medium mb-3">{error}</p>
        <button
          onClick={() => navigate("/")}
          style={{ backgroundColor: "#1a1a1a", color: "#ffffff", letterSpacing: "0.06em" }}
          className="px-4 py-2.5 rounded-xl font-condensed font-bold uppercase text-sm"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  const isPickupOrder = (order!.order_type || "").toLowerCase() === "pickup";
  const stepsForOrder = isPickupOrder ? PICKUP_STEPS : STEPS;
  const currentStep = statusToStep(order!.status || order!.order_status);
  const currentIndex = stepsForOrder.find((s) => s.key === currentStep)?.index ?? 1;
  const isCancelled = currentStep === "cancelled";
  const hero = getHeroState(currentStep, isPickupOrder, isCancelled);
  const progressPct = Math.min(100, (currentIndex / stepsForOrder.length) * 100);

  const branchName =
    order!.delivery_address && isPickupOrder
      ? "Pickup branch"
      : "Delivery";
  const branchAddress = isPickupOrder
    ? tenant.contact?.address
    : order!.delivery_address;

  const itemsCount = (order!.items || []).reduce((s, i) => s + (i.qty || 0), 0);

  return (
    <div style={{ backgroundColor: "#faf7f2" }} className="min-h-screen pb-8">
      {/* Top bar */}
      <header
        style={{ backgroundColor: "#faf7f2", borderColor: "#ebe6dd" }}
        className="sticky top-0 z-30 border-b"
      >
        <div className="container max-w-md mx-auto flex items-center gap-2 h-[52px] px-3.5">
          <button
            onClick={() => navigate("/")}
            aria-label="Back"
            style={{ color: "#1a1a1a" }}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p
              style={{ color: "#888", letterSpacing: "0.06em" }}
              className="font-condensed text-[10px] uppercase leading-tight"
            >
              Order
            </p>
            <p
              style={{ color: "#1a1a1a" }}
              className="font-condensed font-bold text-sm leading-tight truncate"
            >
              {orderId}
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-3.5 py-4 space-y-3">
        {/* Hero status card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ backgroundColor: hero.bg, color: hero.fg }}
          className="rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="flex items-center gap-3.5">
            <div
              style={{ backgroundColor: hero.iconBg }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            >
              <hero.Icon
                className={`w-7 h-7 ${currentStep === "preparing" || currentStep === "pending" ? "animate-pulse" : ""}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                style={{ letterSpacing: "0.1em", opacity: 0.85 }}
                className="font-condensed text-[11px] font-bold uppercase"
              >
                {hero.eyebrow}
              </p>
              <h1
                style={{ letterSpacing: "0.04em" }}
                className="font-display text-[24px] uppercase leading-tight mt-0.5"
              >
                {hero.title}
              </h1>
              <p
                style={{ opacity: 0.8 }}
                className="font-condensed text-xs mt-0.5"
              >
                {hero.subline}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress tracker (segmented horizontal) */}
        {!isCancelled && (
          <div
            style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
            className="rounded-2xl border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span
                style={{ color: "#1a1a1a", letterSpacing: "0.06em" }}
                className="font-condensed text-[11px] font-bold uppercase"
              >
                Progress
              </span>
              <span
                style={{ color: "#888" }}
                className="font-condensed text-[11px]"
              >
                Step {currentIndex} of {stepsForOrder.length}
              </span>
            </div>

            {/* Segmented bar */}
            <div className="flex gap-1">
              {stepsForOrder.map((step) => {
                const filled = step.index <= currentIndex;
                return (
                  <div
                    key={step.key}
                    style={{
                      backgroundColor: filled ? "#E60019" : "#ebe6dd",
                    }}
                    className="flex-1 h-1.5 rounded-full transition-colors"
                  />
                );
              })}
            </div>

            {/* Step labels */}
            <div className="flex justify-between gap-1">
              {stepsForOrder.map((step) => {
                const isActive = step.index === currentIndex;
                const isDone = step.index < currentIndex;
                return (
                  <span
                    key={step.key}
                    style={{
                      color: isActive ? "#E60019" : isDone ? "#1a1a1a" : "#888",
                      letterSpacing: "0.04em",
                    }}
                    className={`flex-1 text-center font-condensed text-[10px] uppercase leading-tight ${isActive ? "font-bold" : ""}`}
                  >
                    {step.shortLabel}
                  </span>
                );
              })}
            </div>

            <div style={{ display: "none" }}>{progressPct}</div>
          </div>
        )}

        {/* Rider card (delivery only, when assigned/in-transit) */}
        {!isPickupOrder && (currentStep === "rider_assigned" || currentStep === "picked_up") && order!.rider_name && (
          <div
            style={{ backgroundColor: "#ffffff", borderColor: "#E60019" }}
            className="rounded-2xl border-2 p-4"
          >
            <p
              style={{ color: "#888", letterSpacing: "0.06em" }}
              className="font-condensed text-[11px] font-bold uppercase mb-2"
            >
              Your rider
            </p>
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: "#fdecee", color: "#E60019" }}
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              >
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  style={{ color: "#1a1a1a" }}
                  className="font-condensed font-bold text-base leading-tight truncate"
                >
                  {order!.rider_name}
                </p>
                <p
                  style={{ color: "#888" }}
                  className="text-xs mt-0.5"
                >
                  Delivering your order
                </p>
              </div>
              {order!.rider_phone && (
                
                  <a
                  href={`tel:${order!.rider_phone}`}
                  style={{ backgroundColor: "#E60019", color: "#ffffff", letterSpacing: "0.06em" }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-condensed font-bold uppercase text-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </a>
              )}
            </div>
          </div>
        )}

        {/* Where card */}
        <div
          style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
          className="rounded-2xl border p-4"
        >
          <p
            style={{ color: "#888", letterSpacing: "0.06em" }}
            className="font-condensed text-[11px] font-bold uppercase mb-2"
          >
            {isPickupOrder ? "Pickup from" : "Deliver to"}
          </p>
          <div className="flex items-start gap-3">
            <div
              style={{ backgroundColor: "#fdecee", color: "#E60019" }}
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            >
              {isPickupOrder ? <Store className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p
                style={{ color: "#1a1a1a" }}
                className="font-condensed font-bold text-sm uppercase leading-tight"
              >
                {branchName}
              </p>
              <p
                style={{ color: "#1a1a1a" }}
                className="text-sm mt-0.5 break-words"
              >
                {branchAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Order summary card (collapsible) */}
        <div
          style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
          className="rounded-2xl border overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setSummaryOpen(!summaryOpen)}
            className="w-full px-4 py-3 flex items-center justify-between"
          >
            <span
              style={{ color: "#1a1a1a", letterSpacing: "0.06em" }}
              className="font-condensed text-sm font-bold uppercase"
            >
              Order summary &middot; {itemsCount} item{itemsCount === 1 ? "" : "s"}
            </span>
            {summaryOpen ? (
              <ChevronUp style={{ color: "#1a1a1a" }} className="w-4 h-4" />
            ) : (
              <ChevronDown style={{ color: "#1a1a1a" }} className="w-4 h-4" />
            )}
          </button>
          {summaryOpen && (
            <div
              style={{ borderColor: "#ebe6dd" }}
              className="border-t px-4 py-3 space-y-1 text-sm"
            >
              {order!.items?.map((item) => (
                <div key={item.item_code} className="flex justify-between" style={{ color: "#1a1a1a" }}>
                  <span className="truncate pr-2">
                    <span className="text-muted-foreground">x{item.qty}</span> {item.item_name}
                  </span>
                  <span className="shrink-0">{formatNaira(item.rate * item.qty)}</span>
                </div>
              ))}
            </div>
          )}
          <div
            style={{ borderColor: "#ebe6dd" }}
            className="border-t px-4 py-3 space-y-1 text-sm"
          >
            {order!.subtotal !== undefined && (
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span style={{ color: "#1a1a1a" }}>{formatNaira(order!.subtotal)}</span>
              </div>
            )}
            {order!.delivery_fee !== undefined && order!.delivery_fee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span style={{ color: "#1a1a1a" }}>{formatNaira(order!.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span style={{ color: "#1a1a1a" }}>Total</span>
              <span style={{ color: "#E60019" }}>{formatNaira(order!.total)}</span>
            </div>
          </div>
        </div>

        {/* Bottom action */}
        <button
          onClick={() => navigate("/")}
          style={{ backgroundColor: "#ffffff", color: "#1a1a1a", borderColor: "#ebe6dd", letterSpacing: "0.06em" }}
          className="w-full font-condensed font-bold uppercase text-sm py-3.5 rounded-2xl border active:scale-[0.98] transition-transform mt-2"
        >
          Back to menu
        </button>
      </main>
    </div>
  );
}
