import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { MenuItem } from "../types/menu";

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

export function MenuItemModal({ item, onClose }: Props) {
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
              ₦{item.rate.toLocaleString()}
            </p>

            <div className="mt-6 p-3 bg-muted rounded-lg">
              <p className="text-xs font-condensed font-semibold uppercase tracking-wide text-muted-foreground">
                Category
              </p>
              <p className="text-sm font-medium text-foreground mt-1">{item.category}</p>
            </div>

            <button
              disabled
              className="w-full mt-6 bg-muted text-muted-foreground font-condensed font-bold uppercase tracking-wider py-3 rounded-lg cursor-not-allowed opacity-70"
            >
              Add to Cart — Coming Soon
            </button>
            <p className="text-xs text-center text-muted-foreground mt-2 font-condensed">
              Online ordering will be available in the next update
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}