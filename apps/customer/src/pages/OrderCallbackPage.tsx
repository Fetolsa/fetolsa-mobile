import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getOrderStatus, formatNaira } from "../lib/order-api";
import { useCart } from "../context/CartContext";

export default function OrderCallbackPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clear } = useCart();

  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState<boolean | null>(null);
  const [total, setTotal] = useState<number>(0);

  // Paystack passes ?status=success or ?status=cancelled (or no param if direct)
  const urlStatus = searchParams.get("status");

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 5;

    const poll = async () => {
      attempts++;
      try {
        const order = await getOrderStatus(orderId);
        if (cancelled) return;
        setTotal(order.total || 0);
        const isPaid = (order.payment_status || "").toLowerCase() === "paid";
        if (isPaid) {
          setPaid(true);
          setLoading(false);
          clear();
          return;
        }
        if (attempts >= maxAttempts) {
          // Paystack webhook may not have hit yet; show pending state
          setPaid(urlStatus === "cancelled" ? false : null);
          setLoading(false);
          return;
        }
        setTimeout(poll, 2000);
      } catch (e) {
        if (cancelled) return;
        if (attempts >= maxAttempts) {
          setPaid(false);
          setLoading(false);
          return;
        }
        setTimeout(poll, 2000);
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [orderId, urlStatus, clear]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="font-condensed text-muted-foreground">Confirming your payment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="bg-card rounded-xl border border-primary/20 p-6 max-w-md w-full text-center"
      >
        {paid === true ? (
          <>
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="font-display text-3xl tracking-wider text-primary mb-2">
              ORDER CONFIRMED
            </h1>
            <p className="text-muted-foreground text-sm mb-1">Order #{orderId}</p>
            <p className="text-2xl font-bold text-foreground mb-6">{formatNaira(total)}</p>
            <p className="text-muted-foreground text-sm mb-6">
              We've received your payment. Your order is being prepared.
            </p>
            <button
              onClick={() => navigate(`/track/${orderId}`)}
              className="w-full bg-secondary text-secondary-foreground font-condensed font-bold uppercase tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Track Order
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full mt-2 text-muted-foreground text-sm hover:text-foreground transition-colors py-2"
            >
              Back to Menu
            </button>
          </>
        ) : paid === false ? (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-3xl tracking-wider text-destructive mb-2">
              PAYMENT FAILED
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Your payment was not completed. Your cart is still saved &mdash; you can try again.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-secondary text-secondary-foreground font-condensed font-bold uppercase tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Back to Menu
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="font-display text-2xl tracking-wider text-primary mb-2">
              PROCESSING
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              Order #{orderId} placed. We're waiting for payment confirmation from Paystack.
            </p>
            <button
              onClick={() => navigate(`/track/${orderId}`)}
              className="w-full bg-secondary text-secondary-foreground font-condensed font-bold uppercase tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Track Order
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}