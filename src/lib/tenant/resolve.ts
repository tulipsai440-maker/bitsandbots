import { supabase } from "@/integrations/supabase/client";

import {
  BITSANDBOTS_TENANT_ID,
  PLAY_DOMAIN_SUFFIX,
  slugFromPlatformDemoHostname,
  type TenantContext,
  type TenantStatus,
} from "@/lib/tenant/types";

const DEFAULT_PLAY_BASE = "play.fllbots.com";

function stripPort(host: string): string {
  return host.split(":")[0]?.toLowerCase().trim() ?? "";
}

function buildSiteOrigin(hostname: string, protocol = "https"): string {
  const h = stripPort(hostname);
  if (h === "localhost" || h.endsWith(".localhost")) {
    return `http://${hostname}`;
  }
  return `${protocol}://${h}`;
}

function slugFromLegacyPlaySubdomain(hostname: string): string | null {
  const h = stripPort(hostname);
  if (!h.endsWith(PLAY_DOMAIN_SUFFIX) && h !== DEFAULT_PLAY_BASE) {
    if (h.endsWith(".localhost") && h.includes(".")) {
      const part = h.replace(".localhost", "").split(".")[0];
      return part && part !== "play" && part !== "demo" ? part : null;
    }
    return null;
  }
  const sub = h.slice(0, -PLAY_DOMAIN_SUFFIX.length);
  if (!sub || sub.includes(".")) return null;
  return sub;
}

function slugFromDemoHostname(hostname: string): string | null {
  const h = stripPort(hostname);
  const fromPlatform = slugFromPlatformDemoHostname(h);
  if (fromPlatform) return fromPlatform;
  if (h.endsWith(".localhost") && h.includes(".")) {
    const part = h.split(".")[0];
    return part && part !== "demo" ? part : null;
  }
  if (h === DEFAULT_PLAY_BASE) return null;
  return null;
}

function parseTenantRpc(data: unknown, hostname: string): TenantContext | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const tenantId = row.tenant_id;
  const slug = row.slug;
  if (typeof tenantId !== "string" || typeof slug !== "string") return null;
  const displayName =
    typeof row.display_name === "string" ? row.display_name : slug;
  const status: TenantStatus = row.status === "live" ? "live" : "demo";
  const h = stripPort(hostname);
  return {
    tenantId,
    slug,
    displayName,
    status,
    hostname: h,
    siteOrigin: buildSiteOrigin(hostname),
  };
}

async function lookupByHostname(hostname: string): Promise<TenantContext | null> {
  const h = stripPort(hostname);
  if (!h) return null;

  const { data, error } = await supabase.rpc("resolve_tenant", { p_hostname: h });
  if (!error && data) {
    const ctx = parseTenantRpc(data, h);
    if (ctx) return ctx;
  }

  const slug = slugFromDemoHostname(h) ?? slugFromLegacyPlaySubdomain(h);
  if (slug) {
    const { data: bySlug, error: slugError } = await supabase.rpc("resolve_tenant_by_slug", {
      p_slug: slug,
    });
    if (!slugError && bySlug) {
      const ctx = parseTenantRpc(bySlug, h);
      if (ctx) {
        return { ...ctx, hostname: h, siteOrigin: buildSiteOrigin(h) };
      }
    }
  }

  return null;
}

async function envFallbackTenant(hostname: string): Promise<TenantContext | null> {
  const slug =
    (import.meta.env.VITE_TENANT_SLUG as string | undefined)?.trim() ||
    (import.meta.env.VITE_DEMO_SITE_SLUG as string | undefined)?.trim();

  if (!slug) return null;

  try {
    const { data, error } = await supabase.rpc("resolve_tenant_by_slug", { p_slug: slug });
    if (!error && data) {
      const ctx = parseTenantRpc(data, hostname);
      if (ctx) {
        return {
          ...ctx,
          siteOrigin: buildSiteOrigin(hostname || "localhost:8080", "http"),
        };
      }
    }
  } catch {
    /* tables not migrated */
  }

  return null;
}

function localhostDefault(hostname: string): TenantContext {
  const h = stripPort(hostname);
  return {
    tenantId: BITSANDBOTS_TENANT_ID,
    slug: "bitsandbots",
    displayName: "Bits & Bots",
    status: "live",
    hostname: h || "localhost",
    siteOrigin: buildSiteOrigin(hostname || "localhost:8080", "http"),
  };
}

/**
 * Resolve tenant from Host header (Worker / SSR).
 * Falls back to Bits & Bots on localhost until multi-tenant SQL + domains exist.
 */
export async function resolveTenantFromHost(hostname: string): Promise<TenantContext> {
  const envFallback = await envFallbackTenant(hostname);
  if (envFallback) return envFallback;

  try {
    const found = await lookupByHostname(hostname);
    if (found) return found;
  } catch {
    // RPC/tables not migrated yet — fall through
  }

  const h = stripPort(hostname);
  if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost")) {
    return localhostDefault(hostname);
  }

  // Unknown custom domain — default to production tenant (safe for fllbots.com migration window)
  return {
    tenantId: BITSANDBOTS_TENANT_ID,
    slug: "bitsandbots",
    displayName: "Bits & Bots",
    status: "live",
    hostname: h,
    siteOrigin: buildSiteOrigin(hostname),
  };
}

/** Resolve tenant id for client + SSR data fetches (assignments roster, team list, etc.). */
export async function resolveTenantIdForFetch(): Promise<string | undefined> {
  if (import.meta.env.SSR) {
    const { getTenantId } = await import("@/lib/tenant/context.server");
    const id = getTenantId();
    if (id) return id;
  }

  const slug =
    (import.meta.env.VITE_TENANT_SLUG as string | undefined)?.trim() ||
    (import.meta.env.VITE_DEMO_SITE_SLUG as string | undefined)?.trim();
  if (slug) {
    try {
      const { data, error } = await supabase.rpc("resolve_tenant_by_slug", { p_slug: slug });
      if (!error && data) {
        const ctx = parseTenantRpc(data, "localhost");
        if (ctx) return ctx.tenantId;
      }
    } catch {
      /* not migrated */
    }
  }

  if (typeof window !== "undefined") {
    const ctx = await resolveTenantFromHost(window.location.host);
    return ctx.tenantId;
  }

  return undefined;
}
