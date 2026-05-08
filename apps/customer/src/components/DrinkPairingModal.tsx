import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import type { MenuItem } from "../types/menu";
import { useCart } from "../context/CartContext";
import { tenant } from "../tenant.generated";
import { placeholderColor, placeholderInitial, resolveImageUrl } from "../lib/placeholder";

interface Props {
  open: boolean;
  pairedDrinks: MenuItem[];
  onClose: () => void;
}

export function DrinkPairingModal({ open, pairedDrinks, onClose }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) setAdded({});
  }, [open]);

  const handleAddDrink = (drink: MenuItem) => {
    addItem({
      item_code: drink.item_code,
      item_name: drink.item_name,
      qty: 1,
      rate: drink.rate,
    });
    setAdded((prev) => ({
      ...prev,
      [drink.item_code]: (prev[drink.item_code] || 0) + 1,
    }));
  };

  const totalAdded = Object.values(added).reduce((sum, n) => sum + n, 0);
  const visible = open && pairedDrinks.length > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={{ backgroundColor: "#ffffff" }}
            className="w-full max-w-md sm:rounded-2xl rounded-t-3xl relative shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
              className="px-5 pt-5 pb-4 relative"
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
                Before you check out
              </p>
              <h2
                style={{ letterSpacing: "0.04em" }}
                className="font-display text-[24px] uppercase leading-tight mt-1 pr-10"
              >
                Add a drink to your order?
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-2 gap-2.5">
                {pairedDrinks.map((drink) => {
                  const count = added[drink.item_code] || 0;
                  const imageUrl = resolveImageUrl(drink.image, tenant.apiBaseUrl);
                  const initial = placeholderInitial(drink.item_name);
                  const placeholderBg = placeholderColor(drink.item_name);

                  return (
                    <div
                      key={drink.item_code}
                      style={{
                        backgroundColor: "#ffffff",
                        borderColor: count > 0 ? "#E60019" : "#ebe6dd",
                        borderWidth: count > 0 ? 2 : 1,
                      }}
                      className="rounded-2xl border overflow-hidden flex flex-col"
                    >
                      <div
                        style={{ backgroundColor: imageUrl ? "#1a1a1a" : placeholderBg }}
                        className="w-full aspect-[4/3] flex items-center justify-center relative"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={drink.item_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span
                            style={{ color: "#1a1a1a" }}
                            className="font-display text-[56px] leading-none opacity-90"
                          >
                            {initial}
                          </span>
                        )}
                        {count > 0 && (
                          <div
                            style={{ backgroundColor: "#E60019", color: "#ffffff" }}
                            className="absolute top-2 left-2 min-w-[26px] h-[26px] rounded-full flex items-center justify-center px-1.5 font-condensed font-bold text-xs"
                          >
                            {count}x
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 flex flex-col flex-1">
                        <p
                          style={{ color: "#1a1a1a", letterSpacing: "0.03em" }}
                          className="font-condensed font-bold text-[13px] uppercase leading-tight line-clamp-2"
                        >
                          {drink.item_name}
                        </p>
                        <p
                          style={{ color: "#E60019" }}
                          className="font-condensed font-bold text-sm mt-1"
                        >
                          &#8358;{drink.rate.toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleAddDrink(drink)}
                          style={{
                            backgroundColor: count > 0 ? "#E60019" : "#1a1a1a",
                            color: "#ffffff",
                            letterSpacing: "0.06em",
                          }}
                          className="mt-2 w-full font-condensed font-bold uppercase text-[11px] py-2 rounded-lg flex items-center justify-center gap-1 active:scale-[0.97] transition-transform"
                        >
                          {count > 0 ? (
                            <>
                              <Plus className="w-3 h-3" />
                              Add another
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
              className="border-t px-5 pt-3 pb-5 shrink-0 flex gap-2.5"
            >
              <button
                onClick={onClose}
                style={{ backgroundColor: "#f3efe8", color: "#1a1a1a", letterSpacing: "0.06em" }}
                className="flex-1 font-condensed font-bold uppercase text-sm py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
              >
                {totalAdded > 0 ? "Continue" : "No thanks"}
              </button>
              {totalAdded > 0 && (
                <button
                  onClick={onClose}
                  style={{ backgroundColor: "#E60019", color: "#ffffff", letterSpacing: "0.06em" }}
                  className="flex-1 font-condensed font-bold uppercase text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <Check className="w-4 h-4" />
                  Done &middot; {totalAdded}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
