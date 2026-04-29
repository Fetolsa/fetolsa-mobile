import { tenant } from "../tenant.generated";

const API_BASE = `${tenant.apiBaseUrl}/api/method`;

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  last_address?: string | null;
}

export interface CustomerOrder {
  name: string;
  order_date?: string;
  order_type?: string;
  status?: string;
  payment_status?: string;
  grand_total?: number;
  total?: number;
  items?: Array<{
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
  }>;
}

export interface RequestOtpResult {
  status: "ok" | "error";
  message?: string;
}

export interface VerifyOtpResult {
  status: "ok" | "error";
  token?: string;
  customer_id?: string;
  customer_name?: string;
  phone?: string;
  email?: string;
  message?: string;
}

export interface ProfileResult {
  customer?: CustomerProfile;
  orders?: CustomerOrder[];
}

async function frappePost<T>(path: string, body: URLSearchParams): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.message as T;
}

async function frappeGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.message as T;
}

export async function requestOtp(phone: string): Promise<RequestOtpResult> {
  const params = new URLSearchParams();
  params.append("phone", phone);
  return frappePost<RequestOtpResult>(
    "/fetolsa_api.delivery.auth.request_otp",
    params,
  );
}

export async function verifyOtp(data: {
  phone: string;
  otp: string;
  name?: string;
  email?: string;
}): Promise<VerifyOtpResult> {
  const params = new URLSearchParams();
  params.append("phone", data.phone);
  params.append("otp", data.otp);
  if (data.name) params.append("name", data.name);
  if (data.email) params.append("email", data.email);
  return frappePost<VerifyOtpResult>(
    "/fetolsa_api.delivery.auth.verify_otp_and_register",
    params,
  );
}

export async function getCustomerProfile(token: string): Promise<ProfileResult | null> {
  try {
    return await frappeGet<ProfileResult>(
      `/fetolsa_api.delivery.auth.get_customer_profile?token=${encodeURIComponent(token)}`,
    );
  } catch {
    return null;
  }
}

export async function updateEmail(token: string, email: string): Promise<{ status: string }> {
  const params = new URLSearchParams();
  params.append("token", token);
  params.append("email", email);
  return frappePost<{ status: string }>(
    "/fetolsa_api.delivery.auth.update_profile",
    params,
  );
}

export async function updateLastAddress(
  token: string,
  address: string,
): Promise<{ status: string }> {
  const params = new URLSearchParams();
  params.append("token", token);
  params.append("address", address);
  return frappePost<{ status: string }>(
    "/fetolsa_api.delivery.auth.update_last_address",
    params,
  );
}