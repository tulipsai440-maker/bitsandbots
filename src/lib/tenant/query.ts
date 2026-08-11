import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/** Append `.eq('tenant_id', …)` when tenant context is set (SSR only). */
export function withTenantFilter<
  Schema extends Record<string, unknown>,
  Row extends Record<string, unknown>,
  Result,
  RelationName extends string,
  Relationships,
>(
  query: PostgrestFilterBuilder<Schema, Row, Result, RelationName, Relationships>,
  tenantId?: string,
): PostgrestFilterBuilder<Schema, Row, Result, RelationName, Relationships> {
  if (!tenantId) return query;
  return query.eq("tenant_id" as never, tenantId as never);
}
