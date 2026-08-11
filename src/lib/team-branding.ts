import { DEFAULT_SITE_SETTINGS, fetchSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { normalizeBrandColor } from "@/lib/brand-colors";

export type TeamBranding = {
  siteName: string;
  siteUrl: string;
  brandColor: string;
};

export function brandingFromSettings(
  settings: Pick<SiteSettings, "siteName" | "siteUrl" | "brandColor">,
): TeamBranding {
  const siteName = settings.siteName.trim() || DEFAULT_SITE_SETTINGS.siteName;
  const siteUrl = (settings.siteUrl.trim() || DEFAULT_SITE_SETTINGS.siteUrl).replace(/\/$/, "");
  const brandColor = normalizeBrandColor(settings.brandColor);
  return { siteName, siteUrl, brandColor };
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
      .select("site_name, site_url, brand_color")
      .eq("id", 1)
      .maybeSingle();

    if (data) {
      return brandingFromSettings({
        siteName: String(data.site_name ?? envName ?? DEFAULT_SITE_SETTINGS.siteName),
        siteUrl: String(data.site_url ?? siteOrigin),
        brandColor: normalizeBrandColor(String(data.brand_color ?? DEFAULT_SITE_SETTINGS.brandColor)),
      });
    }
  } catch {
    /* fall through */
  }

  return {
    siteName: envName || DEFAULT_SITE_SETTINGS.siteName,
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

export function emailFromFallback(branding: TeamBranding): string {
  const fromEnv = process.env.RESEND_FROM?.trim();
  if (fromEnv) return fromEnv;
  const domain = branding.siteUrl.replace(/^https?:\/\//, "").split("/")[0];
  const localPart = domain.includes(".") ? "updates" : "hello";
  return `${branding.siteName} <${localPart}@${domain || "example.com"}>`;
}

/** Route loader — reads team name from site_settings for SSR head/meta. */
export async function brandingRouteLoader() {
  return { branding: await fetchTeamBranding() };
}

export function routeTeamName(loaderData: { branding?: TeamBranding } | undefined): string {
  return loaderData?.branding?.siteName ?? DEFAULT_SITE_SETTINGS.siteName;
}
