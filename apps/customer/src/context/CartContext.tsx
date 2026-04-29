import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { CartItem } from "../types/menu";

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
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage failures
    }
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item_code === item.item_code);
      if (existing) {
        return prev.map((i) =>
          i.item_code === item.item_code
            ? { ...i, qty: i.qty + item.qty, notes: item.notes || i.notes }
            : i,
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (itemCode: string) => {
    setItems((prev) => prev.filter((i) => i.item_code !== itemCode));
  };

  const updateQty = (itemCode: string, qty: number) => {
    if (qty <= 0) {
      removeItem(itemCode);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.item_code === itemCode ? { ...i, qty } : i)),
    );
  };

  const clear = () => setItems([]);
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.rate * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clear, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}