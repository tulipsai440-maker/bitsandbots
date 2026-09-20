import { DEFAULT_SITE_SETTINGS, fetchSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";
import { normalizeBrandColor } from "@/lib/brand-colors";

export type TeamBranding = {
  siteName: string;
  siteTagline: string;
  siteUrl: string;
  brandColor: string;
};

export function brandingFromSettings(
  settings: Pick<SiteSettings, "siteName" | "siteTagline" | "siteUrl" | "brandColor">,
): TeamBranding {
  const siteName = settings.siteName.trim() || DEFAULT_SITE_SETTINGS.siteName;
  const siteTagline = settings.siteTagline.trim() || DEFAULT_SITE_SETTINGS.siteTagline;
  const siteUrl = (settings.siteUrl.trim() || DEFAULT_SITE_SETTINGS.siteUrl).replace(/\/$/, "");
  const brandColor = normalizeBrandColor(settings.brandColor);
  return { siteName, siteTagline, siteUrl, brandColor };
}

export function defaultTeamBranding(): TeamBranding {
  return brandingFromSettings(DEFAULT_SITE_SETTINGS);
}

/** Client / SSR loader — uses public site_settings row. */
export async function fetchTeamBranding(): Promise<TeamBranding> {
  try {
    return brandingFromSettings(await fetchSiteSettings());
  } catch {
    return defaultTeamBranding();
  }
}

/** Server cron / email — service role read with env fallbacks. */
export async function loadTeamBrandingServer(): Promise<TeamBranding> {
  const tenantId = await tenantIdForQuery();
  const siteOrigin = (process.env.SITE_ORIGIN?.trim() || DEFAULT_SITE_SETTINGS.siteUrl).replace(
    /\/$/,
    "",
  );
  const envName = process.env.SITE_NAME?.trim();

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = supabaseAdmin as any;
    const { data } = await admin
      .from("site_settings")
      .select("site_name, site_tagline, site_url, brand_color")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (data) {
      return brandingFromSettings({
        siteName: String(data.site_name ?? envName ?? DEFAULT_SITE_SETTINGS.siteName),
        siteTagline: String(data.site_tagline ?? DEFAULT_SITE_SETTINGS.siteTagline),
        siteUrl: String(data.site_url ?? siteOrigin),
        brandColor: normalizeBrandColor(String(data.brand_color ?? DEFAULT_SITE_SETTINGS.brandColor)),
      });
    }
  } catch {
    /* fall through */
  }

  return {
    siteName: envName || DEFAULT_SITE_SETTINGS.siteName,
    siteTagline: DEFAULT_SITE_SETTINGS.siteTagline,
    siteUrl: siteOrigin,
    brandColor: DEFAULT_SITE_SETTINGS.brandColor,
  };
}

export function consentFormPath(): string {
  return "/parentsconsent";
}

export function consentFormUrl(branding: TeamBranding, origin?: string): string {
  const base = (origin ?? branding.siteUrl).replace(/\/$/, "");
  return `${base}${consentFormPath()}`;
}

export function emailSignoff(branding: TeamBranding): string {
  return `${branding.siteName} coaches`;
}

/** Pull bare address from `Name <addr@domain>` or a plain email. */
function parseMailboxAddress(raw: string): string | null {
  const angled = raw.match(/<([^>]+)>/);
  if (angled?.[1]?.includes("@")) return angled[1].trim();
  const plain = raw.trim();
  if (plain.includes("@") && !plain.includes("<") && !plain.includes(" ")) return plain;
  return null;
}

/**
 * From header for Resend: always use this team's display name.
 * RESEND_FROM (if set) supplies only the verified mailbox address, e.g. updates@fllbots.com —
 * never the Bits & Bots display name for other tenants.
 */
export function emailFromFallback(branding: TeamBranding): string {
  const fromEnv = process.env.RESEND_FROM?.trim();
  const envMailbox = fromEnv ? parseMailboxAddress(fromEnv) : null;

  if (envMailbox) {
    return `${branding.siteName} <${envMailbox}>`;
  }

  const host = branding.siteUrl.replace(/^https?:\/\//, "").split("/")[0] || "";
  // Demo hosts are *.fllbots.com — send from the verified apex mailbox.
  const mailDomain = host.endsWith(".fllbots.com") || host === "fllbots.com" ? "fllbots.com" : host;
  const localPart = mailDomain.includes(".") ? "updates" : "hello";
  return `${branding.siteName} <${localPart}@${mailDomain || "example.com"}>`;
}

/** Route loader — reads team name from site_settings for SSR head/meta. */
export async function brandingRouteLoader() {
  return { branding: await fetchTeamBranding() };
}

export function routeTeamName(loaderData: { branding?: TeamBranding } | undefined): string {
  return loaderData?.branding?.siteName ?? DEFAULT_SITE_SETTINGS.siteName;
}

export function routeTeamTagline(loaderData: { branding?: TeamBranding } | undefined): string {
  return loaderData?.branding?.siteTagline ?? DEFAULT_SITE_SETTINGS.siteTagline;
}
