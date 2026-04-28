import type { TenantConfig } from "@fetolsa/tenant-loader";

/**
 * Apply tenant theme to CSS custom properties on :root.
 * Called once at app boot from main.tsx.
 */
export function applyTenantTheme(theme: TenantConfig["theme"]): void {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.primary);
  root.style.setProperty("--color-primary-foreground", theme.primaryForeground);
  root.style.setProperty("--color-secondary", theme.secondary);
  root.style.setProperty("--color-background", theme.background);
  root.style.setProperty("--color-foreground", theme.foreground);
  root.style.setProperty("--color-accent", theme.accent);
  root.style.setProperty("--radius", theme.radius);

  // Also update the meta theme-color tag for browser/PWA chrome
  const meta = document.querySelector("meta[name=\"theme-color\"]");
  if (meta) meta.setAttribute("content", theme.primary);
}