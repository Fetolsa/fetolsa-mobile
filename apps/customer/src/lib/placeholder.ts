// Generates a stable, pastel background color from any string (item name).
// Same input always returns the same color, so a given item has a consistent
// placeholder across renders.
const PALETTE = [
  "#F4D5C0", // peach
  "#E8DCC4", // sand
  "#D9E4D4", // sage
  "#D4E1E8", // mist
  "#E0D5E8", // lavender
  "#F0CFC9", // blush
  "#D6E0CD", // moss
  "#EAD9C5", // wheat
  "#D5DCE6", // slate
  "#EBD3D7", // rose
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function placeholderColor(seed: string): string {
  return PALETTE[hashString(seed) % PALETTE.length];
}

export function placeholderInitial(name: string): string {
  const trimmed = (name || "?").trim();
  return trimmed.charAt(0).toUpperCase();
}

// Category-keyed placeholder photos. Used when item.image is empty.
// Falls through to colored letter tile if category is not mapped.
import breakfastImg from "../assets/placeholders/breakfast.jpg";
import breakfastTrayImg from "../assets/placeholders/breakfast-tray.jpg";
import burgerImg from "../assets/placeholders/burger.jpg";
import chickenGrillImg from "../assets/placeholders/chicken-grill.jpg";
import egusiSoupImg from "../assets/placeholders/egusi-soup.jpg";
import jollofRiceImg from "../assets/placeholders/jollof-rice.jpg";
import masaDanKanoImg from "../assets/placeholders/masa-dan-kano.jpg";
import palmwineImg from "../assets/placeholders/palmwine.jpg";
import pepperSoupImg from "../assets/placeholders/pepper-soup.jpg";
import platterImg from "../assets/placeholders/platter.jpg";
import sidesPotatoImg from "../assets/placeholders/sides-potato.jpg";
import stewImg from "../assets/placeholders/stew.jpg";
import suyaImg from "../assets/placeholders/suya.jpg";
import vegetableSoupImg from "../assets/placeholders/vegetable-soup.jpg";

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  // Breakfast
  "Breakfast": breakfastImg,
  "Intercontinental Breakfast": breakfastTrayImg,

  // Soups
  "Soups": egusiSoupImg,
  "Special Soups": vegetableSoupImg,
  "Pepper Soup": pepperSoupImg,

  // Mains
  "Amala and Co": stewImg,
  "Local Delicacies": stewImg,
  "Village Chief Locals": stewImg,
  "Village Chiefs Locals": stewImg,
  "Main Course": jollofRiceImg,
  "Noodles and Spaghetti": jollofRiceImg,

  // Grills + Suya
  "Grills": chickenGrillImg,
  "Suya": suyaImg,

  // Specials & sharing
  "Platters": platterImg,
  "VC Extra Specials": platterImg,
  "Dan Kano": masaDanKanoImg,

  // Sides
  "Sides": sidesPotatoImg,

  // Drinks (mostly fall through to letter tile, but these have decent matches)
  "Palmwine": palmwineImg,
};

// Items whose names contain these keywords get a specific override regardless of category
const NAME_KEYWORD_PLACEHOLDERS: Array<{ pattern: RegExp; image: string }> = [
  { pattern: /\bburger\b/i, image: burgerImg },
  { pattern: /\bjollof\b/i, image: jollofRiceImg },
  { pattern: /\bsuya\b/i, image: suyaImg },
  { pattern: /\bcatfish\b/i, image: pepperSoupImg },
  { pattern: /\bplantain\b/i, image: sidesPotatoImg },
  { pattern: /\bpotato\b/i, image: sidesPotatoImg },
];

export function placeholderImage(itemName: string, category: string | undefined): string | null {
  // 1. Name-keyword override wins
  for (const { pattern, image } of NAME_KEYWORD_PLACEHOLDERS) {
    if (pattern.test(itemName)) return image;
  }
  // 2. Category map
  if (category && CATEGORY_PLACEHOLDERS[category]) {
    return CATEGORY_PLACEHOLDERS[category];
  }
  // 3. Nothing matched
  return null;
}

// Resolves an absolute image URL from a Frappe `image` field value.
// - Absolute http(s) URLs pass through
// - Site-relative paths (starting with /) get prepended with the site base
// - Empty/null returns null (caller should render placeholder)
export function resolveImageUrl(image: string | null | undefined, siteBase: string): string | null {
  if (!image) return null;
  const trimmed = image.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${siteBase.replace(/\/$/, "")}${trimmed}`;
  }
  return `${siteBase.replace(/\/$/, "")}/${trimmed}`;
}
