import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import type { CartItem } from "../types/menu";
import {
  TAKEAWAY_PACK_ITEM_CODE,
  TAKEAWAY_PACK_CATEGORIES,
} from "../lib/takeaway";
import type { TakeawayPack } from "../lib/menu-api";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemCode: string) => void;
  updateQty: (itemCode: string, qty: number) => void;
  clear: () => void;
  totalItems: number;
  subtotal: number;
  takeawayPack: TakeawayPack | null;
  setTakeawayPack: (pack: TakeawayPack | null) => void;
  requiredPackCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "vc_cart";

function computeRequiredPackCount(items: CartItem[]): number {
  let count = 0;
  for (const it of items) {
    if (it.item_code === TAKEAWAY_PACK_ITEM_CODE) continue;
    if (it.category && TAKEAWAY_PACK_CATEGORIES.has(it.category)) {
      count += it.qty;
    }
  }
  return count;
}

function applyPackSync(
  items: CartItem[],
  pack: TakeawayPack | null,
): CartItem[] {
  if (!pack) return items;
  const required = computeRequiredPackCount(items);
  const others = items.filter((i) => i.item_code !== TAKEAWAY_PACK_ITEM_CODE);
  const existing = items.find((i) => i.item_code === TAKEAWAY_PACK_ITEM_CODE);

  if (required === 0) {
    return others;
  }

  const finalQty = Math.max(required, existing?.qty ?? 0);
  return [
    ...others,
    {
      item_code: pack.item_code,
      item_name: pack.item_name,
      qty: finalQty,
      rate: pack.rate,
      auto_added: true,
    },
  ];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [takeawayPack, setTakeawayPack] = useState<TakeawayPack | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // Whenever the pack info loads, sync the cart line
  useEffect(() => {
    if (takeawayPack) {
      setItems((prev) => applyPackSync(prev, takeawayPack));
    }
  }, [takeawayPack]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item_code === item.item_code);
      let next: CartItem[];
      if (existing) {
        next = prev.map((i) =>
          i.item_code === item.item_code
            ? { ...i, qty: i.qty + item.qty, notes: item.notes || i.notes, category: item.category || i.category }
            : i,
        );
      } else {
        next = [...prev, item];
      }
      return applyPackSync(next, takeawayPack);
    });
  };

  const removeItem = (itemCode: string) => {
    if (itemCode === TAKEAWAY_PACK_ITEM_CODE) return; // mandatory, cannot remove
    setItems((prev) => applyPackSync(prev.filter((i) => i.item_code !== itemCode), takeawayPack));
  };

  const updateQty = (itemCode: string, qty: number) => {
    setItems((prev) => {
      // Pack: cannot drop below required count
      if (itemCode === TAKEAWAY_PACK_ITEM_CODE) {
        const required = computeRequiredPackCount(prev);
        const clamped = Math.max(qty, required);
        if (clamped <= 0) return prev;
        return prev.map((i) => (i.item_code === itemCode ? { ...i, qty: clamped } : i));
      }
      // Other items
      if (qty <= 0) {
        return applyPackSync(prev.filter((i) => i.item_code !== itemCode), takeawayPack);
      }
      const next = prev.map((i) => (i.item_code === itemCode ? { ...i, qty } : i));
      return applyPackSync(next, takeawayPack);
    });
  };

  const clear = () => setItems([]);
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.rate * i.qty, 0);
  const requiredPackCount = useMemo(() => computeRequiredPackCount(items), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clear,
        totalItems,
        subtotal,
        takeawayPack,
        setTakeawayPack,
        requiredPackCount,
      }}
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
