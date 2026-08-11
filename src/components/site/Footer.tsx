import { Link } from "@tanstack/react-router";
import { MapPin, Clock, Mail } from "lucide-react";
import { ManageInAdmin } from "@/components/admin/inline-edit/AdminLiveEditBar";
import { EditableText } from "@/components/admin/inline-edit/EditableText";
import { TeamLogo } from "./TeamLogo";
import { useSiteSettings } from "@/lib/site-settings-context";
import type { NavLinkItem } from "@/lib/site-settings";

export function Footer() {
  const {
    siteName,
    siteTagline,
    foundedYear,
    meetingsBlurb,
    practiceSummary,
    practicePlace,
    zoomSummary,
    zoomPlace,
    meetingSummary,
    footerExploreLinks,
    footerExternalLinks,
    footerMeetTeamLabel,
  } = useSiteSettings();

  return (
    <footer className="mt-12 border-t border-border/60 bg-forest-deep text-cream md:mt-16">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3 md:py-14">
        <div>
          <div className="flex items-center gap-3">
            <TeamLogo variant="dark" size="sm" />
            <div>
              <div className="font-display text-lg font-semibold">
                <EditableText settingKey="siteName" label="Team name">
                  {siteName}
                </EditableText>
              </div>
              <div className="text-sm text-cream/60">
                <EditableText settingKey="siteTagline" label="Tagline">
                  {siteTagline}
                </EditableText>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-cream/75">
            A FIRST LEGO League Challenge team founded in{" "}
            <EditableText settingKey="foundedYear" label="Founded year">
              {foundedYear}
            </EditableText>
            .{" "}
            <EditableText settingKey="meetingsBlurb" label="Meetings blurb" multiline>
              {meetingsBlurb}
            </EditableText>
          </p>
        </div>

        <div className="text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base text-cream">When we meet</h3>
            <ManageInAdmin label="Edit meeting times" to="/admin/site-settings" />
          </div>
          <ul className="mt-3 space-y-2 text-cream/80">
            <li className="flex gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
              <span>
                Team practice ·{" "}
                <EditableText settingKey="practiceSummary" label="Practice schedule">
                  {practiceSummary}
                </EditableText>{" "}
                ·{" "}
                <EditableText settingKey="practicePlace" label="Practice location">
                  {practicePlace}
                </EditableText>
              </span>
            </li>
            <li className="flex gap-2">
              <Clock size={16} className="mt-0.5 shrink-0 text-gold" />
              <span>
                Zoom call ·{" "}
                <EditableText settingKey="zoomSummary" label="Zoom schedule">
                  {zoomSummary}
                </EditableText>{" "}
                ·{" "}
                <EditableText settingKey="zoomPlace" label="Zoom location">
                  {zoomPlace}
                </EditableText>
              </span>
            </li>
            <li className="flex gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-gold" />
              <Link to="/about" className="underline-offset-4 hover:underline">
                <EditableText settingKey="footerMeetTeamLabel" label="Footer meet team link">
                  {footerMeetTeamLabel}
                </EditableText>
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base text-cream">Explore</h3>
            <ManageInAdmin label="Edit footer links" to="/admin/site-settings" />
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-y-2 text-cream/80">
            {footerExploreLinks.map((item) => (
              <li key={footerKey(item)}>
                <FooterLink item={item} />
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-2 text-cream/70">
            {footerExternalLinks.map((item) => (
              <li key={footerKey(item)}>
                <FooterLink item={item} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col items-start justify-between gap-2 py-5 text-xs text-cream/60 md:flex-row md:items-center">
          <div>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </div>
          <div>
            Founded{" "}
            <EditableText settingKey="foundedYear" label="Founded year">
              {foundedYear}
            </EditableText>{" "}
            ·{" "}
            <EditableText settingKey="meetingSummary" label="Meeting summary">
              {meetingSummary}
            </EditableText>
          </div>
        </div>
      </div>
    </footer>
  );
}

function footerKey(item: NavLinkItem) {
  return item.kind === "internal" ? item.to : item.href;
}

function FooterLink({ item }: { item: NavLinkItem }) {
  if (item.kind === "external") {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
        {item.label}
      </a>
    );
  }
  return (
    <Link to={item.to as "/"} className="hover:text-gold">
      {item.label}
    </Link>
  );
}
