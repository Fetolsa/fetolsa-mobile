import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, Package } from "lucide-react";
import { useCart } from "../context/CartContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ open, onClose, onCheckout }: Props) {
  const { items, updateQty, removeItem, subtotal, requiredPackCounts, takeawayPacks } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ backgroundColor: "#ffffff" }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm shadow-2xl flex flex-col"
          >
            <div
              style={{ borderColor: "#ebe6dd" }}
              className="flex items-center justify-between px-4 h-[52px] border-b shrink-0"
            >
              <h2
                style={{ color: "#1a1a1a", letterSpacing: "0.06em" }}
                className="font-display text-xl uppercase"
              >
                Your Cart
              </h2>
              <button
                onClick={onClose}
                style={{ color: "#1a1a1a" }}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {items.length === 0 && (
                <p className="text-muted-foreground text-center py-12 font-condensed">
                  Your cart is empty
                </p>
              )}
              {items.map((item) => {
                const isAuto = Boolean(item.auto_added);
                let minQty = 1;
                if (isAuto) {
                  const matchedKind = (Object.keys(takeawayPacks) as Array<keyof typeof takeawayPacks>).find(
                    (k) => takeawayPacks[k]?.item_code === item.item_code,
                  );
                  minQty = matchedKind ? (requiredPackCounts[matchedKind as keyof typeof requiredPackCounts] || 1) : 1;
                }
                const canDecrease = item.qty > minQty;

                return (
                  <div
                    key={item.item_code}
                    style={{ backgroundColor: "#ffffff", borderColor: isAuto ? "#1a1a1a" : "#ebe6dd" }}
                    className="rounded-xl p-3 flex items-center gap-3 border"
                  >
                    {isAuto && (
                      <div
                        style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      >
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p
                          style={{ color: "#1a1a1a" }}
                          className="font-condensed font-bold text-[14px] uppercase tracking-wide leading-tight truncate"
                        >
                          {item.item_name}
                        </p>
                        {isAuto && (
                          <span
                            style={{ backgroundColor: "#fdecee", color: "#E60019", letterSpacing: "0.08em" }}
                            className="font-condensed text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                          >
                            Required
                          </span>
                        )}
                      </div>
                      <p
                        style={{ color: "#E60019" }}
                        className="font-condensed font-bold text-sm mt-0.5"
                      >
                        &#8358;{(item.rate * item.qty).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.item_code, item.qty - 1)}
                        disabled={!canDecrease}
                        style={{ color: "#1a1a1a" }}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-30"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span
                        style={{ color: "#1a1a1a" }}
                        className="font-condensed font-bold text-sm w-5 text-center"
                      >
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.item_code, item.qty + 1)}
                        style={{ color: "#1a1a1a" }}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {!isAuto && (
                        <button
                          onClick={() => removeItem(item.item_code)}
                          style={{ color: "#E60019" }}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors ml-0.5"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {items.length > 0 && (
              <div
                style={{ borderColor: "#ebe6dd" }}
                className="border-t px-4 pt-3.5 pb-5 space-y-3 shrink-0"
              >
                <div className="flex justify-between items-baseline">
                  <span
                    style={{ color: "#1a1a1a", letterSpacing: "0.06em" }}
                    className="font-condensed text-sm font-bold uppercase"
                  >
                    Subtotal
                  </span>
                  <span
                    style={{ color: "#1a1a1a" }}
                    className="font-condensed font-bold text-lg"
                  >
                    &#8358;{subtotal.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={onCheckout}
                  style={{ backgroundColor: "#E60019", color: "#ffffff", letterSpacing: "0.06em" }}
                  className="w-full font-condensed font-bold uppercase text-sm py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
