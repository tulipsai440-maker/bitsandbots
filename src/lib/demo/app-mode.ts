/** True when built with `vite build --mode demo` (.env.demo → VITE_DEMO_MODE=true). */
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

/** Local or deployed demo tenant preview (multi-tenant slug in env). */
export const demoTenantSlug =
  (import.meta.env.VITE_TENANT_SLUG as string | undefined)?.trim() || "";

/** Use bundled AI placeholders instead of production Supabase uploads. */
export function usesDemoPlaceholders(): boolean {
  return isDemoMode || demoTenantSlug.length > 0;
}

export const demoSiteOrigin =
  (import.meta.env.VITE_SITE_ORIGIN as string | undefined)?.replace(/\/$/, "") ||
  "https://bots4life.demo.com";

export const demoSiteName =
  (import.meta.env.VITE_DEMO_SITE_NAME as string | undefined)?.trim() || "Demo Robotics Team";
