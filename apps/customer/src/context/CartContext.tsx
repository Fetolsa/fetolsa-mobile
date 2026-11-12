import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { CartItem } from "../types/menu";
import { fetchTakeawayPacks } from "../lib/menu-api";

// Takeaway packs are added by the SERVER when the order is priced (checkout quote,
// then the order itself). The cart holds food and drinks only. The server's pack
// Items are fetched once so a cart saved by an older app version is cleaned of the
// pack lines that version added on the phone.

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemCode: string) => void;
  updateQty: (itemCode: string, qty: number) => void;
  clear: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "vc_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? (JSON.parse(saved) as CartItem[]) : [];
      return parsed.filter((i) => !i.auto_added);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetchTakeawayPacks()
      .then((packs) => {
        if (cancelled) return;
        const codes = new Set(Object.values(packs).flatMap((p) => (p ? [p.item_code] : [])));
        if (codes.size > 0) setItems((prev) => prev.filter((i) => !codes.has(i.item_code)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item_code === item.item_code);
      if (existing) {
        return prev.map((i) =>
          i.item_code === item.item_code
            ? { ...i, qty: i.qty + item.qty, notes: item.notes || i.notes, category: item.category || i.category }
            : i,
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (itemCode: string) => setItems((prev) => prev.filter((i) => i.item_code !== itemCode));

  const updateQty = (itemCode: string, qty: number) =>
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.item_code !== itemCode) : prev.map((i) => (i.item_code === itemCode ? { ...i, qty } : i)),
    );

  const clear = () => setItems([]);
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.rate * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
