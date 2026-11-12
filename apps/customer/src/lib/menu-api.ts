import { tenant } from "../tenant.generated";
import type { MenuItem, MenuCategory, Branch } from "../types/menu";

const API_BASE = `${tenant.apiBaseUrl}/api/method`;
// Every endpoint the app calls is a guest endpoint: no API key ships in the app.

async function frappeGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
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
  suggested_addons?: { section: string; items: string[] }[];
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
    suggested_addons: Array.isArray(raw.suggested_addons) ? raw.suggested_addons : [],
  };
}

export async function fetchMenu(): Promise<MenuCategory[]> {
  const [data, packs] = await Promise.all([
    frappeGet<RawMenuResponse | RawMenuItem[]>("/fetolsa_api.delivery.menu.get_delivery_menu"),
    fetchTakeawayPacks(),
  ]);
  // The packs the server adds at checkout are not for sale on their own in the app.
  const serverPackCodes = new Set(
    Object.values(packs).filter((p): p is TakeawayPack => Boolean(p)).map((p) => p.item_code),
  );
  const cats: MenuCategory[] = [];
  const menuData = (data as RawMenuResponse)?.menu ?? data;
  if (menuData && typeof menuData === "object" && !Array.isArray(menuData)) {
    for (const [name, items] of Object.entries(menuData)) {
      if (Array.isArray(items)) {
        cats.push({
          name,
          items: items.map((i) => normalizeItem(i, name)).filter((i) => !serverPackCodes.has(i.item_code)),
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
      const item = normalizeItem(raw, cat);
      if (!serverPackCodes.has(item.item_code)) catMap.get(cat)!.items.push(item);
    }
  }
  return cats.filter((c) => c.items.length > 0);
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

// Homepage settings VC changes without an app release (server WEB_HOME_V1).
export interface HomeConfig {
  highlights: MenuItem[];
  combos: MenuItem[];
}

export async function fetchHomeConfig(): Promise<HomeConfig> {
  try {
    const m = await frappeGet<{ highlights?: RawMenuItem[]; combos?: RawMenuItem[] }>(
      "/fetolsa_api.delivery.web_home.get_home_config",
    );
    return {
      highlights: (m?.highlights || []).map((i) => normalizeItem(i, "")),
      combos: (m?.combos || []).map((i) => normalizeItem(i, "Combos")),
    };
  } catch {
    return { highlights: [], combos: [] };
  }
}
