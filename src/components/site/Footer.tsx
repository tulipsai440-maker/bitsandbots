import { Link } from "@tanstack/react-router";
import { MapPin, Clock, Mail } from "lucide-react";
import {
  FOUNDED_YEAR,
  MEETINGS_BLURB,
  MEETING_SUMMARY,
  PRACTICE_PLACE,
  PRACTICE_SUMMARY,
  SITE_NAME,
  SITE_TAGLINE,
  ZOOM_PLACE,
  ZOOM_SUMMARY,
} from "@/lib/photos";
import { BIOGLOW_RESOURCES_URL } from "@/lib/season-videos";
import { TeamLogo } from "./TeamLogo";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border/60 bg-forest-deep text-cream md:mt-16">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3 md:py-14">
        <div>
          <div className="flex items-center gap-3">
            <TeamLogo variant="dark" size="sm" />
            <div>
              <div className="font-display text-lg font-semibold">{SITE_NAME}</div>
              <div className="text-sm text-cream/60">{SITE_TAGLINE}</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-cream/75">
            A FIRST LEGO League Challenge team founded in {FOUNDED_YEAR}. {MEETINGS_BLURB}
          </p>
        </div>

        <div className="text-sm">
          <h3 className="font-display text-base text-cream">When we meet</h3>
          <ul className="mt-3 space-y-2 text-cream/80">
            <li className="flex gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
              <span>
                Team practice · {PRACTICE_SUMMARY} · {PRACTICE_PLACE}
              </span>
            </li>
            <li className="flex gap-2">
              <Clock size={16} className="mt-0.5 shrink-0 text-gold" />
              <span>
                Zoom call · {ZOOM_SUMMARY} · {ZOOM_PLACE}
              </span>
            </li>
            <li className="flex gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-gold" />
              <Link to="/about" className="underline-offset-4 hover:underline">
                Meet our team
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <h3 className="font-display text-base text-cream">Explore</h3>
          <ul className="mt-3 grid grid-cols-2 gap-y-2 text-cream/80">
            <li>
              <Link to="/about" className="hover:text-gold">
                Our Team
              </Link>
            </li>
            <li>
              <Link to="/coaches" className="hover:text-gold">
                Coaches
              </Link>
            </li>
            <li>
              <Link to="/calendar" className="hover:text-gold">
                Calendar
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="hover:text-gold">
                Gallery
              </Link>
            </li>
            <li>
              <Link to="/videos" className="hover:text-gold">
                Videos
              </Link>
            </li>
            <li>
              <a
                href={BIOGLOW_RESOURCES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold"
              >
                Resources
              </a>
            </li>
            <li>
              <Link to="/outreach" className="hover:text-gold">
                Outreach
              </Link>
            </li>
            <li>
              <Link to="/sponsors" className="hover:text-gold">
                Sponsors
              </Link>
            </li>
            <li>
              <Link to="/core-values" className="hover:text-gold">
                Core Values
              </Link>
            </li>
            <li>
              <Link to="/quick-links" className="hover:text-gold">
                Quick Links
              </Link>
            </li>
          </ul>
          <ul className="mt-4 space-y-2 text-cream/70">
            <li>
              <a
                href="https://www.firstlegoleague.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold"
              >
                FIRST LEGO League
              </a>
            </li>
            <li>
              <a
                href="https://www.firstinspires.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold"
              >
                FIRST Inspires
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col items-start justify-between gap-2 py-5 text-xs text-cream/60 md:flex-row md:items-center">
          <div>
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </div>
          <div>
            Founded {FOUNDED_YEAR} · {MEETING_SUMMARY}
          </div>
        </div>
      </div>
    </footer>
  );
}
