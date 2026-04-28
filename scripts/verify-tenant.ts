#!/usr/bin/env node
/**
 * CLI to validate a tenant config against the schema.
 * Usage:
 *   tsx scripts/verify-tenant.ts <tenant-code>
 *   tsx scripts/verify-tenant.ts --all
 */
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTenant, TenantNotFoundError, TenantConfigInvalidError } from "@fetolsa/tenant-loader";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const TENANTS_DIR = join(REPO_ROOT, "tenants");

function listTenants(): string[] {
  return readdirSync(TENANTS_DIR).filter((name) => {
    try {
      return statSync(join(TENANTS_DIR, name)).isDirectory();
    } catch {
      return false;
    }
  });
}

function verifyOne(code: string): boolean {
  try {
    const config = loadTenant(code, TENANTS_DIR);
    console.log(`OK  ${code} (${config.displayName}) - bundle=${config.customer.bundleId}`);
    return true;
  } catch (e) {
    if (e instanceof TenantNotFoundError || e instanceof TenantConfigInvalidError) {
      console.error(`FAIL  ${code}`);
      console.error(`  ${e.message}`);
    } else {
      console.error(`FAIL  ${code}`);
      console.error(`  ${(e as Error).message}`);
    }
    return false;
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: verify-tenant.ts <tenant-code> | --all");
  process.exit(1);
}

const targets = args[0] === "--all" ? listTenants() : [args[0]];
let allPass = true;
for (const code of targets) {
  if (!verifyOne(code)) allPass = false;
}

process.exit(allPass ? 0 : 1);