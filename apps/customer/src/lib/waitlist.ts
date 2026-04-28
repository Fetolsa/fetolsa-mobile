import { tenant } from "../tenant.generated";

export interface WaitlistSubmission {
  phone: string;
  name?: string;
  email?: string;
  consent: boolean;
}

export type WaitlistError =
  | "phone_required"
  | "phone_invalid"
  | "email_invalid"
  | "rate_limited"
  | "network_error"
  | "server_error";

export interface WaitlistResult {
  success: boolean;
  error?: WaitlistError;
}

const API_BASE = import.meta.env.DEV ? "" : tenant.apiBaseUrl;
const ENDPOINT = `${API_BASE}/api/method/fetolsa_api.marketing.api.waitlist.signup`;

export async function submitWaitlist(data: WaitlistSubmission): Promise<WaitlistResult> {
  const body = new URLSearchParams();
  body.append("phone", data.phone);
  if (data.name) body.append("name", data.name);
  if (data.email) body.append("email", data.email);
  body.append("consent", data.consent ? "true" : "false");
  body.append("source", "coming_soon_screen");

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      return { success: false, error: "server_error" };
    }

    const payload = json?.message;
    if (res.ok && payload?.success === true) {
      return { success: true };
    }

    const code = payload?.error as WaitlistError | undefined;
    if (code) return { success: false, error: code };
    return { success: false, error: "server_error" };
  } catch {
    return { success: false, error: "network_error" };
  }
}

const PHONE_RE = /^\+\d{10,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePhone(phone: string): boolean {
  return PHONE_RE.test(phone.replace(/\s|-/g, ""));
}

export function validateEmail(email: string): boolean {
  return email === "" || EMAIL_RE.test(email);
}

export function normalizePhone(local: string, countryCode: string): string {
  const digits = local.replace(/\D/g, "").replace(/^0+/, "");
  return `${countryCode}${digits}`;
}