import { useEffect, useRef } from "react";
import type { MenuCategory } from "../types/menu";

interface Props {
  categories: MenuCategory[];
  active: string;
  onSelect: (name: string) => void;
}

export function CategoryChips({ categories, active, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const btn = activeRef.current;
      const container = containerRef.current;
      const offsetLeft = btn.offsetLeft;
      const btnWidth = btn.offsetWidth;
      const containerWidth = container.offsetWidth;
      container.scrollTo({
        left: offsetLeft - containerWidth / 2 + btnWidth / 2,
        behavior: "smooth",
      });
    }
  }, [active]);

  if (categories.length === 0) return null;

  return (
    <div
      style={{ backgroundColor: "#faf7f2", borderColor: "#ebe6dd" }}
      className="sticky top-[52px] z-30 border-b"
    >
      <div
        ref={containerRef}
        className="container max-w-md mx-auto flex gap-2 overflow-x-auto scrollbar-hide px-3.5 py-2"
      >
        {categories.map((cat) => {
          const isActive = active === cat.name;
          return (
            <button
              key={cat.name}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSelect(cat.name)}
              style={{
                backgroundColor: isActive ? "#E60019" : "#ffffff",
                color: isActive ? "#ffffff" : "#1a1a1a",
                borderColor: isActive ? "#E60019" : "#ebe6dd",
                letterSpacing: "0.06em",
              }}
              className="shrink-0 border rounded-full px-3.5 py-1.5 font-condensed text-xs font-bold uppercase whitespace-nowrap transition-colors"
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
