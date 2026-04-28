import type { MenuCategory } from "../types/menu";

interface Props {
  categories: MenuCategory[];
  active: string;
  onSelect: (name: string) => void;
}

export function CategoryNav({ categories, active, onSelect }: Props) {
  if (categories.length === 0) return null;

  return (
    <div className="sticky top-[105px] z-20 bg-background/95 backdrop-blur-sm border-b border-primary/20">
      <div className="container px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onSelect(cat.name)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] sm:text-sm font-condensed font-semibold uppercase tracking-wide transition-all ${
                active === cat.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/30 text-primary hover:bg-secondary/50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}