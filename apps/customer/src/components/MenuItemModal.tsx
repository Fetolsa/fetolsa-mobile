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
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={{ backgroundColor: "#ffffff" }}
            className="rounded-2xl w-full max-w-md p-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="flex items-start justify-between gap-4 pr-6">
              <h2
                style={{ color: "#1a1a1a" }}
                className="font-condensed font-bold text-xl uppercase tracking-wide leading-tight flex-1"
              >
                {item.item_name}
              </h2>
              <p
                style={{ color: "#1a1a1a" }}
                className="font-condensed font-bold text-lg shrink-0"
              >
                &#8358;{item.rate.toLocaleString()}
              </p>
            </div>

            {item.description &&
              item.description.trim().toLowerCase() !==
                item.item_name.trim().toLowerCase() && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {item.description}
                </p>
              )}

            <div className="flex items-center justify-between mt-6">
              <span
                style={{ color: "#1a1a1a" }}
                className="text-sm font-condensed font-semibold uppercase tracking-wide"
              >
                Quantity
              </span>
              <div
                style={{ backgroundColor: "#f3efe8" }}
                className="flex items-center gap-3 rounded-lg p-1"
              >
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{ color: "#1a1a1a" }}
                  className="p-1.5 hover:bg-white rounded-md transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span
                  style={{ color: "#1a1a1a" }}
                  className="w-8 text-center font-bold"
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  style={{ color: "#1a1a1a" }}
                  className="p-1.5 hover:bg-white rounded-md transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions (optional)"
              style={{ backgroundColor: "#f3efe8", color: "#1a1a1a" }}
              className="w-full mt-4 p-3 rounded-lg text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />

            <button
              onClick={handleAdd}
              style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
              className="w-full mt-5 font-condensed font-bold uppercase tracking-wider py-3.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Add to Cart &mdash; &#8358;{(item.rate * qty).toLocaleString()}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}