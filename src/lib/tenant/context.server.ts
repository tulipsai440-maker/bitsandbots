import { AsyncLocalStorage } from "node:async_hooks";

import type { TenantContext } from "@/lib/tenant/types";

const storage = new AsyncLocalStorage<TenantContext>();

export function runWithTenantContext<T>(ctx: TenantContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getTenantContext(): TenantContext | undefined {
  return storage.getStore();
}

export function getTenantId(): string | undefined {
  return getTenantContext()?.tenantId;
}

export function requireTenantId(): string {
  const id = getTenantId();
  if (id) return id;
  throw new Error("Tenant context is not set for this request.");
}

export function isDemoTenantOnServer(): boolean {
  return getTenantContext()?.status === "demo";
}
