import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Browser } from "@capacitor/browser";
import { fetchMenu, fetchBranches } from "../lib/menu-api";
import type { MenuItem, MenuCategory, Branch } from "../types/menu";
import type { CustomerOrder } from "../lib/auth-api";
import { useBranch } from "../context/BranchContext";
import { useCart } from "../context/CartContext";
import { useCustomer } from "../context/CustomerContext";
import { MenuHeader } from "../components/MenuHeader";
import { BranchSelector } from "../components/BranchSelector";
import { CategoryNav } from "../components/CategoryNav";
import { MenuItemCard } from "../components/MenuItemCard";
import { MenuItemModal } from "../components/MenuItemModal";
import { CartDrawer } from "../components/CartDrawer";
import { CheckoutModal } from "../components/CheckoutModal";
import { LoginModal } from "../components/LoginModal";
import { AccountDrawer } from "../components/AccountDrawer";
import { EmailPrompt } from "../components/EmailPrompt";

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { branch, setBranch } = useBranch();
  const { clear: clearCart, addItem } = useCart();
  const { needsEmailPrompt, setNeedsEmailPrompt } = useCustomer();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Reorder helper: replace cart with past order's items, open cart drawer.
  // Notes are not carried over (they were specific to that order). Quantities are.
  const handleReorder = (order: CustomerOrder) => {
    if (!order.items || order.items.length === 0) return;
    clearCart();
    order.items.forEach((it) => {
      addItem({
        item_code: it.item_code,
        item_name: it.item_name,
        qty: it.qty,
        rate: it.rate,
      });
    });
    setCartOpen(true);
  };

  const handleViewOrder = (orderId: string) => {
    // Navigate via hash router to track page
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

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToCategory = (name: string) => {
    setActiveCategory(name);
    sectionRefs.current[name]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleOrderPlaced = async (orderId: string, paymentUrl: string) => {
    console.log("[order placed]", orderId, "opening Paystack");
    clearCart();
    try {
      await Browser.open({ url: paymentUrl, presentationStyle: "popover" });
    } catch {
      window.location.href = paymentUrl;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MenuHeader
        onCartOpen={() => setCartOpen(true)}
        onAccountOpen={() => setAccountOpen(true)}
        onSignInOpen={() => setLoginOpen(true)}
      />
      <BranchSelector branches={branches} />
      <CategoryNav
        categories={categories}
        active={activeCategory}
        onSelect={scrollToCategory}
      />

      <main className="container px-4 py-6 space-y-10">
        {categories.map((cat) => (
          <section
            key={cat.name}
            ref={(el) => {
              sectionRefs.current[cat.name] = el;
            }}
            className="scroll-mt-36"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-2xl text-primary gold-line-decoration tracking-wider mb-6"
            >
              {cat.name.toUpperCase()}
            </motion.h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.items.map((item, i) => (
                <MenuItemCard
                  key={item.item_code}
                  item={item}
                  index={i}
                  onSelect={setSelectedItem}
                />
              ))}
            </div>
            <div className="gold-divider">
              <span className="text-primary/40 text-xs">&#9670;</span>
            </div>
          </section>
        ))}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-destructive font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-condensed font-bold uppercase tracking-wide hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground font-condensed">No menu items available.</p>
          </div>
        )}
      </main>

      <MenuItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
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
    </div>
  );
}