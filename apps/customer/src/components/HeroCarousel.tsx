interface HeroCard {
  kind: "promo" | "featured" | "info";
  eyebrow: string;
  title: string;
  subtitle: string;
}

const CARDS: HeroCard[] = [
  {
    kind: "promo",
    eyebrow: "Free delivery",
    title: "Orders over\n\u20A615,000",
    subtitle: "Today only",
  },
  {
    kind: "featured",
    eyebrow: "New",
    title: "Catfish\nPepper Soup",
    subtitle: "Try it tonight",
  },
  {
    kind: "info",
    eyebrow: "Open today",
    title: "10AM - 10PM",
    subtitle: "All branches",
  },
];

export function HeroCarousel() {
  return (
    <div className="px-3.5 pt-3.5 pb-2">
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory">
        {CARDS.map((card, i) => {
          const isPromo = card.kind === "promo";
          const isFeatured = card.kind === "featured";
          const bg = isPromo ? "#E60019" : isFeatured ? "#1a1a1a" : "#ffffff";
          const fg = isPromo || isFeatured ? "#ffffff" : "#1a1a1a";
          const eyebrowColor = isPromo
            ? "rgba(255,255,255,0.9)"
            : isFeatured
            ? "#E60019"
            : "#888";
          const subColor = isPromo
            ? "rgba(255,255,255,0.85)"
            : isFeatured
            ? "rgba(255,255,255,0.7)"
            : "#888";

          return (
            <div
              key={i}
              style={{
                backgroundColor: bg,
                color: fg,
                borderColor: card.kind === "info" ? "#ebe6dd" : "transparent",
              }}
              className="flex-none w-[240px] h-[120px] rounded-2xl p-3.5 flex flex-col justify-between snap-start border relative overflow-hidden"
            >
              {isFeatured && (
                <div
                  style={{ backgroundColor: "#2a2a2a" }}
                  className="absolute -right-3 -top-3 w-[110px] h-[110px] rounded-full"
                />
              )}
              <div className="relative">
                <p
                  style={{ color: eyebrowColor, letterSpacing: "0.1em" }}
                  className="font-condensed text-[11px] font-semibold uppercase"
                >
                  {card.eyebrow}
                </p>
                <p
                  style={{ letterSpacing: "0.02em" }}
                  className="font-display text-[22px] leading-[1.05] mt-1 whitespace-pre-line"
                >
                  {card.title}
                </p>
              </div>
              <p
                style={{ color: subColor }}
                className="font-condensed text-xs relative"
              >
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
