import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ open, onClose, onCheckout }: Props) {
  const { items, updateQty, removeItem, subtotal } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-background shadow-xl flex flex-col border-l border-primary/20"
          >
            <div className="flex items-center justify-between p-4 border-b border-primary/20">
              <h2 className="font-display text-xl tracking-wider text-primary">YOUR CART</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 && (
                <p className="text-muted-foreground text-center py-12 font-condensed">
                  Your cart is empty
                </p>
              )}
              {items.map((item) => (
                <div
                  key={item.item_code}
                  className="bg-card rounded-lg p-3 flex items-center gap-3 border border-primary/10"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-condensed font-bold text-sm uppercase tracking-wide truncate text-foreground">
                      {item.item_name}
                    </p>
                    <p className="price-badge mt-1 inline-block">
                      &#8358;{(item.rate * item.qty).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.item_code, item.qty - 1)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center text-foreground">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.item_code, item.qty + 1)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button
                      onClick={() => removeItem(item.item_code)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors ml-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="border-t border-primary/20 p-4 space-y-3">
                <div className="flex justify-between font-bold text-base text-primary">
                  <span>Subtotal</span>
                  <span>&#8358;{subtotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={onCheckout}
                  className="w-full bg-secondary text-secondary-foreground font-condensed font-bold uppercase tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity"
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