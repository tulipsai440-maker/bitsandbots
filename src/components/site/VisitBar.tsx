import { Link } from "@tanstack/react-router";
import { Clock, MapPin, X } from "lucide-react";
import { useState } from "react";
import { MEETING_MAPS_URL } from "@/lib/photos";

export function VisitBar() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-forest/20 bg-forest-deep px-4 py-3 text-cream shadow-lg lg:hidden">
      <div className="container-page flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gold">
            <Clock size={12} /> Wednesday meetings · 7 PM
          </div>
          <p className="mt-1 text-sm leading-snug text-cream/90">
            North Collier Fire Station #45
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={MEETING_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-forest-deep"
            >
              <MapPin size={12} /> Directions
            </a>
            <Link to="/join" className="inline-flex rounded-full border border-cream/30 px-3 py-1.5 text-xs font-medium">
              Join us
            </Link>
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
