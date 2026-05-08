import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, Search, MapPin, Check, RotateCcw,
  Truck, Store, User, Phone, Mail, ChevronDown, ChevronUp,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useBranch } from "../context/BranchContext";
import { useCustomer } from "../context/CustomerContext";
import { calculateDeliveryFee, placeOrder } from "../lib/order-api";
import { pickPickupBranch, type PickupBranch } from "../lib/pickup-api";
import { updateLastAddress } from "../lib/auth-api";
import { tenant } from "../tenant.generated";

interface Props {
  open: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string, paymentUrl: string) => void;
}

const DELIVERY_TIERS = [
  { label: "0-3km", fee: "\u20A64,500" },
  { label: "3-7km", fee: "\u20A65,500" },
  { label: "7-12km", fee: "\u20A67,500" },
  { label: "12-20km", fee: "\u20A615,000" },
  { label: "20km+", fee: "\u20A620,500" },
];
const DEFAULT_FEE = 20500;
const PAYMENT_CALLBACK_URL = "https://www.villagechiefrestaurant.com/#/paystack-return";

type OrderType = "delivery" | "pickup";

const inputBase: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderColor: "#ebe6dd",
  color: "#1a1a1a",
};

const labelStyle: React.CSSProperties = {
  color: "#888",
  letterSpacing: "0.06em",
};

export function CheckoutModal({ open, onClose, onOrderPlaced }: Props) {
  const { items, subtotal } = useCart();
  const { branch } = useBranch();
  const { info, saveInfo, setSaveInfo, persist, effectiveInfo, token, isLoggedIn } = useCustomer();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [notesOpen, setNotesOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState<number>(DEFAULT_FEE);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeInfo, setFeeInfo] = useState<{
    distance_km: number | null;
    duration: string;
    formatted_address: string;
    customer_lat: number | null;
    customer_lng: number | null;
    routing_branch: string | null;
  } | null>(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState("");

  const [pickupBranch, setPickupBranch] = useState<(PickupBranch & { distance_km: number }) | null>(null);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupOutOfRange, setPickupOutOfRange] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(effectiveInfo.name || "");
      setPhone(effectiveInfo.phone || "");
      setEmail(effectiveInfo.email || "");
      setAddress(effectiveInfo.address || "");
      setNotes("");
      setOrderType("delivery");
      setError("");
      setAddressConfirmed(false);
      setConfirmedAddress("");
      setFeeInfo(null);
      setDeliveryFee(DEFAULT_FEE);
      setPickupBranch(null);
      setPickupOutOfRange(false);
      setNotesOpen(false);
      setSummaryOpen(false);
    }
  }, [open, effectiveInfo]);

  useEffect(() => {
    if (orderType !== "pickup") return;
    if (!feeInfo?.customer_lat || !feeInfo?.customer_lng) return;
    if (!addressConfirmed) return;

    let cancelled = false;
    setPickupLoading(true);
    setPickupOutOfRange(false);
    pickPickupBranch(feeInfo.customer_lat, feeInfo.customer_lng)
      .then((res) => {
        if (cancelled) return;
        if (res.status === "ok" && res.branch) {
          setPickupBranch(res.branch);
        } else if (res.status === "out_of_range") {
          setPickupBranch(null);
          setPickupOutOfRange(true);
        } else {
          setPickupBranch(null);
        }
      })
      .catch(() => {
        if (!cancelled) setPickupBranch(null);
      })
      .finally(() => {
        if (!cancelled) setPickupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderType, addressConfirmed, feeInfo?.customer_lat, feeInfo?.customer_lng]);

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
            customer_lat: result.customer_lat,
            customer_lng: result.customer_lng,
            routing_branch: result.routing_branch || null,
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
    setPickupBranch(null);
    setPickupOutOfRange(false);
  };

  const onAddressChange = (v: string) => {
    setAddress(v);
    if (addressConfirmed) {
      setAddressConfirmed(false);
      setConfirmedAddress("");
      setDeliveryFee(DEFAULT_FEE);
      setFeeInfo(null);
      setPickupBranch(null);
      setPickupOutOfRange(false);
    }
  };

  const effectiveFee = orderType === "pickup" ? 0 : deliveryFee;
  const total = items.length > 0 ? subtotal + effectiveFee : 0;

  const orderBranch =
    orderType === "pickup" && pickupBranch
      ? pickupBranch.name
      : feeInfo?.routing_branch || branch;

  const fallbackBranchName = branch || "selected branch";
  const fallbackBranchAddress =
    (branch && tenant.branchAddresses?.[branch]) ||
    tenant.contact?.address ||
    "Address not configured";
  const pickupCardName = pickupBranch ? pickupBranch.name : fallbackBranchName;
  const pickupCardAddress = pickupBranch ? pickupBranch.address : fallbackBranchAddress;

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
    if (!orderBranch) {
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
        branch: orderBranch,
        items,
        delivery_fee: orderType === "pickup" ? 0 : deliveryFee,
        order_type: orderType === "pickup" ? "Pickup" : "Delivery",
        payment_callback_url: PAYMENT_CALLBACK_URL,
      });

      if (result?.status === "ok" && result.payment_url) {
        const orderId = result.order_id || result.name || "";

        persist({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: orderType === "delivery" ? confirmedAddress : info.address,
        });

        if (isLoggedIn && token && orderType === "delivery" && confirmedAddress) {
          updateLastAddress(token, confirmedAddress).catch(() => {});
        }

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          style={{ backgroundColor: "#faf7f2" }}
          className="w-full max-w-md sm:rounded-2xl rounded-t-3xl relative shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
            className="px-5 pt-5 pb-4 relative shrink-0"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff" }}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <p
              style={{ color: "#E60019", letterSpacing: "0.1em" }}
              className="font-condensed text-[11px] font-bold uppercase"
            >
              Almost there
            </p>
            <h2
              style={{ letterSpacing: "0.04em" }}
              className="font-display text-[26px] uppercase leading-tight mt-1"
            >
              Checkout
            </h2>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            {/* Order type segmented */}
            <div
              style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
              className="flex gap-1 p-1 rounded-2xl border"
            >
              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                style={{
                  backgroundColor: orderType === "delivery" ? "#E60019" : "transparent",
                  color: orderType === "delivery" ? "#ffffff" : "#1a1a1a",
                  letterSpacing: "0.06em",
                }}
                className="flex-1 py-2.5 rounded-xl font-condensed font-bold text-sm uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <Truck className="w-4 h-4" />
                Delivery
              </button>
              <button
                type="button"
                onClick={() => setOrderType("pickup")}
                style={{
                  backgroundColor: orderType === "pickup" ? "#1a1a1a" : "transparent",
                  color: orderType === "pickup" ? "#ffffff" : "#1a1a1a",
                  letterSpacing: "0.06em",
                }}
                className="flex-1 py-2.5 rounded-xl font-condensed font-bold text-sm uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <Store className="w-4 h-4" />
                Pickup &middot; Free
              </button>
            </div>

            {/* Section: Your details */}
            <section className="space-y-2.5">
              <h3
                style={labelStyle}
                className="font-condensed text-[11px] font-bold uppercase"
              >
                Your details
              </h3>

              <div className="relative">
                <User style={{ color: "#888" }} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoCapitalize="words"
                  autoComplete="name"
                  style={inputBase}
                  className="w-full pl-9 pr-3 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E60019]/30 placeholder:text-muted-foreground"
                />
              </div>

              <div className="relative">
                <Phone style={{ color: "#888" }} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                  placeholder="Phone number"
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9+]*"
                  enterKeyHint="next"
                  autoComplete="tel"
                  style={inputBase}
                  className="w-full pl-9 pr-3 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E60019]/30 placeholder:text-muted-foreground"
                />
              </div>

              <div className="relative">
                <Mail style={{ color: "#888" }} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional)"
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={inputBase}
                  className="w-full pl-9 pr-3 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E60019]/30 placeholder:text-muted-foreground"
                />
              </div>
            </section>

            {/* Section: Where */}
            <section className="space-y-2.5">
              <h3
                style={labelStyle}
                className="font-condensed text-[11px] font-bold uppercase"
              >
                {orderType === "pickup" ? "Pickup location" : "Delivery address"}
              </h3>

              {orderType === "pickup" ? (
                <div
                  style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
                  className="rounded-xl p-3.5 border"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      style={{ backgroundColor: "#fdecee", color: "#E60019" }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    >
                      <Store className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        style={{ color: "#1a1a1a", letterSpacing: "0.04em" }}
                        className="font-condensed font-bold text-sm uppercase flex items-center gap-2"
                      >
                        {pickupCardName}
                        {pickupLoading && <Loader2 className="w-3.5 h-3.5 animate-spin opacity-70" />}
                      </p>
                      <p style={{ color: "#1a1a1a" }} className="text-sm mt-0.5">
                        {tenant.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pickupCardAddress}
                      </p>
                      {pickupBranch && (
                        <p style={{ color: "#E60019" }} className="text-xs mt-1.5 font-medium">
                          {pickupBranch.distance_km}km from your address &middot; closest branch
                        </p>
                      )}
                      {pickupOutOfRange && (
                        <p className="text-xs text-destructive mt-1.5">
                          No branch within range. Please choose delivery, or pick up from {fallbackBranchName}.
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        No delivery fee &middot; Show your code on arrival
                      </p>
                    </div>
                  </div>
                </div>
              ) : !addressConfirmed ? (
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin style={{ color: "#888" }} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                      <input
                        value={address}
                        onChange={(e) => onAddressChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchAddress()}
                        placeholder="Enter your address"
                        autoCapitalize="words"
                        autoComplete="street-address"
                        style={inputBase}
                        className="w-full pl-9 pr-3 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#E60019]/30 placeholder:text-muted-foreground"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => searchAddress()}
                      disabled={feeLoading || !address.trim()}
                      style={{ backgroundColor: "#E60019", color: "#ffffff" }}
                      className="shrink-0 rounded-xl px-3.5 py-3 disabled:opacity-50 flex items-center"
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
                    <div
                      style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
                      className="rounded-xl p-3 border space-y-2.5"
                    >
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin style={{ color: "#E60019" }} className="w-4 h-4 shrink-0 mt-0.5" />
                        <span style={{ color: "#1a1a1a" }}>{feeInfo.formatted_address}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {feeInfo.distance_km}km &middot; ~{feeInfo.duration} &middot; &#8358;
                        {deliveryFee.toLocaleString()} delivery
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={confirmAddress}
                          style={{ backgroundColor: "#E60019", color: "#ffffff", letterSpacing: "0.06em" }}
                          className="flex-1 flex items-center justify-center gap-1.5 font-condensed font-bold uppercase text-xs py-2.5 rounded-xl"
                        >
                          <Check className="w-3.5 h-3.5" /> Deliver here
                        </button>
                        <button
                          type="button"
                          onClick={resetAddress}
                          style={{ backgroundColor: "#f3efe8", color: "#1a1a1a", letterSpacing: "0.06em" }}
                          className="flex-1 flex items-center justify-center gap-1.5 font-condensed font-bold uppercase text-xs py-2.5 rounded-xl"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{ backgroundColor: "#ffffff", borderColor: "#E60019" }}
                  className="rounded-xl p-3 border-2 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin style={{ color: "#E60019" }} className="w-4 h-4 shrink-0 mt-0.5" />
                      <span style={{ color: "#1a1a1a" }}>{confirmedAddress}</span>
                    </div>
                    <button
                      type="button"
                      onClick={resetAddress}
                      style={{ color: "#E60019", letterSpacing: "0.06em" }}
                      className="font-condensed text-[11px] font-bold uppercase shrink-0 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    {feeInfo?.distance_km}km &middot; ~{feeInfo?.duration} &middot; &#8358;
                    {deliveryFee.toLocaleString()}
                  </div>
                  {feeInfo?.routing_branch && (
                    <div className="text-xs text-muted-foreground ml-6">
                      Delivering from {feeInfo.routing_branch}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Section: Notes (collapsible) */}
            <section>
              {!notesOpen && !notes ? (
                <button
                  type="button"
                  onClick={() => setNotesOpen(true)}
                  style={{ color: "#E60019", letterSpacing: "0.06em" }}
                  className="font-condensed text-xs font-bold uppercase hover:underline"
                >
                  + Add a note for the kitchen
                </button>
              ) : (
                <div className="space-y-2">
                  <h3
                    style={labelStyle}
                    className="font-condensed text-[11px] font-bold uppercase"
                  >
                    Order notes
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. less pepper, deliver to security gate..."
                    autoCapitalize="sentences"
                    style={inputBase}
                    className="w-full p-3 rounded-xl border text-sm resize-none h-[64px] focus:outline-none focus:ring-2 focus:ring-[#E60019]/30 placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </section>

            {/* Save info */}
            <label
              style={{ color: "#1a1a1a" }}
              className="flex items-center gap-2 text-sm cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                style={{ accentColor: "#E60019" }}
                className="w-4 h-4"
              />
              Save my info for next time
            </label>

            {/* Order summary (collapsible) */}
            <section
              style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
              className="rounded-xl border overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setSummaryOpen(!summaryOpen)}
                className="w-full px-3.5 py-3 flex items-center justify-between"
              >
                <span
                  style={{ color: "#1a1a1a", letterSpacing: "0.06em" }}
                  className="font-condensed text-sm font-bold uppercase"
                >
                  Order summary &middot; {items.reduce((s, i) => s + i.qty, 0)} item{items.length === 1 ? "" : "s"}
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
                  className="border-t px-3.5 py-3 space-y-1 text-sm"
                >
                  {items.map((i) => (
                    <div key={i.item_code} className="flex justify-between" style={{ color: "#1a1a1a" }}>
                      <span className="truncate pr-2">
                        {i.item_name} <span className="text-muted-foreground">x{i.qty}</span>
                      </span>
                      <span className="shrink-0">&#8358;{(i.rate * i.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div
                style={{ borderColor: "#ebe6dd" }}
                className="border-t px-3.5 py-3 space-y-1 text-sm"
              >
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span style={{ color: "#1a1a1a" }}>&#8358;{subtotal.toLocaleString()}</span>
                </div>
                {orderType === "delivery" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span style={{ color: "#1a1a1a" }}>
                      {addressConfirmed
                        ? `\u20A6${deliveryFee.toLocaleString()}`
                        : `\u20A6${DEFAULT_FEE.toLocaleString()} (estimate)`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span style={{ color: "#1a1a1a" }}>Total</span>
                  <span style={{ color: "#E60019" }}>&#8358;{total.toLocaleString()}</span>
                </div>
              </div>
            </section>

            {orderType === "delivery" && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Delivery fee tiers</summary>
                <div className="mt-2 space-y-1">
                  {DELIVERY_TIERS.map((t) => (
                    <div key={t.label} className="flex justify-between">
                      <span>{t.label}</span>
                      <span style={{ color: "#1a1a1a" }} className="font-medium">{t.fee}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {error && (
              <div
                style={{ backgroundColor: "#fdecee", color: "#E60019" }}
                className="rounded-xl px-3.5 py-2.5 text-sm"
              >
                {error}
              </div>
            )}
          </div>

          {/* Sticky footer CTA */}
          <div
            style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
            className="border-t px-4 pt-3 pb-5 shrink-0"
          >
            <button
              onClick={handleSubmit}
              disabled={
                submitLoading ||
                (orderType === "delivery" && (feeLoading || !addressConfirmed))
              }
              style={{ backgroundColor: "#E60019", color: "#ffffff", letterSpacing: "0.06em" }}
              className="w-full font-condensed font-bold uppercase text-sm py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Pay &#8358;{total.toLocaleString()} with Paystack
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
