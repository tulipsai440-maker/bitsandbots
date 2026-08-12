/** Default password for provisioned demo coach accounts (not shown on the sign-in page). */
export const DEMO_ADMIN_DEFAULT_PASSWORD = "First@2026";

export function demoAdminEmailForSlug(slug: string): string {
  const s = slug.trim().toLowerCase();
  if (!s) return "";
  return `${s}@demo.fllbots.com`;
}

/** Accept team name, slug-only username, or full demo email. */
export function normalizeDemoAdminEmail(
  input: string,
  slug: string,
  teamName?: string,
): string {
  const trimmed = input.trim();
  if (!trimmed) return demoAdminEmailForSlug(slug);
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  const normalized = trimmed.toLowerCase();
  if (teamName && normalized === teamName.trim().toLowerCase()) {
    return demoAdminEmailForSlug(slug);
  }
  return demoAdminEmailForSlug(normalized);
}

export type DemoAdminLoginHint = {
  slug: string;
  /** Team display name shown as the default username on demo sign-in. */
  username: string;
};

export function demoAdminLoginHint(slug: string, teamName: string): DemoAdminLoginHint | null {
  const s = slug.trim().toLowerCase();
  if (!s) return null;
  const username = teamName.trim() || s;
  return { slug: s, username };
}
