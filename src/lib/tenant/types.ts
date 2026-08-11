export type TenantStatus = "demo" | "live";

export type TenantContext = {
  tenantId: string;
  slug: string;
  displayName: string;
  status: TenantStatus;
  hostname: string;
  siteOrigin: string;
};

/** Bits & Bots production tenant (backfill UUID from setup-multi-tenant.sql). */
export const BITSANDBOTS_TENANT_ID = "a1111111-1111-1111-1111-111111111111";

export {
  DEMO_SUBDOMAIN,
  LEGACY_PLATFORM_DEMO_SUFFIX,
  PLAY_DOMAIN_SUFFIX,
  PLATFORM_DEMO_SUFFIX,
  demoHostnameForTeamDomain,
  isDemoHostname,
  isPlatformDemoHostname,
  normalizeTeamDomain,
  platformDemoApex,
  platformDemoHostname,
  platformDemoOrigin,
  platformDemoSuffix,
  slugFromPlatformDemoHostname,
} from "@/lib/tenant/demo-domain";
