import { usesDemoPlaceholders } from "@/lib/demo/app-mode";

/** Client-safe — true for demo builds and local demo tenant preview. */
export function isDemoTenant(): boolean {
  return usesDemoPlaceholders();
}

/** Client-safe stub; SSR loaders use context.server.ts for the real tenant id. */
export function getTenantId(): string | undefined {
  return undefined;
}

export function getTenantContext(): undefined {
  return undefined;
}
