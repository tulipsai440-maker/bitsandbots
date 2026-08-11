/** Platform demo hostnames: {slug}.{apex} — default apex demo.com (no fllbots in demo URL). */

/** @deprecated Legacy platform hostnames. */
export const PLAY_DOMAIN_SUFFIX = ".play.fllbots.com";

/** @deprecated Legacy; use platformDemoApex(). */
export const LEGACY_PLATFORM_DEMO_SUFFIX = ".demo.fllbots.com";

export const DEMO_SUBDOMAIN = "demo";

/** Apex domain for demo tenants (env: VITE_PLATFORM_DEMO_APEX or PLATFORM_DEMO_APEX). */
export function platformDemoApex(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta.env.VITE_PLATFORM_DEMO_APEX as string | undefined)?.trim()) ||
    (typeof process !== "undefined" && process.env.PLATFORM_DEMO_APEX?.trim()) ||
    "";
  return (fromEnv || "demo.com").replace(/^\./, "").toLowerCase();
}

export function platformDemoSuffix(): string {
  return `.${platformDemoApex()}`;
}

/** `{slug}.demo.com` (or `{slug}.{PLATFORM_DEMO_APEX}`). */
export function platformDemoHostname(slug: string): string {
  const s = slug.trim().toLowerCase();
  if (!s || s.includes(".") || s.includes(" ")) {
    throw new Error("Invalid tenant slug");
  }
  return `${s}${platformDemoSuffix()}`;
}

export function platformDemoOrigin(slug: string): string {
  return `https://${platformDemoHostname(slug)}`;
}

/** Strip protocol, path, and leading www. */
export function normalizeTeamDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (d.startsWith("www.")) d = d.slice(4);
  return d;
}

/** Team-owned demo URL — only when they already have a domain (go-live path). */
export function demoHostnameForTeamDomain(teamDomain: string): string {
  const apex = normalizeTeamDomain(teamDomain);
  if (!apex) throw new Error("Team domain is required");
  if (apex.includes(" ")) throw new Error("Invalid team domain");
  if (apex.startsWith(`${DEMO_SUBDOMAIN}.`)) return apex;
  return `${DEMO_SUBDOMAIN}.${apex}`;
}

const LEGACY_SUFFIXES = [platformDemoSuffix(), LEGACY_PLATFORM_DEMO_SUFFIX, PLAY_DOMAIN_SUFFIX];

export function slugFromPlatformDemoHostname(hostname: string): string | null {
  const h = hostname.split(":")[0]?.toLowerCase().trim() ?? "";
  for (const suffix of LEGACY_SUFFIXES) {
    if (!h.endsWith(suffix)) continue;
    const slug = h.slice(0, -suffix.length);
    if (!slug || slug.includes(".")) return null;
    return slug;
  }
  return null;
}

export function isDemoHostname(hostname: string): boolean {
  return slugFromPlatformDemoHostname(hostname) != null;
}

export function isPlatformDemoHostname(hostname: string): boolean {
  const h = hostname.split(":")[0]?.toLowerCase().trim() ?? "";
  return h.endsWith(platformDemoSuffix());
}

/** @deprecated Use platformDemoSuffix(). */
export const PLATFORM_DEMO_SUFFIX = LEGACY_PLATFORM_DEMO_SUFFIX;
