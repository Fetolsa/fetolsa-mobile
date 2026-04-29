import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import type { MenuItem } from "../types/menu";
import { useCart } from "../context/CartContext";

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

export function MenuItemModal({ item, onClose }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setQty(1);
      setNotes("");
    }
  }, [item]);

  const handleAdd = () => {
    if (!item) return;
    addItem({
      item_code: item.item_code,
      item_name: item.item_name,
      qty,
      rate: item.rate,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {item && (
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
            className="bg-card rounded-xl w-full max-w-md p-6 relative shadow-lg border border-primary/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <h2 className="font-condensed font-bold text-xl uppercase tracking-wide text-foreground pr-8">
              {item.item_name}
            </h2>
            {item.description && item.description !== item.item_name && (
              <p className="text-muted-foreground text-sm mt-2">{item.description}</p>
            )}
            <p className="price-badge inline-block mt-3">
              &#8358;{item.rate.toLocaleString()}
            </p>

            <div className="flex items-center gap-4 mt-6">
              <span className="text-sm font-condensed font-semibold uppercase tracking-wide text-muted-foreground">
                Quantity
              </span>
              <div className="flex items-center gap-3 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-1.5 hover:bg-background rounded-md transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4 text-primary" />
                </button>
                <span className="w-8 text-center font-semibold text-foreground">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="p-1.5 hover:bg-background rounded-md transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions (optional)"
              className="w-full mt-4 p-3 bg-muted rounded-lg text-sm text-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />

            <button
              onClick={handleAdd}
              className="w-full mt-4 bg-secondary text-secondary-foreground font-condensed font-bold uppercase tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Add to Cart &mdash; &#8358;{(item.rate * qty).toLocaleString()}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}