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