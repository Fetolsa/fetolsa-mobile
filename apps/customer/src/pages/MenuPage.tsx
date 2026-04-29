import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { Browser } from "@capacitor/browser";
import { fetchMenu, fetchBranches } from "../lib/menu-api";
import type { MenuItem, MenuCategory, Branch } from "../types/menu";
import type { CustomerOrder } from "../lib/auth-api";
import { useBranch } from "../context/BranchContext";
import { useCart } from "../context/CartContext";
import { useCustomer } from "../context/CustomerContext";
import { MenuHeader } from "../components/MenuHeader";
import { BranchSelector } from "../components/BranchSelector";
import { MenuItemRow } from "../components/MenuItemRow";
import { MenuItemModal } from "../components/MenuItemModal";
import { CategorySheet } from "../components/CategorySheet";
import { SearchSheet } from "../components/SearchSheet";
import { CartDrawer } from "../components/CartDrawer";
import { CheckoutModal } from "../components/CheckoutModal";
import { LoginModal } from "../components/LoginModal";
import { AccountDrawer } from "../components/AccountDrawer";
import { EmailPrompt } from "../components/EmailPrompt";
import { BottomNav, type NavTab } from "../components/BottomNav";

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
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
  const { clear: clearCart, addItem } = useCart();
  const { needsEmailPrompt, setNeedsEmailPrompt, isLoggedIn, orders } = useCustomer();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

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

    // Belt-and-suspenders post-payment routing:
    // 1. Try the deep link path: Paystack redirects to vchief://payment/callback?order_id=X
    //    which the AndroidManifest intercepts and routes via App.tsx DeepLinkRouter.
    // 2. Fallback: if the user manually closes the Custom Tab (or the deep link doesn't
    //    fire), we still navigate to the order callback page so they can see status.
    let browserFinishedListener: { remove: () => void } | null = null;
    try {
      browserFinishedListener = await Browser.addListener("browserFinished", () => {
        console.log("[paystack browser closed] navigating to order callback");
        window.location.hash = `#/order/${orderId}`;
        if (browserFinishedListener) {
          browserFinishedListener.remove();
          browserFinishedListener = null;
        }
      });

      await Browser.open({ url: paymentUrl, presentationStyle: "fullscreen" });
    } catch (err) {
      console.error("[paystack browser open failed]", err);
      if (browserFinishedListener) {
        browserFinishedListener.remove();
      }
      // Last resort: nav in same window
      window.location.href = paymentUrl;
    }
  };

  const handleTabSelect = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === "menu") {
      // already on menu - smooth scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tab === "orders") {
      // For now, navigate to most recent order's track page if logged in
      if (isLoggedIn && orders.length > 0) {
        window.location.hash = `#/track/${orders[0].name}`;
      } else if (!isLoggedIn) {
        setLoginOpen(true);
      } else {
        // Logged in but no orders - open account drawer instead
        setAccountOpen(true);
      }
    } else if (tab === "account") {
      if (isLoggedIn) {
        setAccountOpen(true);
      } else {
        setLoginOpen(true);
      }
    } else if (tab === "cart") {
      setCartOpen(true);
    }
  };

  return (
    <div
      style={{ backgroundColor: "#faf7f2" }}
      className="min-h-screen pb-20"
    >
      <MenuHeader onSearchOpen={() => setSearchSheetOpen(true)} />
      <BranchSelector branches={branches} />

      <main className="container max-w-md mx-auto px-4 py-5 space-y-8">
        {categories.map((cat) => (
          <section
            key={cat.name}
            ref={(el) => {
              sectionRefs.current[cat.name] = el;
            }}
            className="scroll-mt-32"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-4"
            >
              <div
                style={{ backgroundColor: "#E60019" }}
                className="w-1 h-7 rounded-full"
              />
              <h2
                style={{ color: "#1a1a1a", letterSpacing: "0.06em" }}
                className="font-display text-2xl uppercase"
              >
                {cat.name}
              </h2>
              <span className="text-xs text-muted-foreground font-condensed ml-auto">
                {cat.items.length} item{cat.items.length === 1 ? "" : "s"}
              </span>
            </motion.div>

            <div className="space-y-2">
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

      {/* Floating "Browse" pill Ã¢â‚¬â€ bottom-right, above the BottomNav */}
      {categories.length > 0 && (
        <button
          onClick={() => setCategorySheetOpen(true)}
          style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
          className="fixed bottom-20 right-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg font-condensed font-bold text-xs uppercase tracking-wide hover:opacity-90 transition-opacity"
          aria-label="Browse categories"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Browse
        </button>
      )}

      <MenuItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
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