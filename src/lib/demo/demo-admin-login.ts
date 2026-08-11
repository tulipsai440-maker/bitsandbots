/** Shared demo coach login — replace or delete after the team sets up their own admin. */
export const DEMO_ADMIN_DEFAULT_PASSWORD = "First@2026";

export function demoAdminEmailForSlug(slug: string): string {
  const s = slug.trim().toLowerCase();
  if (!s) return "";
  return `${s}@demo.fllbots.com`;
}

/** Accept slug-only input (e.g. bots4life) or full demo email. */
export function normalizeDemoAdminEmail(input: string, slug: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return demoAdminEmailForSlug(slug);
  if (trimmed.includes("@")) return trimmed;
  return demoAdminEmailForSlug(trimmed);
}

export type DemoAdminLogin = {
  slug: string;
  email: string;
  username: string;
  password: string;
};

export function demoAdminLoginForSlug(slug: string): DemoAdminLogin | null {
  const s = slug.trim().toLowerCase();
  if (!s) return null;
  return {
    slug: s,
    email: demoAdminEmailForSlug(s),
    username: s,
    password: DEMO_ADMIN_DEFAULT_PASSWORD,
  };
}
