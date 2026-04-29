import { tenant } from "../tenant.generated";
import type { CartItem } from "../types/menu";

const API_BASE = `${tenant.apiBaseUrl}/api/method`;
const AUTH_HEADER = `token ${tenant.apiToken}`;

export interface DeliveryFeeResult {
  status: "ok" | "error";
  fee: number;
  distance_km: number | null;
  duration: string;
  formatted_address: string;
}

export interface PlaceOrderRequest {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  delivery_notes?: string;
  branch: string;
  items: CartItem[];
  delivery_fee: number;
  order_type: "Delivery" | "Pickup";
}

export interface PlaceOrderResult {
  status: "ok" | "error";
  payment_url?: string;
  order_id?: string;
  name?: string;
  message?: string;
  error?: string;
}

export interface OrderStatusResult {
  order_id: string;
  status: string;
  order_status?: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  delivery_fee?: number;
  processing_fee?: number;
  delivery_address: string;
  rider_name?: string;
  rider_phone?: string;
  customer_name?: string;
  payment_status?: string;
  order_type?: string;
}

async function frappeGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: { Authorization: AUTH_HEADER },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  return json.message as T;
}

async function frappePost<T>(path: string, body: URLSearchParams): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: AUTH_HEADER,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();
  return json.message as T;
}

export async function calculateDeliveryFee(
  address: string,
  branch: string,
): Promise<DeliveryFeeResult> {
  return frappeGet<DeliveryFeeResult>(
    `/fetolsa_api.delivery.geo.calculate_delivery_fee?address=${encodeURIComponent(
      address,
    )}&branch=${encodeURIComponent(branch)}`,
  );
}

export async function placeOrder(req: PlaceOrderRequest): Promise<PlaceOrderResult> {
  const params = new URLSearchParams();
  params.append("customer_name", req.customer_name);
  params.append("customer_phone", req.customer_phone);
  if (req.customer_email) params.append("customer_email", req.customer_email);
  params.append("delivery_address", req.delivery_address);
  params.append("delivery_notes", req.delivery_notes || "");
  params.append("branch", req.branch);
  params.append("items", JSON.stringify(req.items));
  params.append("delivery_fee", String(req.delivery_fee));
  params.append("order_type", req.order_type);

  return frappePost<PlaceOrderResult>(
    "/fetolsa_api.delivery.orders.place_delivery_order",
    params,
  );
}

export async function getOrderStatus(orderId: string): Promise<OrderStatusResult> {
  const result = await frappeGet<{ order?: OrderStatusResult } | OrderStatusResult>(
    `/fetolsa_api.delivery.orders.get_order_status?order_id=${encodeURIComponent(orderId)}`,
  );
  return ((result as { order?: OrderStatusResult }).order || result) as OrderStatusResult;
}
export type OrderStatusStep =
  | "confirmed"
  | "preparing"
  | "rider_assigned"
  | "picked_up"
  | "delivered"
  | "cancelled"
  | "pending";

export function statusToStep(status: string | undefined): OrderStatusStep {
  const s = (status || "").toLowerCase();
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("delivered")) return "delivered";
  if (s.includes("picked") || s.includes("out for delivery")) return "picked_up";
  if (s.includes("rider") || s.includes("assigned")) return "rider_assigned";
  if (s.includes("preparing")) return "preparing";
  if (s.includes("confirmed") || s.includes("paid")) return "confirmed";
  return "pending";
}

export function formatNaira(amount: number | undefined): string {
  return `\u20A6${(amount ?? 0).toLocaleString()}`;
}