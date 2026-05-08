import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import type { MenuItem } from "../types/menu";
import { useCart } from "../context/CartContext";
import { tenant } from "../tenant.generated";
import { placeholderColor, placeholderInitial, resolveImageUrl } from "../lib/placeholder";

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
      category: item.category,
    });
    onClose();
  };

  const imageUrl = item ? resolveImageUrl(item.image, tenant.apiBaseUrl) : null;
  const initial = item ? placeholderInitial(item.item_name) : "";
  const placeholderBg = item ? placeholderColor(item.item_name) : "#f3efe8";
  const showDescription =
    item &&
    item.description &&
    item.description.trim() !== "" &&
    item.description.trim().toLowerCase() !== item.item_name.trim().toLowerCase();

  return (
    <AnimatePresence>
      {item && (
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
            style={{ backgroundColor: "#ffffff" }}
            className="w-full max-w-md sm:rounded-2xl rounded-t-3xl relative shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ backgroundColor: imageUrl ? "#1a1a1a" : placeholderBg }}
              className="relative w-full h-[220px] shrink-0 flex items-center justify-center overflow-hidden"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={item.item_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span
                  style={{ color: "#1a1a1a", letterSpacing: "0.04em" }}
                  className="font-display text-[120px] leading-none opacity-90"
                >
                  {initial}
                </span>
              )}

              <button
                onClick={onClose}
                aria-label="Close"
                style={{ backgroundColor: "rgba(255,255,255,0.95)", color: "#1a1a1a" }}
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <h2
                  style={{ color: "#1a1a1a", letterSpacing: "0.04em" }}
                  className="font-display text-[26px] uppercase leading-tight flex-1"
                >
                  {item.item_name}
                </h2>
                <p
                  style={{ color: "#E60019" }}
                  className="font-condensed font-bold text-xl shrink-0 whitespace-nowrap"
                >
                  &#8358;{item.rate.toLocaleString()}
                </p>
              </div>

              {showDescription && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-5">
                <span
                  style={{ color: "#1a1a1a", letterSpacing: "0.06em" }}
                  className="font-condensed text-sm font-bold uppercase"
                >
                  Quantity
                </span>
                <div
                  style={{ backgroundColor: "#1a1a1a" }}
                  className="flex items-center gap-1 rounded-full p-1"
                >
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Decrease quantity"
                    style={{ color: "#ffffff" }}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-40"
                    disabled={qty <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span
                    style={{ color: "#ffffff" }}
                    className="w-8 text-center font-condensed font-bold text-base"
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    aria-label="Increase quantity"
                    style={{ color: "#ffffff" }}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label
                  style={{ color: "#888", letterSpacing: "0.06em" }}
                  className="font-condensed text-[11px] font-semibold uppercase block mb-1.5"
                >
                  Special instructions (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. less pepper, extra plantain..."
                  autoCapitalize="sentences"
                  style={{ backgroundColor: "#f3efe8", color: "#1a1a1a", borderColor: "#ebe6dd" }}
                  className="w-full p-3 rounded-xl border text-sm resize-none h-[72px] focus:outline-none focus:ring-2 focus:ring-[#E60019]/30 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div
              style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
              className="border-t px-5 pt-3 pb-5 shrink-0"
            >
              <button
                onClick={handleAdd}
                style={{ backgroundColor: "#E60019", color: "#ffffff", letterSpacing: "0.06em" }}
                className="w-full font-condensed font-bold uppercase text-sm py-4 rounded-2xl active:scale-[0.98] transition-transform"
              >
                Add to cart &middot; &#8358;{(item.rate * qty).toLocaleString()}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
