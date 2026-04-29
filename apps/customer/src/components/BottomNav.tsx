import { ShoppingBag, User, ListOrdered, UtensilsCrossed } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useCustomer } from "../context/CustomerContext";

export type NavTab = "menu" | "orders" | "account" | "cart";

interface Props {
  active: NavTab;
  onSelect: (tab: NavTab) => void;
}

interface TabDef {
  id: NavTab;
  label: string;
  icon: typeof ShoppingBag;
}

const TABS: TabDef[] = [
  { id: "menu", label: "Menu", icon: UtensilsCrossed },
  { id: "orders", label: "Orders", icon: ListOrdered },
  { id: "account", label: "Account", icon: User },
  { id: "cart", label: "Cart", icon: ShoppingBag },
];

export function BottomNav({ active, onSelect }: Props) {
  const { totalItems } = useCart();
  const { isLoggedIn } = useCustomer();

  return (
    <nav
      style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
    >
      <div className="container max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          const showCartBadge = tab.id === "cart" && totalItems > 0;
          const showAccountDot = tab.id === "account" && isLoggedIn;

          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              style={{
                color: isActive ? "#E60019" : "#1a1a1a",
              }}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 relative transition-colors"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${isActive ? "" : "opacity-70"}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {showCartBadge && (
                  <span
                    style={{ backgroundColor: "#E60019", color: "#ffffff" }}
                    className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </span>
                )}
                {showAccountDot && !isActive && (
                  <span
                    style={{ backgroundColor: "#E60019" }}
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-condensed font-semibold uppercase tracking-wide leading-none ${
                  isActive ? "" : "opacity-70"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}