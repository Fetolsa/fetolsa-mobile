import { tenant } from "../tenant.generated";
import type { MenuItem, MenuCategory, Branch } from "../types/menu";

const API_BASE = `${tenant.apiBaseUrl}/api/method`;
const AUTH_HEADER = `token ${tenant.apiToken}`;

async function frappeGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: { Authorization: AUTH_HEADER },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  return json.message as T;
}

interface RawMenuItem {
  item_code?: string;
  name?: string;
  item_name?: string;
  description?: string;
  rate?: number;
  price?: number;
  image?: string;
  item_group?: string;
  category?: string;
  paired_drinks?: string[];
}

interface RawMenuResponse {
  menu?: Record<string, RawMenuItem[]> | RawMenuItem[];
  categories?: string[];
  total_items?: number;
}

function normalizeItem(raw: RawMenuItem, fallbackCategory: string): MenuItem {
  return {
    item_code: raw.item_code || raw.name || "",
    item_name: raw.item_name || raw.name || "",
    description: raw.description,
    rate: raw.rate || raw.price || 0,
    image: raw.image,
    category: raw.item_group || raw.category || fallbackCategory,
    paired_drinks: Array.isArray(raw.paired_drinks) ? raw.paired_drinks : [],
  };
}

export async function fetchMenu(): Promise<MenuCategory[]> {
  const data = await frappeGet<RawMenuResponse | RawMenuItem[]>(
    "/fetolsa_api.delivery.menu.get_delivery_menu",
  );
  const cats: MenuCategory[] = [];
  const menuData = (data as RawMenuResponse)?.menu ?? data;
  if (menuData && typeof menuData === "object" && !Array.isArray(menuData)) {
    for (const [name, items] of Object.entries(menuData)) {
      if (Array.isArray(items)) {
        cats.push({
          name,
          items: items.map((i) => normalizeItem(i, name)),
        });
      }
    }
  } else if (Array.isArray(menuData)) {
    const catMap = new Map<string, MenuCategory>();
    for (const raw of menuData) {
      const cat = raw.item_group || raw.category || "Uncategorized";
      if (!catMap.has(cat)) {
        const newCat = { name: cat, items: [] as MenuItem[] };
        catMap.set(cat, newCat);
        cats.push(newCat);
      }
      catMap.get(cat)!.items.push(normalizeItem(raw, cat));
    }
  }
  return cats;
}

export async function fetchBranches(): Promise<Branch[]> {
  const data = await frappeGet<{ branches?: Branch[] } | Branch[] | string[]>(
    "/fetolsa_api.delivery.menu.get_branches",
  );
  const list = Array.isArray(data)
    ? data
    : (data as { branches?: Branch[] })?.branches ?? [];
  const mapped: Branch[] = list.map((b) =>
    typeof b === "string" ? { name: b, label: b } : b,
  );
  return [...mapped].sort((a, b) => {
    if (a.name === "VC Online") return -1;
    if (b.name === "VC Online") return 1;
    return a.name.localeCompare(b.name);
  });
}

export interface TakeawayPack {
  item_code: string;
  item_name: string;
  rate: number;
  image?: string;
}

export type PackKind = "small" | "big" | "drink" | "palmwine" | "beer";

export type TakeawayPacks = Partial<Record<PackKind, TakeawayPack | null>>;

export async function fetchTakeawayPacks(): Promise<TakeawayPacks> {
  try {
    const data = await frappeGet<{ status: string; packs: TakeawayPacks }>(
      "/fetolsa_api.delivery.menu.get_takeaway_packs",
    );
    return data?.packs ?? {};
  } catch {
    return {};
  }
}
