/**
 * Maps each food/drink category to the kind of takeaway pack it requires.
 * `null` means no pack.
 *
 * Pack kinds:
 *   - small    (NGN 300) - most foods
 *   - big      (NGN 1,200) - sharing platters and large dishes
 *   - drink    (NGN 200) - cocktails, smoothies, mocktails, milkshakes
 *   - palmwine (NGN 250) - palmwine
 *   - beer     (NGN 200) - bottle deposit charge
 */

export type PackKind = "small" | "big" | "drink" | "palmwine" | "beer";

export const CATEGORY_TO_PACK_KIND: Record<string, PackKind> = {
  // Small pack (most everyday food)
  "Amala and Co": "small",
  "Soups": "small",
  "Special Soups": "small",
  "Pepper Soup": "small",
  "Local Delicacies": "small",
  "Village Chief Locals": "small",
  "Village Chiefs Locals": "small",
  "Main Course": "small",
  "Noodles and Spaghetti": "small",
  "Breakfast": "small",
  "Intercontinental Breakfast": "small",
  "Suya": "small",
  "Sides": "small",
  "Dan Kano": "small",

  // Big pack (sharing / large)
  "Platters": "big",
  "VC Extra Specials": "big",

  // Drink takeaway
  "Smoothies": "drink",
  "Cocktails": "drink",
  "Mocktails": "drink",
  "Milkshakes": "drink",

  // Palmwine
  "Palmwine": "palmwine",

  // Beer bottle charge
  "Beers": "beer",

  // Explicitly NO pack:
  // Grills, Soft Drinks, Champagne, Wine, Non-Alcoholic Wine,
  // Spirits, Tea, Shots and Tots, Cigarettes, Smoke
};

export function getPackKindForCategory(category: string | undefined): PackKind | null {
  if (!category) return null;
  return CATEGORY_TO_PACK_KIND[category] ?? null;
}

// Item codes that auto-add packs use (so cart logic can identify and protect them)
export const PACK_ITEM_CODES = new Set<string>([
  "Takeaway Pack",
  "Takeaway Pack Big",
  "Drink Takeaway",
  "Palmwine Can",
  "Beer Bottle Charge",
]);
