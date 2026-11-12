import type { CartItem, MenuItem } from "../types/menu";

export interface PairingSection {
  section: string;
  items: MenuItem[];
}

/**
 * The "Goes well with your order" sections for a cart: every dish's add-on
 * sections (VC's list per dish group, from the server) merged by section name,
 * without anything already in the cart, each section capped at `perSection`.
 */
export function buildPairingSections(
  cart: CartItem[],
  itemsByCode: Map<string, MenuItem>,
  perSection = 8,
): PairingSection[] {
  const cartCodes = new Set(cart.map((c) => c.item_code));
  const merged = new Map<string, string[]>();
  for (const cartItem of cart) {
    const menuItem = itemsByCode.get(cartItem.item_code);
    if (!menuItem) continue;
    const secs = menuItem.suggested_addons?.length
      ? menuItem.suggested_addons
      : menuItem.paired_drinks?.length
        ? [{ section: 'Drinks', items: menuItem.paired_drinks }]
        : [];
    for (const sec of secs) {
      const list = merged.get(sec.section) || [];
      for (const code of sec.items) if (!cartCodes.has(code) && !list.includes(code)) list.push(code);
      merged.set(sec.section, list);
    }
  }
  return Array.from(merged.entries())
    .map(([section, codes]) => ({
      section,
      items: codes
        .map((code) => itemsByCode.get(code))
        .filter((d): d is MenuItem => Boolean(d))
        .slice(0, perSection),
    }))
    .filter((s) => s.items.length > 0);
}
