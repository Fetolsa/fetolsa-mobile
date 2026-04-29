import type { MenuCategory, MenuItem } from "../types/menu";

export interface SearchResult {
  type: "item" | "category";
  item?: MenuItem;
  category?: string;
  score: number;
}

// Match scoring:
//  10 = exact item name match
//   8 = item name starts with query
//   6 = item name contains query
//   4 = description contains query
//   3 = category name contains query (returned as category result)
function scoreItem(item: MenuItem, query: string): number {
  const q = query.toLowerCase();
  const name = item.item_name.toLowerCase();
  const desc = (item.description || "").toLowerCase();

  if (name === q) return 10;
  if (name.startsWith(q)) return 8;
  if (name.includes(q)) return 6;
  if (desc.includes(q)) return 4;
  return 0;
}

export function searchMenu(
  categories: MenuCategory[],
  query: string,
  maxResults = 30,
): SearchResult[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const results: SearchResult[] = [];

  // Category matches first (helps users jump to a category quickly)
  for (const cat of categories) {
    if (cat.name.toLowerCase().includes(trimmed)) {
      results.push({ type: "category", category: cat.name, score: 3 });
    }
  }

  // Item matches
  for (const cat of categories) {
    for (const item of cat.items) {
      const score = scoreItem(item, trimmed);
      if (score > 0) {
        results.push({ type: "item", item, score });
      }
    }
  }

  // Sort by score desc, then item name alphabetical for stable tie-breaking
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aName = a.type === "item" ? a.item!.item_name : a.category!;
    const bName = b.type === "item" ? b.item!.item_name : b.category!;
    return aName.localeCompare(bName);
  });

  return results.slice(0, maxResults);
}