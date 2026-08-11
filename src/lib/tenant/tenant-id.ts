import { resolveTenantIdForFetch } from "@/lib/tenant/resolve";
import { BITSANDBOTS_TENANT_ID } from "@/lib/tenant/types";

/**
 * Tenant id for Supabase queries. Prefer resolved host/slug; fall back to Bits & Bots
 * production tenant so fllbots.com never reads demo rows.
 */
export async function tenantIdForQuery(): Promise<string> {
  return (await resolveTenantIdForFetch()) ?? BITSANDBOTS_TENANT_ID;
}

export { BITSANDBOTS_TENANT_ID };
