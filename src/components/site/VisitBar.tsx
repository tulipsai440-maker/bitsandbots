import { Link } from "@tanstack/react-router";
import { Clock, ClipboardList, MapPin, X } from "lucide-react";
import { useState } from "react";
import { useSiteSettings } from "@/lib/site-settings-context";
import type { NavLinkItem } from "@/lib/site-settings";

export function VisitBar() {
  const { practiceSummary, practicePlace, zoomSummary, zoomPlace, visitBarLinks } = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-forest/20 bg-forest-deep px-4 py-3 text-cream shadow-lg lg:hidden">
      <div className="container-page flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gold">
            <Clock size={12} /> Meetings
          </div>
          <p className="mt-1 text-sm leading-snug text-cream/90">
            {practiceSummary} · {practicePlace}
          </p>
          <p className="mt-0.5 text-sm leading-snug text-cream/75">
            {zoomSummary} · {zoomPlace}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {visitBarLinks.map((item, index) => (
              <VisitBarButton key={visitBarKey(item)} item={item} primary={index === 0} />
            ))}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 text-cream/70 hover:bg-cream/10"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

function visitBarKey(item: NavLinkItem) {
  return item.kind === "internal" ? item.to : item.href;
}

function VisitBarButton({ item, primary }: { item: NavLinkItem; primary: boolean }) {
  const className = primary
    ? "inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-forest-deep"
    : "inline-flex items-center gap-1 rounded-full border border-cream/30 bg-cream/10 px-3 py-1.5 text-xs font-semibold text-cream";

  if (item.kind === "external") {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        <MapPin size={12} /> {item.label}
      </a>
    );
  }

  const Icon = item.to === "/assignments" ? ClipboardList : MapPin;
  return (
    <Link to={item.to as "/"} className={className}>
      <Icon size={12} /> {item.label}
    </Link>
  );
}
