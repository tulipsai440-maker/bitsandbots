import { Link } from "@tanstack/react-router";
import { MapPin, Clock, Mail, ExternalLink } from "lucide-react";
import { MEETING_MAPS_URL } from "@/lib/photos";
import { TroopLogo } from "./TroopLogo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-forest-deep text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <TroopLogo variant="dark" size="sm" />
            <div>
              <div className="font-display text-lg font-semibold">Troop 2001</div>
              <div className="text-sm text-cream/60">Naples, Florida</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-cream/75">
            Scouts BSA troop chartered in Naples in 2000. Wednesday meetings at North Collier Fire Station #45.
          </p>
          <p className="mt-3 text-xs text-cream/60">Gulf Coast Council · Scouts BSA</p>
        </div>

        <div className="text-sm">
          <h3 className="font-display text-base text-cream">Meeting Location</h3>
          <ul className="mt-3 space-y-2 text-cream/80">
            <li className="flex gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
              <span>
                North Collier Fire Station #45<br />
                1885 Veterans Park Dr<br />
                Naples, FL 34109
              </span>
            </li>
            <li className="flex gap-2">
              <Clock size={16} className="mt-0.5 shrink-0 text-gold" />
              <span>Every Wednesday · 7:00 PM</span>
            </li>
            <li className="flex gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-gold" />
              <Link to="/join" className="underline-offset-4 hover:underline">Contact us to visit</Link>
            </li>
            <li>
              <a
                href={MEETING_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-gold hover:underline"
              >
                Get directions <ExternalLink size={12} />
              </a>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <h3 className="font-display text-base text-cream">Pages</h3>
          <ul className="mt-3 grid grid-cols-2 gap-y-2 text-cream/80">
            <li><Link to="/about" className="hover:text-gold">About</Link></li>
            <li><Link to="/eagle-scouts" className="hover:text-gold">Eagle Scouts</Link></li>
            <li><Link to="/calendar" className="hover:text-gold">Calendar</Link></li>
            <li><Link to="/events" className="hover:text-gold">Events</Link></li>
            <li><Link to="/gallery" className="hover:text-gold">Gallery</Link></li>
            <li><Link to="/join" className="hover:text-gold">Join Us</Link></li>
            <li><Link to="/quick-links" className="hover:text-gold">Quick Links</Link></li>
          </ul>
          <ul className="mt-4 space-y-2 text-cream/70">
            <li>
              <a href="https://www.gulfcoastcouncil.org/" target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                Gulf Coast Council
              </a>
            </li>
            <li>
              <a href="https://www.scouting.org/" target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                Scouting America
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col items-start justify-between gap-2 py-5 text-xs text-cream/60 md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} Troop 2001 Naples. All rights reserved.</div>
          <div>New scouts welcome · Wednesdays 7:00 PM · North Collier Fire Station #45</div>
        </div>
      </div>
    </footer>
  );
}
