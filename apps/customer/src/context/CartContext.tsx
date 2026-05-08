import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import type { CartItem } from "../types/menu";
import {
  PACK_ITEM_CODES,
  getPackKindForCategory,
  type PackKind,
} from "../lib/takeaway";
import type { TakeawayPack, TakeawayPacks } from "../lib/menu-api";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemCode: string) => void;
  updateQty: (itemCode: string, qty: number) => void;
  clear: () => void;
  totalItems: number;
  subtotal: number;
  takeawayPacks: TakeawayPacks;
  setTakeawayPacks: (packs: TakeawayPacks) => void;
  requiredPackCounts: Record<PackKind, number>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "vc_cart";

function emptyCounts(): Record<PackKind, number> {
  return { small: 0, big: 0, drink: 0, palmwine: 0, beer: 0 };
}

function computeRequiredCounts(items: CartItem[]): Record<PackKind, number> {
  const counts = emptyCounts();
  for (const it of items) {
    if (PACK_ITEM_CODES.has(it.item_code)) continue;
    const kind = getPackKindForCategory(it.category);
    if (kind) counts[kind] += it.qty;
  }
  return counts;
}

function applyPackSync(items: CartItem[], packs: TakeawayPacks): CartItem[] {
  const nonPack = items.filter((i) => !PACK_ITEM_CODES.has(i.item_code));
  const required = computeRequiredCounts(nonPack);
  const result: CartItem[] = [...nonPack];

  (Object.keys(required) as PackKind[]).forEach((kind) => {
    const requiredQty = required[kind];
    const pack = packs[kind] as TakeawayPack | null | undefined;
    if (!pack || requiredQty === 0) return;

    const finalQty = requiredQty;

    result.push({
      item_code: pack.item_code,
      item_name: pack.item_name,
      qty: finalQty,
      rate: pack.rate,
      auto_added: true,
    });
  });

  return result;
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

  const [takeawayPacks, setTakeawayPacks] = useState<TakeawayPacks>({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // Re-sync packs whenever pack info loads/changes
  useEffect(() => {
    if (Object.keys(takeawayPacks).length > 0) {
      setItems((prev) => applyPackSync(prev, takeawayPacks));
    }
  }, [takeawayPacks]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item_code === item.item_code);
      let next: CartItem[];
      if (existing) {
        next = prev.map((i) =>
          i.item_code === item.item_code
            ? {
                ...i,
                qty: i.qty + item.qty,
                notes: item.notes || i.notes,
                category: item.category || i.category,
              }
            : i,
        );
      } else {
        next = [...prev, item];
      }
      return applyPackSync(next, takeawayPacks);
    });
  };

  const removeItem = (itemCode: string) => {
    if (PACK_ITEM_CODES.has(itemCode)) return; // cannot remove auto-added packs
    setItems((prev) => applyPackSync(prev.filter((i) => i.item_code !== itemCode), takeawayPacks));
  };

  const updateQty = (itemCode: string, qty: number) => {
    setItems((prev) => {
      // Pack item: cannot drop below required for its kind
      if (PACK_ITEM_CODES.has(itemCode)) {
        const required = computeRequiredCounts(prev.filter((i) => !PACK_ITEM_CODES.has(i.item_code)));
        // Find which pack kind this code maps to
        const kind = (Object.keys(takeawayPacks) as PackKind[]).find(
          (k) => takeawayPacks[k]?.item_code === itemCode,
        );
        const minQty = kind ? required[kind] : 1;
        const clamped = Math.max(qty, minQty);
        if (clamped <= 0) return prev;
        return prev.map((i) => (i.item_code === itemCode ? { ...i, qty: clamped } : i));
      }
      // Other items
      if (qty <= 0) {
        return applyPackSync(prev.filter((i) => i.item_code !== itemCode), takeawayPacks);
      }
      const next = prev.map((i) => (i.item_code === itemCode ? { ...i, qty } : i));
      return applyPackSync(next, takeawayPacks);
    });
  };

  const clear = () => setItems([]);
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.rate * i.qty, 0);
  const requiredPackCounts = useMemo(() => computeRequiredCounts(items), [items]);

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
        takeawayPacks,
        setTakeawayPacks,
        requiredPackCounts,
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
