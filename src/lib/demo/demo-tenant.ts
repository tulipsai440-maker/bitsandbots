import { usesDemoPlaceholders } from "@/lib/demo/app-mode";
import { getClientTenantStatus, isDemoTenant, setClientTenantStatus } from "@/lib/tenant/context";

/** True for demo builds, local slug preview, and live demo tenants ({slug}-demo.fllbots.com). */
export async function shouldUseDemoAssets(): Promise<boolean> {
  if (usesDemoPlaceholders()) return true;

  if (import.meta.env.SSR) {
    const { isDemoTenantOnServer } = await import("@/lib/tenant/context.server");
    return isDemoTenantOnServer();
  }

  if (typeof window !== "undefined") {
    const cached = getClientTenantStatus();
    if (cached === "demo") return true;
    if (cached === "live") return false;

    const { resolveTenantFromHost } = await import("@/lib/tenant/resolve");
    const ctx = await resolveTenantFromHost(window.location.host);
    setClientTenantStatus(ctx.status);
    return ctx.status === "demo";
  }

  return isDemoTenant();
}
