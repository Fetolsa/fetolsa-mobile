export interface MenuItem {
  item_code: string;
  item_name: string;
  description?: string;
  rate: number;
  image?: string;
  category: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface Branch {
  name: string;
  label?: string;
  address?: string;
}

export interface CartItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  notes?: string;
}