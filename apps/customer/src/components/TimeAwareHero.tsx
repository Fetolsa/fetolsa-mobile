import { useEffect, useState } from "react";
import type { MenuItem } from "../types/menu";
import { placeholderImage } from "../lib/placeholder";

interface Props {
  itemsByCode: Map<string, MenuItem>;
  onSelectItem: (item: MenuItem) => void;
}

type MealSlot = "breakfast" | "lunch" | "dinner";

interface SlotConfig {
  greeting: string;
  title: string;
  subline: string;
  bg: string;
  fg: string;
  eyebrowColor: string;
  itemCodes: string[];
}

const BREAKFAST_PICKS = ["Akara and Pap", "Masa Dan Kano", "Agege Bread"];
const LUNCH_PICKS = ["Edikang Kong", "Full Catfish Pepper Soup with Boiled Yam", "Chicken Suya Half"];
const DINNER_PICKS = ["Catfish Medium", "All Die Na Die Platter", "Village Vegetable Chicken (Full)"];

const SLOTS: Record<MealSlot, SlotConfig> = {
  breakfast: {
    greeting: "Good morning",
    title: "Start with breakfast",
    subline: "Served until 11am",
    bg: "#1a1a1a",
    fg: "#ffffff",
    eyebrowColor: "#E60019",
    itemCodes: BREAKFAST_PICKS,
  },
  lunch: {
    greeting: "Lunch is served",
    title: "Pick your favourite",
    subline: "Hot, fresh, made to order",
    bg: "#E60019",
    fg: "#ffffff",
    eyebrowColor: "rgba(255,255,255,0.85)",
    itemCodes: LUNCH_PICKS,
  },
  dinner: {
    greeting: "Dinner time",
    title: "End the day right",
    subline: "Grills, classics, sharing platters",
    bg: "#1a1a1a",
    fg: "#ffffff",
    eyebrowColor: "#E60019",
    itemCodes: DINNER_PICKS,
  },
};

function getMealSlot(date: Date = new Date()): MealSlot {
  const h = date.getHours();
  if (h >= 6 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  return "dinner";
}

export function TimeAwareHero({ itemsByCode, onSelectItem }: Props) {
  const [slot, setSlot] = useState<MealSlot>(() => getMealSlot());

  // Re-check slot every 5 minutes in case the user keeps the app open across a boundary
  useEffect(() => {
    const id = setInterval(() => setSlot(getMealSlot()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const config = SLOTS[slot];
  const picks = config.itemCodes
    .map((code) => itemsByCode.get(code))
    .filter((i): i is MenuItem => Boolean(i));

  if (picks.length === 0) return null;

  return (
    <div className="px-3.5 pt-3.5 pb-2">
      <div
        style={{ backgroundColor: config.bg, color: config.fg }}
        className="rounded-2xl p-4 relative overflow-hidden"
      >
        <p
          style={{ color: config.eyebrowColor, letterSpacing: "0.1em" }}
          className="font-condensed text-[11px] font-bold uppercase"
        >
          {config.greeting}
        </p>
        <h2
          style={{ letterSpacing: "0.04em" }}
          className="font-display text-[24px] uppercase leading-tight mt-1"
        >
          {config.title}
        </h2>
        <p
          style={{ opacity: 0.8 }}
          className="font-condensed text-xs mt-0.5"
        >
          {config.subline}
        </p>

        <div className="mt-3 -mx-1 px-1 flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 snap-x">
          {picks.map((item) => {
            const img = placeholderImage(item.item_name, item.category);
            return (
              <button
                key={item.item_code}
                onClick={() => onSelectItem(item)}
                style={{ backgroundColor: "#ffffff" }}
                className="flex-none w-[140px] rounded-xl overflow-hidden snap-start text-left active:scale-[0.97] transition-transform"
              >
                <div
                  style={{ backgroundColor: img ? "#1a1a1a" : "#f3efe8" }}
                  className="w-full aspect-[4/3]"
                >
                  {img && (
                    <img
                      src={img}
                      alt={item.item_name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-2">
                  <p
                    style={{ color: "#1a1a1a", letterSpacing: "0.03em" }}
                    className="font-condensed font-bold text-[12px] uppercase leading-tight line-clamp-2"
                  >
                    {item.item_name}
                  </p>
                  <p
                    style={{ color: "#E60019" }}
                    className="font-condensed font-bold text-[13px] mt-1"
                  >
                    &#8358;{item.rate.toLocaleString()}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
