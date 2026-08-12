import { Link } from "@tanstack/react-router";
import { useAdminEdit } from "@/components/admin/inline-edit/AdminEditProvider";

type GallerySectionTab = "gallery" | "review";

export function GallerySectionTabs({
  active,
  pendingCount,
}: {
  active: GallerySectionTab;
  pendingCount?: number;
}) {
  const { isAdmin } = useAdminEdit();
  if (!isAdmin) return null;

  const tabClass = (tab: GallerySectionTab) =>
    `rounded-full px-4 py-2 text-sm transition-colors ${
      active === tab ? "bg-gold font-medium text-forest-deep" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      <Link to="/gallery" className={tabClass("gallery")}>
        Gallery
      </Link>
      <Link to="/admin/gallery-photos" className={tabClass("review")}>
        Photo review
        {pendingCount != null && pendingCount > 0 ? ` (${pendingCount})` : ""}
      </Link>
    </div>
  );
}
