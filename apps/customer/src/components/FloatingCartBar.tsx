import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";

interface Props {
  onClick: () => void;
}

export function FloatingCartBar({ onClick }: Props) {
  const { items } = useCart();
  const itemCount = items.reduce((sum, it) => sum + it.qty, 0);
  const total = items.reduce((sum, it) => sum + it.qty * it.rate, 0);

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-[72px] left-0 right-0 z-30 px-3.5 pointer-events-none">
      <button
        onClick={onClick}
        style={{
          backgroundColor: "#E60019",
          color: "#ffffff",
          boxShadow: "0 4px 12px rgba(230, 0, 25, 0.3)",
        }}
        className="container max-w-md mx-auto w-full rounded-2xl px-4 py-3 flex items-center justify-between pointer-events-auto active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-2.5">
          <div
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            className="w-7 h-7 rounded-full flex items-center justify-center"
          >
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span
            style={{ letterSpacing: "0.06em" }}
            className="font-condensed text-sm font-bold uppercase"
          >
            View cart &middot; {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-condensed text-[15px] font-bold">
            &#8358;{total.toLocaleString()}
          </span>
          <ArrowRight className="w-[18px] h-[18px]" />
        </div>
      </button>
    </div>
  );
}
