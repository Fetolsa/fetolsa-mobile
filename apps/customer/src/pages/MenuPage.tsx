import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { fetchMenu, fetchBranches, fetchTakeawayPacks } from "../lib/menu-api";
import type { MenuItem, MenuCategory, Branch } from "../types/menu";
import type { CustomerOrder } from "../lib/auth-api";
import { useBranch } from "../context/BranchContext";
import { useCart } from "../context/CartContext";
import { useCustomer } from "../context/CustomerContext";
import { TopBar } from "../components/TopBar";
import { LocationBar } from "../components/LocationBar";
import { TimeAwareHero } from "../components/TimeAwareHero";
import { SearchBar } from "../components/SearchBar";
import { CategoryChips } from "../components/CategoryChips";
import { FloatingCartBar } from "../components/FloatingCartBar";
import { MenuItemRow } from "../components/MenuItemRow";
import { MenuItemModal } from "../components/MenuItemModal";
import { DrinkPairingModal } from "../components/DrinkPairingModal";
import { CategorySheet } from "../components/CategorySheet";
import { SearchSheet } from "../components/SearchSheet";
import { CartDrawer } from "../components/CartDrawer";
import { CheckoutModal } from "../components/CheckoutModal";
import { LoginModal } from "../components/LoginModal";
import { AccountDrawer } from "../components/AccountDrawer";
import { EmailPrompt } from "../components/EmailPrompt";
import { BottomNav, type NavTab } from "../components/BottomNav";

const MEAL_SLOT_CATEGORIES: Record<"breakfast" | "lunch" | "dinner", string[]> = {
  breakfast: ["Breakfast", "Intercontinental Breakfast", "Dan Kano"],
  lunch: ["Soups", "Special Soups", "Pepper Soup", "Amala and Co", "Local Delicacies", "Village Chief Locals", "Village Chiefs Locals", "Main Course", "Noodles and Spaghetti", "Sides", "VC Extra Specials"],
  dinner: ["Grills", "Suya", "Platters", "Pepper Soup", "Soups", "Special Soups", "VC Extra Specials"],
};

function getMealSlotForSort(date: Date = new Date()): "breakfast" | "lunch" | "dinner" {
  const h = date.getHours();
  if (h >= 6 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  return "dinner";
}

function sortCategoriesByMealSlot(cats: MenuCategory[]): MenuCategory[] {
  const slot = getMealSlotForSort();
  const priority = MEAL_SLOT_CATEGORIES[slot];
  const inPriority: MenuCategory[] = [];
  const others: MenuCategory[] = [];
  const seen = new Set<string>();
  for (const name of priority) {
    const found = cats.find((c) => c.name === name);
    if (found && !seen.has(found.name)) {
      inPriority.push(found);
      seen.add(found.name);
    }
  }
  for (const c of cats) {
    if (!seen.has(c.name)) others.push(c);
  }
  return [...inPriority, ...others];
}

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [pairingOpen, setPairingOpen] = useState(false);
  const [pairingDrinks, setPairingDrinks] = useState<MenuItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>("menu");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { branch, setBranch } = useBranch();
  const { items: cartItems, clear: clearCart, addItem, setTakeawayPacks } = useCart();
  const { needsEmailPrompt, setNeedsEmailPrompt, isLoggedIn, orders } = useCustomer();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const itemsByCode = useMemo(() => {
    const map = new Map<string, MenuItem>();
    for (const cat of categories) {
      for (const item of cat.items) {
        map.set(item.item_code, item);
      }
    }
    return map;
  }, [categories]);

  const sortedCategories = useMemo(() => sortCategoriesByMealSlot(categories), [categories]);

  const computeSuggestedDrinks = (): MenuItem[] => {
    const cartCodes = new Set(cartItems.map((c) => c.item_code));
    const drinkCodes = new Set<string>();
    for (const cartItem of cartItems) {
      const menuItem = itemsByCode.get(cartItem.item_code);
      if (!menuItem || !menuItem.paired_drinks) continue;
      for (const code of menuItem.paired_drinks) {
        if (!cartCodes.has(code)) {
          drinkCodes.add(code);
        }
      }
    }
    return Array.from(drinkCodes)
      .map((code) => itemsByCode.get(code))
      .filter((d): d is MenuItem => Boolean(d));
  };

  const handleReorder = (order: CustomerOrder) => {
    if (!order.items || order.items.length === 0) return;
    clearCart();
    order.items.forEach((it) => {
      const menuItem = itemsByCode.get(it.item_code);
      addItem({
        item_code: it.item_code,
        item_name: it.item_name,
        qty: it.qty,
        rate: it.rate,
        category: menuItem?.category,
      });
    });
    setCartOpen(true);
    setActiveTab("cart");
  };

  const handleViewOrder = (orderId: string) => {
    window.location.hash = `#/track/${orderId}`;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMenu()
      .then((cats) => {
        if (cancelled) return;
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].name);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || "Failed to load menu.");
        setLoading(false);
      });

    fetchBranches()
      .then((list) => {
        if (cancelled) return;
        setBranches(list);
        if (!branch && list.length > 0) {
          const vcOnline = list.find((b) => b.name === "VC Online");
          setBranch(vcOnline ? vcOnline.name : list[0].name);
        }
      })
      .catch(() => {});

    fetchTakeawayPacks()
      .then((pack) => {
        if (cancelled) return;
        setTakeawayPacks(pack);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY + 140;
      let current = categories[0].name;
      for (const cat of categories) {
        const el = sectionRefs.current[cat.name];
        if (el && el.offsetTop <= scrollY) {
          current = cat.name;
        }
      }
      setActiveCategory(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  const scrollToCategory = (name: string) => {
    setActiveCategory(name);
    sectionRefs.current[name]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCheckout = () => {
    setCartOpen(false);
    const drinks = computeSuggestedDrinks();
    if (drinks.length > 0) {
      setPairingDrinks(drinks);
      setPairingOpen(true);
    } else {
      setCheckoutOpen(true);
    }
  };

  const handlePairingClose = () => {
    setPairingOpen(false);
    setCheckoutOpen(true);
  };

  const handleOrderPlaced = async (orderId: string, paymentUrl: string) => {
    console.log("[order placed]", orderId, "opening Paystack");
    clearCart();
    window.location.href = paymentUrl;
  };

  const handleAccountClick = () => {
    if (isLoggedIn) {
      setAccountOpen(true);
    } else {
      setLoginOpen(true);
    }
  };

  const handleTabSelect = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === "menu") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tab === "orders") {
      if (isLoggedIn && orders.length > 0) {
        window.location.hash = `#/track/${orders[0].name}`;
      } else if (!isLoggedIn) {
        setLoginOpen(true);
      } else {
        setAccountOpen(true);
      }
    } else if (tab === "account") {
      handleAccountClick();
    } else if (tab === "cart") {
      setCartOpen(true);
    }
  };

  return (
    <div style={{ backgroundColor: "#faf7f2" }} className="min-h-screen pb-20">
      <TopBar
        onAccountClick={handleAccountClick}
        onCartClick={() => setCartOpen(true)}
      />
      <LocationBar branches={branches} />
      <TimeAwareHero itemsByCode={itemsByCode} onSelectItem={setSelectedItem} />
      <SearchBar onClick={() => setSearchSheetOpen(true)} />
      <CategoryChips
        categories={sortedCategories}
        active={activeCategory}
        onSelect={scrollToCategory}
      />

      <main className="container max-w-md mx-auto px-3.5 py-4 space-y-7">
        {sortedCategories.map((cat) => (
          <section
            key={cat.name}
            ref={(el) => {
              sectionRefs.current[cat.name] = el;
            }}
            className="scroll-mt-[110px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-baseline gap-2.5 mb-3.5"
            >
              <h2
                style={{
                  color: "#1a1a1a",
                  letterSpacing: "0.06em",
                  borderBottom: "3px solid #E60019",
                }}
                className="font-display text-[26px] uppercase leading-none pb-1 inline-block"
              >
                {cat.name}
              </h2>
              <span
                style={{ color: "#888", letterSpacing: "0.08em" }}
                className="text-[11px] font-condensed uppercase ml-auto"
              >
                {cat.items.length} item{cat.items.length === 1 ? "" : "s"}
              </span>
            </motion.div>

            <div className="space-y-2.5">
              {cat.items.map((item, i) => (
                <MenuItemRow
                  key={item.item_code}
                  item={item}
                  index={i}
                  onSelect={setSelectedItem}
                />
              ))}
            </div>
          </section>
        ))}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div
              style={{ borderColor: "#E60019" }}
              className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full"
            />
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-destructive font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
              className="px-4 py-2 rounded-lg text-sm font-condensed font-bold uppercase tracking-wide"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground font-condensed">
              No menu items available.
            </p>
          </div>
        )}
      </main>

      <FloatingCartBar onClick={() => setCartOpen(true)} />

      <MenuItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      <DrinkPairingModal
        open={pairingOpen}
        pairedDrinks={pairingDrinks}
        onClose={handlePairingClose}
      />
      <CategorySheet
        open={categorySheetOpen}
        categories={categories}
        active={activeCategory}
        onClose={() => setCategorySheetOpen(false)}
        onSelect={scrollToCategory}
      />
      <SearchSheet
        open={searchSheetOpen}
        categories={categories}
        onClose={() => setSearchSheetOpen(false)}
        onSelectItem={(item) => setSelectedItem(item)}
        onSelectCategory={(name) => scrollToCategory(name)}
      />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <AccountDrawer
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onReorder={handleReorder}
        onViewOrder={handleViewOrder}
      />
      <EmailPrompt
        open={needsEmailPrompt}
        onClose={() => setNeedsEmailPrompt(false)}
      />

      <BottomNav active={activeTab} onSelect={handleTabSelect} />
    </div>
  );
}
