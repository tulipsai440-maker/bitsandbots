import { isDemoMode } from "@/lib/demo/app-mode";

type DemoBannerProps = {
  tenantStatus?: "demo" | "live" | null;
};

export function DemoBanner({ tenantStatus }: DemoBannerProps) {
  const show = isDemoMode || tenantStatus === "demo";
  if (!show) return null;

  return (
    <div className="border-b border-amber-300/50 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
      <strong>Demo site</strong> — explore and edit freely. Changes you save here carry over when this
      team goes live.
    </div>
  );
}
