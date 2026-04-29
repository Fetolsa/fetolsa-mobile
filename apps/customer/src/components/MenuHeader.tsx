import { ShoppingBag, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useCustomer } from "../context/CustomerContext";
import { tenant } from "../tenant.generated";

interface Props {
  onCartOpen: () => void;
  onAccountOpen: () => void;
  onSignInOpen: () => void;
}

export function MenuHeader({ onCartOpen, onAccountOpen, onSignInOpen }: Props) {
  const { totalItems } = useCart();
  const { isLoggedIn, customer } = useCustomer();

  const initial = (customer?.name || customer?.phone || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-primary/20">
      <div className="container flex items-center justify-between h-14 px-4">
        {isLoggedIn ? (
          <button
            onClick={onAccountOpen}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display tracking-wider text-sm hover:opacity-90 transition-opacity"
            aria-label="Open account"
          >
            {initial}
          </button>
        ) : (
          <button
            onClick={onSignInOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-condensed font-bold uppercase tracking-wide text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
            aria-label="Sign in"
          >
            <User className="w-3.5 h-3.5" />
            Sign In
          </button>
        )}

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