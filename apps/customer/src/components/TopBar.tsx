import { User, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import logoUrl from "../assets/villagechief-logo.png";

interface Props {
  onAccountClick: () => void;
  onCartClick: () => void;
}

export function TopBar({ onAccountClick, onCartClick }: Props) {
  const { items } = useCart();
  const itemCount = items.reduce((sum, it) => sum + it.qty, 0);

  return (
    <header
      style={{ backgroundColor: "#faf7f2", borderColor: "#ebe6dd" }}
      className="sticky top-0 z-40 border-b"
    >
      <div className="container max-w-md mx-auto flex items-center justify-between h-[52px] px-3.5">
        <button
          onClick={onAccountClick}
          aria-label="Account"
          style={{ color: "#1a1a1a" }}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <User className="w-[22px] h-[22px]" />
        </button>

        <img
          src={logoUrl}
          alt="Village Chief"
          className="h-9 w-auto object-contain"
        />

        <button
          onClick={onCartClick}
          aria-label="Cart"
          style={{ color: "#1a1a1a" }}
          className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <ShoppingBag className="w-[22px] h-[22px]" />
          {itemCount > 0 && (
            <span
              style={{ backgroundColor: "#E60019", color: "#ffffff" }}
              className="absolute top-1.5 right-1 min-w-[16px] h-[16px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
            >
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
