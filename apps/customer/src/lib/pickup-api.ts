import { tenant } from "../tenant.generated";

const API_BASE = `${tenant.apiBaseUrl}/api/method`;
const AUTH_HEADER = `token ${tenant.apiToken}`;

export interface PickupBranch {
  name: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface PickPickupBranchResult {
  status: "ok" | "out_of_range" | "error";
  branch?: PickupBranch & { distance_km: number };
  nearest_km?: number;
  message?: string;
}

export interface ListPickupBranchesResult {
  status: "ok" | "error";
  branches: PickupBranch[];
  message?: string;
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

/**
 * Find the closest pickup-eligible branch to the given customer coords.
 * Used by smart-pickup when the customer has entered a delivery address.
 */
export async function pickPickupBranch(
  lat: number,
  lng: number,
): Promise<PickPickupBranchResult> {
  return frappeGet<PickPickupBranchResult>(
    `/fetolsa_api.delivery.pickup.pick_pickup_branch?lat=${lat}&lng=${lng}`,
  );
}

/**
 * List all pickup-eligible branches.
 * Fallback when the customer hasn't entered a delivery address yet.
 */
export async function listPickupBranches(): Promise<ListPickupBranchesResult> {
  return frappeGet<ListPickupBranchesResult>(
    "/fetolsa_api.delivery.pickup.list_pickup_branches",
  );
}