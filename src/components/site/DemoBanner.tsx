import { Link } from "@tanstack/react-router";
import { isDemoMode } from "@/lib/demo/app-mode";

type DemoBannerProps = {
  tenantStatus?: "demo" | "live" | null;
};

/** Quiet coach entry for demo tenants — avoids “demo / goes live” framing on a live-feeling site. */
export function DemoBanner({ tenantStatus }: DemoBannerProps) {
  const show = isDemoMode || tenantStatus === "demo";
  if (!show) return null;

  return (
    <div className="border-b border-border/60 bg-cream/80 px-4 py-2 text-center text-sm text-foreground/80">
      <Link to="/auth" className="font-medium text-forest underline-offset-2 hover:underline">
        Coach sign in →
      </Link>
    </div>
  );
}
