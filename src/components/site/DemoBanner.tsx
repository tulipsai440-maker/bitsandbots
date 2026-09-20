type DemoBannerProps = {
  tenantStatus?: "demo" | "live" | null;
};

/** Coaches sign in at /auth directly — no public “Coach sign in” bar. */
export function DemoBanner(_props: DemoBannerProps) {
  return null;
}
