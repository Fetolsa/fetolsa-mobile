import { motion } from "framer-motion";
import type { MenuItem } from "../types/menu";

interface Props {
  item: MenuItem;
  index: number;
  onSelect: (item: MenuItem) => void;
}

export function MenuItemCard({ item, index, onSelect }: Props) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onSelect(item)}
      className="text-left bg-card rounded-xl p-4 border border-primary/15 hover:border-primary/40 transition-all"
    >
      <h3 className="font-condensed font-bold uppercase tracking-wide text-foreground text-[15px] sm:text-base">
        {item.item_name}
      </h3>
      {item.description && item.description !== item.item_name && (
        <p className="text-muted-foreground text-[14px] sm:text-sm mt-1 line-clamp-2">
          {item.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-3">
        <span className="price-badge text-[14px] sm:text-sm">
          ₦{item.rate.toLocaleString()}
        </span>
        <span className="text-[13px] sm:text-xs text-muted-foreground font-condensed font-semibold uppercase tracking-wide">
          View
        </span>
      </div>
    </motion.button>
  );
}