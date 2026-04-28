import { describe, it, expect } from "vitest";
import { TenantConfigSchema } from "./schema.js";

const validConfig = {
  code: "villagechief",
  displayName: "Village Chief",
  shortName: "Village Chief",
  apiBaseUrl: "https://villagechief.fetolsa.app",
  customer: {
    bundleId: "app.oyasync.fetolsa.villagechief.customer",
    appName: "Village Chief",
    versionName: "1.0.0",
    versionCode: 1,
  },
  rider: {
    bundleId: "app.oyasync.fetolsa.villagechief.rider",
    appName: "Village Chief Rider",
    versionName: "1.0.0",
    versionCode: 1,
  },
  theme: {
    primary: "#E60012",
    primaryForeground: "#FFFFFF",
    secondary: "#0A0A0A",
    background: "#FFFFFF",
    foreground: "#0A0A0A",
    accent: "#F5F5F5",
    radius: "0.5rem",
  },
  assets: {
    iconPath: "tenants/villagechief/assets/icon.png",
    splashPath: "tenants/villagechief/assets/splash.png",
    adaptiveIconForeground: "tenants/villagechief/assets/adaptive-fg.png",
    adaptiveIconBackground: "tenants/villagechief/assets/adaptive-bg.png",
  },
  push: {
    fcmProjectId: "vc-fetolsa-prod",
    googleServicesPath: "tenants/villagechief/google-services.json",
  },
  features: {
    delivery: true,
    pickup: true,
    rooms: false,
    aiUpsell: true,
    rating: true,
    referral: false,
  },
  listing: {
    supportEmail: "support@fetolsa.app",
    privacyUrl: "https://villagechief.fetolsa.app/privacy",
    termsUrl: "https://villagechief.fetolsa.app/terms",
    websiteUrl: "https://villagechiefrestaurant.com",
  },
  payment: {
    paystackPublicKey: "pk_live_abc123",
    currency: "NGN",
    deepLinkScheme: "vchief://",
  },
  contact: {
    phone: "+234 805 215 0719",
    address: "2 Matambella Garden, Wuse 2, FCT, Nigeria",
  },
};

describe("TenantConfigSchema", () => {
  it("accepts a valid config", () => {
    expect(TenantConfigSchema.parse(validConfig)).toEqual(validConfig);
  });

  it("rejects an invalid bundle ID", () => {
    const bad = { ...validConfig, customer: { ...validConfig.customer, bundleId: "BadBundleID" } };
    expect(() => TenantConfigSchema.parse(bad)).toThrow();
  });

  it("rejects a non-https apiBaseUrl", () => {
    const bad = { ...validConfig, apiBaseUrl: "http://insecure.example.com" };
    expect(() => TenantConfigSchema.parse(bad)).toThrow();
  });

  it("rejects a non-hex theme color", () => {
    const bad = { ...validConfig, theme: { ...validConfig.theme, primary: "red" } };
    expect(() => TenantConfigSchema.parse(bad)).toThrow();
  });

  it("rejects an invalid Paystack key", () => {
    const bad = { ...validConfig, payment: { ...validConfig.payment, paystackPublicKey: "sk_live_secret" } };
    expect(() => TenantConfigSchema.parse(bad)).toThrow();
  });

  it("rejects an invalid semver", () => {
    const bad = { ...validConfig, customer: { ...validConfig.customer, versionName: "1.0" } };
    expect(() => TenantConfigSchema.parse(bad)).toThrow();
  });

  it("rejects unknown top-level fields (strict)", () => {
    const bad = { ...validConfig, unknownField: "oops" };
    expect(() => TenantConfigSchema.parse(bad)).toThrow();
  });

  it("rejects shortName longer than 30 chars", () => {
    const bad = { ...validConfig, shortName: "a".repeat(31) };
    expect(() => TenantConfigSchema.parse(bad)).toThrow();
  });
});