import { usesDemoPlaceholders } from "@/lib/demo/app-mode";

let clientTenantStatus: "demo" | "live" | null = null;

/** Set from root loader (SSR) or hostname resolve (client). */
export function setClientTenantStatus(status: "demo" | "live" | null): void {
  clientTenantStatus = status;
}

export function getClientTenantStatus(): "demo" | "live" | null {
  return clientTenantStatus;
}

/** Client-safe — demo build, slug env, or resolved demo tenant hostname. */
export function isDemoTenant(): boolean {
  return usesDemoPlaceholders() || clientTenantStatus === "demo";
}

/** Client-safe stub; SSR loaders use context.server.ts for the real tenant id. */
export function getTenantId(): string | undefined {
  return undefined;
}

export function getTenantContext(): undefined {
  return undefined;
}
