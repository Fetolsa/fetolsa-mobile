import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Search, MapPin, Check, RotateCcw } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useBranch } from "../context/BranchContext";
import { useCustomer } from "../context/CustomerContext";
import { calculateDeliveryFee, placeOrder } from "../lib/order-api";
import { tenant } from "../tenant.generated";

interface Props {
  open: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string, paymentUrl: string) => void;
}

const DELIVERY_TIERS = [
  { label: "0\u20133km", fee: "\u20A64,500" },
  { label: "3\u20137km", fee: "\u20A65,500" },
  { label: "7\u201312km", fee: "\u20A67,500" },
  { label: "12\u201320km", fee: "\u20A615,000" },
  { label: "20km+", fee: "\u20A620,500" },
];
const DEFAULT_FEE = 20500;

type OrderType = "delivery" | "pickup";

export function CheckoutModal({ open, onClose, onOrderPlaced }: Props) {
  const { items, subtotal } = useCart();
  const { branch } = useBranch();
  const { info, saveInfo, setSaveInfo, persist } = useCustomer();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("delivery");

  const [deliveryFee, setDeliveryFee] = useState<number>(DEFAULT_FEE);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeInfo, setFeeInfo] = useState<{
    distance_km: number | null;
    duration: string;
    formatted_address: string;
  } | null>(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from saved info on open
  useEffect(() => {
    if (open) {
      setName(info.name || "");
      setPhone(info.phone || "");
      setEmail(info.email || "");
      setAddress(info.address || "");
      setNotes("");
      setOrderType("delivery");
      setError("");
      setAddressConfirmed(false);
      setConfirmedAddress("");
      setFeeInfo(null);
      setDeliveryFee(DEFAULT_FEE);
    }
  }, [open, info]);

  const searchAddress = useCallback(
    async (addr?: string) => {
      const query = (addr ?? address).trim();
      if (!query || !branch) return;
      setFeeLoading(true);
      setFeeInfo(null);
      setAddressConfirmed(false);
      try {
        const result = await calculateDeliveryFee(query, branch);
        if (result?.status === "ok" && result.distance_km !== null) {
          setDeliveryFee(result.fee);
          setFeeInfo({
            distance_km: result.distance_km,
            duration: result.duration,
            formatted_address: result.formatted_address,
          });
        } else {
          setDeliveryFee(DEFAULT_FEE);
          setFeeInfo(null);
        }
      } catch {
        setDeliveryFee(DEFAULT_FEE);
        setFeeInfo(null);
      } finally {
        setFeeLoading(false);
      }
    },
    [address, branch],
  );

  const confirmAddress = () => {
    if (feeInfo?.formatted_address) {
      setConfirmedAddress(feeInfo.formatted_address);
      setAddressConfirmed(true);
    }
  };

  const resetAddress = () => {
    setAddressConfirmed(false);
    setConfirmedAddress("");
    setFeeInfo(null);
    setDeliveryFee(DEFAULT_FEE);
    setAddress("");
  };

  const onAddressChange = (v: string) => {
    setAddress(v);
    if (addressConfirmed) {
      setAddressConfirmed(false);
      setConfirmedAddress("");
      setDeliveryFee(DEFAULT_FEE);
      setFeeInfo(null);
    }
  };

  const effectiveFee = orderType === "pickup" ? 0 : deliveryFee;
  const total = items.length > 0 ? subtotal + effectiveFee : 0;

  const handleSubmit = async () => {
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number");
      return;
    }
    if (orderType === "delivery" && (!addressConfirmed || !confirmedAddress)) {
      setError("Please search and confirm your delivery address");
      return;
    }
    if (!branch) {
      setError("Please select a branch first");
      return;
    }
    if (items.length === 0) {
      setError("Cart is empty");
      return;
    }

    setSubmitLoading(true);
    try {
      const result = await placeOrder({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim() || undefined,
        delivery_address: orderType === "pickup" ? "Pickup" : confirmedAddress,
        delivery_notes: notes.trim() || undefined,
        branch,
        items,
        delivery_fee: orderType === "pickup" ? 0 : deliveryFee,
        order_type: orderType === "pickup" ? "Pickup" : "Delivery",
      });

      if (result?.status === "ok" && result.payment_url) {
        const orderId = result.order_id || result.name || "";

        // Persist customer info if toggle is on
        persist({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: orderType === "delivery" ? confirmedAddress : info.address,
        });

        // Save active order id for header pill
        try {
          localStorage.setItem("vc_active_order", orderId);
          localStorage.setItem("vc_active_order_id", orderId);
          localStorage.setItem("vc_last_order_id", orderId);
        } catch {
          // ignore
        }

        onClose();
        onOrderPlaced(orderId, result.payment_url);
      } else {
        setError(result?.error || result?.message || "Could not place order. Try again.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!open) return null;

  const inputClass =
    "w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card rounded-xl w-full max-w-md p-6 relative shadow-lg max-h-[90vh] overflow-y-auto border border-primary/20"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="font-display text-2xl tracking-wider text-primary mb-4">CHECKOUT</h2>

          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setOrderType("delivery")}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                orderType === "delivery"
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Deliver to me
            </button>
            <button
              type="button"
              onClick={() => setOrderType("pickup")}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                orderType === "pickup"
                  ? "bg-secondary border-secondary text-secondary-foreground"
                  : "border-border text-muted-foreground hover:border-secondary/50"
              }`}
            >
              Pickup (Free)
            </button>
          </div>

          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name *"
              className={inputClass}
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number *"
              type="tel"
              className={inputClass}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              type="email"
              className={inputClass}
            />

            {orderType === "pickup" ? (
              <div className="bg-muted rounded-xl p-4 text-sm border border-primary/20">
                <p className="font-semibold text-foreground mb-1">Pickup Location</p>
                <p className="text-foreground">Village Chief Restaurant</p>
                <p className="text-muted-foreground">{tenant.contact?.address || ""}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  No delivery fee &middot; Show your confirmation code on arrival
                </p>
              </div>
            ) : !addressConfirmed ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={address}
                    onChange={(e) => onAddressChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchAddress()}
                    placeholder="Delivery Address *"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => searchAddress()}
                    disabled={feeLoading || !address.trim()}
                    className="shrink-0 bg-primary text-primary-foreground rounded-lg px-3 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center"
                    aria-label="Search address"
                  >
                    {feeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {feeInfo && !feeLoading && (
                  <div className="bg-muted rounded-lg p-3 space-y-2 border border-primary/20">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground">{feeInfo.formatted_address}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {feeInfo.distance_km}km &middot; ~{feeInfo.duration} &middot; &#8358;
                      {deliveryFee.toLocaleString()} delivery
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={confirmAddress}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg py-2 hover:opacity-90 transition-opacity"
                      >
                        <Check className="w-3.5 h-3.5" /> Yes, deliver here
                      </button>
                      <button
                        type="button"
                        onClick={resetAddress}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-muted text-muted-foreground text-sm font-medium rounded-lg py-2 border border-primary/20 hover:bg-primary/10 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Search again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-3 border border-primary/30 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{confirmedAddress}</span>
                  </div>
                  <button
                    type="button"
                    onClick={resetAddress}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>
                <div className="text-xs text-muted-foreground ml-6">
                  {feeInfo?.distance_km}km &middot; ~{feeInfo?.duration} &middot; &#8358;
                  {deliveryFee.toLocaleString()}
                </div>
              </div>
            )}

            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Order notes (optional)"
              className={inputClass}
            />

            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              Save my info for next time
            </label>
          </div>

          <div className="mt-5 bg-muted rounded-lg p-3 space-y-1 text-sm">
            {items.map((i) => (
              <div key={i.item_code} className="flex justify-between text-foreground">
                <span>
                  {i.item_name} &times;{i.qty}
                </span>
                <span>&#8358;{(i.rate * i.qty).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-primary/20 pt-1 mt-1 flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-foreground">&#8358;{subtotal.toLocaleString()}</span>
            </div>
            {orderType === "delivery" && (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span className="text-foreground">
                  {addressConfirmed
                    ? `\u20A6${deliveryFee.toLocaleString()}`
                    : `\u20A6${DEFAULT_FEE.toLocaleString()} (estimate)`}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-primary">
              <span>Total</span>
              <span>&#8358;{total.toLocaleString()}</span>
            </div>
          </div>

          {orderType === "delivery" && (
            <details className="mt-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer">Delivery fee tiers</summary>
              <div className="mt-2 space-y-1">
                {DELIVERY_TIERS.map((t) => (
                  <div key={t.label} className="flex justify-between">
                    <span>{t.label}</span>
                    <span className="font-medium text-foreground">{t.fee}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {error && <p className="text-destructive text-sm mt-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={
              submitLoading ||
              (orderType === "delivery" && (feeLoading || !addressConfirmed))
            }
            className="w-full mt-4 bg-secondary text-secondary-foreground font-condensed font-bold uppercase tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Pay with Paystack
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

