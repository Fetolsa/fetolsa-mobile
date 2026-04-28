import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TenantConfigSchema, type TenantConfig } from "./schema.js";

export { TenantConfigSchema };
export type { TenantConfig };

export class TenantNotFoundError extends Error {
  constructor(code: string, path: string) {
    super(`Tenant config not found for "${code}" at ${path}`);
    this.name = "TenantNotFoundError";
  }
}

export class TenantConfigInvalidError extends Error {
  constructor(code: string, issues: string) {
    super(`Tenant config invalid for "${code}":\n${issues}`);
    this.name = "TenantConfigInvalidError";
  }
}

/**
 * Load and validate a tenant config from disk.
 * @param code The tenant code (e.g. "villagechief")
 * @param tenantsDir Absolute path to the tenants directory
 */
export function loadTenant(code: string, tenantsDir: string): TenantConfig {
  const path = join(tenantsDir, code, "config.json");
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch {
    throw new TenantNotFoundError(code, path);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new TenantConfigInvalidError(code, `Not valid JSON: ${(e as Error).message}`);
  }

  const result = TenantConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new TenantConfigInvalidError(code, issues);
  }

  if (result.data.code !== code) {
    throw new TenantConfigInvalidError(
      code,
      `code field "${result.data.code}" does not match folder name "${code}"`,
    );
  }

  return result.data;
}