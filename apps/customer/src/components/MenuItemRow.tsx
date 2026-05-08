import { motion } from "framer-motion";
import type { MenuItem } from "../types/menu";
import { tenant } from "../tenant.generated";
import { placeholderColor, placeholderImage, placeholderInitial, resolveImageUrl } from "../lib/placeholder";

interface Props {
  item: MenuItem;
  index: number;
  onSelect: (item: MenuItem) => void;
}

export function MenuItemRow({ item, index, onSelect }: Props) {
  const imageUrl = resolveImageUrl(item.image, tenant.apiBaseUrl);
  const categoryImage = placeholderImage(item.item_name, item.category);
  const effectiveImage = imageUrl || categoryImage;
  const initial = placeholderInitial(item.item_name);
  const placeholderBg = placeholderColor(item.item_name);
  const showDescription =
    item.description &&
    item.description.trim() !== "" &&
    item.description.trim().toLowerCase() !== item.item_name.trim().toLowerCase();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(item)}
      style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
      className="w-full text-left rounded-xl border p-3 flex items-center gap-3 hover:shadow-sm transition-shadow"
    >
      {/* Image or letter placeholder */}
      <div
        style={{
          backgroundColor: effectiveImage ? undefined : placeholderBg,
        }}
        className="w-14 h-14 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
      >
        {effectiveImage ? (
          <img
            src={effectiveImage}
            alt={item.item_name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // If image fails, hide it so the placeholder bg shows through
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span
            style={{ color: "#1a1a1a" }}
            className="font-display text-2xl tracking-wider"
          >
            {initial}
          </span>
        )}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <p
          style={{ color: "#1a1a1a" }}
          className="font-condensed font-bold text-[15px] uppercase tracking-wide leading-tight"
        >
          {item.item_name}
        </p>
        {showDescription && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {item.description}
          </p>
        )}
      </div>

      {/* Price - quiet, charcoal, right-aligned */}
      <div className="shrink-0 text-right">
        <p
          style={{ color: "#1a1a1a" }}
          className="font-condensed font-bold text-base"
        >
          &#8358;{item.rate.toLocaleString()}
        </p>
      </div>
    </motion.button>
  );
}