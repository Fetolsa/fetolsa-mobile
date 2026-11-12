import type { MenuItem } from "../types/menu";
import { placeholderImage } from "../lib/placeholder";

interface Props {
  combos: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

/** Combos (item group "Combos", from the server). Hidden while VC has none. */
export function ComboStrip({ combos, onSelectItem }: Props) {
  if (combos.length === 0) return null;
  return (
    <section className="px-3.5 pt-2 pb-1" data-testid="app-combos">
      <p style={{ color: "#E60019", letterSpacing: "0.1em" }} className="font-condensed text-[11px] font-bold uppercase">
        Better together
      </p>
      <h2 style={{ color: "#1a1a1a", letterSpacing: "0.04em" }} className="font-display text-[22px] uppercase leading-tight">
        Combos
      </h2>
      <div className="mt-2.5 -mx-1 px-1 flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 snap-x">
        {combos.map((item) => {
          const img = placeholderImage(item.item_name, item.category);
          return (
            <button
              key={item.item_code}
              onClick={() => onSelectItem(item)}
              style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
              className="flex-none w-[150px] rounded-xl overflow-hidden border snap-start text-left active:scale-[0.97] transition-transform"
            >
              <div style={{ backgroundColor: img ? "#1a1a1a" : "#f3efe8" }} className="w-full aspect-[4/3]">
                {img && <img src={img} alt={item.item_name} className="w-full h-full object-cover" />}
              </div>
              <div className="p-2">
                <p style={{ color: "#1a1a1a", letterSpacing: "0.03em" }} className="font-condensed font-bold text-[12px] uppercase leading-tight line-clamp-2">
                  {item.item_name}
                </p>
                <p style={{ color: "#E60019" }} className="font-condensed font-bold text-[13px] mt-1">
                  &#8358;{item.rate.toLocaleString()}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
