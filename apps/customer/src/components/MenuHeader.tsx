import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { tenant } from "../tenant.generated";

interface Props {
  onCartOpen: () => void;
}

export function MenuHeader({ onCartOpen }: Props) {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-primary/20">
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="w-10" />
        <h1 className="font-display text-2xl text-primary tracking-wider uppercase">
          {tenant.displayName}
        </h1>
        <button
          onClick={onCartOpen}
          className="relative p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Open cart"
        >
          <ShoppingBag className="w-5 h-5 text-primary" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}