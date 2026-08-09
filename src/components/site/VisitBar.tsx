import { Link } from "@tanstack/react-router";
import { Clock, MapPin, X } from "lucide-react";
import { useState } from "react";
import {
  PRACTICE_PLACE,
  PRACTICE_SUMMARY,
  ZOOM_PLACE,
  ZOOM_SUMMARY,
} from "@/lib/photos";

export function VisitBar() {
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
            {PRACTICE_SUMMARY} · {PRACTICE_PLACE}
          </p>
          <p className="mt-0.5 text-sm leading-snug text-cream/75">
            {ZOOM_SUMMARY} · {ZOOM_PLACE}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              to="/calendar"
              className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-forest-deep"
            >
              <MapPin size={12} /> Calendar
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
