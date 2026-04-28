import { z } from "zod";
const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const TENANT_CODE = /^[a-z0-9]+$/;
const BUNDLE_ID = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const URL_HTTPS = /^https:\/\/.+/;
const PAYSTACK_PUBLIC = /^pk_(test|live)_[A-Za-z0-9]+$/;
const DEEP_LINK_SCHEME = /^[a-z][a-z0-9]*:\/\/$/;
const HexColor = z.string().regex(HEX_COLOR, "Must be a valid hex color (#RGB, #RRGGBB, or #RRGGBBAA)");
const AppMetadata = z.object({
  bundleId: z.string().regex(BUNDLE_ID, "Must be reverse-domain format (e.g. app.oyasync.fetolsa.villagechief.customer)"),
  appName: z.string().min(1).max(30, "Play Store hard limit"),
  versionName: z.string().regex(SEMVER, "Must be semver (e.g. 1.0.0)"),
  versionCode: z.number().int().positive(),
});
const Theme = z.object({
  primary: HexColor,
  primaryForeground: HexColor,
  secondary: HexColor,
  background: HexColor,
  foreground: HexColor,
  accent: HexColor,
  radius: z.string().regex(/^\d+(\.\d+)?(rem|px)$/, "Must be a CSS length like 0.5rem or 8px"),
});
const Assets = z.object({
  iconPath: z.string().min(1),
  splashPath: z.string().min(1),
  adaptiveIconForeground: z.string().min(1),
  adaptiveIconBackground: z.string().min(1),
});
const Push = z.object({
  fcmProjectId: z.string().min(1),
  googleServicesPath: z.string().min(1),
  apnsTeamId: z.string().optional(),
});
const Features = z.object({
  delivery: z.boolean(),
  pickup: z.boolean(),
  rooms: z.boolean(),
  aiUpsell: z.boolean(),
  rating: z.boolean(),
  referral: z.boolean(),
});
const Listing = z.object({
  supportEmail: z.string().email(),
  privacyUrl: z.string().regex(URL_HTTPS),
  termsUrl: z.string().regex(URL_HTTPS),
  websiteUrl: z.string().regex(URL_HTTPS),
});
const Payment = z.object({
  paystackPublicKey: z.string().regex(PAYSTACK_PUBLIC, "Must be a Paystack public key (pk_test_* or pk_live_*)"),
  currency: z.string().length(3, "ISO 4217 currency code (e.g. NGN)"),
  deepLinkScheme: z.string().regex(DEEP_LINK_SCHEME, "Must be a URL scheme like vchief://"),
});
const Contact = z.object({
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
});
const LaunchMode = z.enum(["waitlist", "live"]);

export const TenantConfigSchema = z.object({
  code: z.string().regex(TENANT_CODE, "Lowercase alphanumeric only"),
  displayName: z.string().min(1),
  shortName: z.string().min(1).max(30),
  apiBaseUrl: z.string().regex(URL_HTTPS),
  launchMode: LaunchMode.optional().default("waitlist"),
  customer: AppMetadata,
  rider: AppMetadata,
  theme: Theme,
  assets: Assets,
  push: Push,
  features: Features,
  listing: Listing,
  payment: Payment,
  contact: Contact,
}).strict();
export type TenantConfig = z.infer<typeof TenantConfigSchema>;

// Runtime config = TenantConfig + fields injected at build-time from .env
// Used in apps/customer/src/tenant.generated.ts
export interface RuntimeTenantConfig extends TenantConfig {
  apiToken: string;
}