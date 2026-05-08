/**
 * Categories that require a takeaway pack auto-added to cart.
 * Pack quantity = sum of qty of items in these categories.
 *
 * Categories explicitly EXCLUDED:
 *   Grills (eaten on the spot, separate packaging logic)
 *   All drink categories (Soft Drinks, Beers, Champagne, etc.)
 *   Cigarettes, Smoke
 */
export const TAKEAWAY_PACK_CATEGORIES = new Set<string>([
  "Amala and Co",
  "Soups",
  "Special Soups",
  "Pepper Soup",
  "Local Delicacies",
  "Village Chief Locals",
  "Village Chiefs Locals",
  "Main Course",
  "Noodles and Spaghetti",
  "Breakfast",
  "Intercontinental Breakfast",
  "Platters",
  "Dan Kano",
  "Suya",
  "VC Extra Specials",
  "Sides",
]);

export const TAKEAWAY_PACK_ITEM_CODE = "Takeaway Pack";

export function isTakeawayCategory(category: string | undefined): boolean {
  if (!category) return false;
  return TAKEAWAY_PACK_CATEGORIES.has(category);
}
