import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { TeamLogo } from "./TeamLogo";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/photos";
import { BIOGLOW_RESOURCES_URL } from "@/lib/season-videos";

type NavItem =
  | {
      kind: "internal";
      to: "/about" | "/coaches" | "/calendar" | "/assignments" | "/videos" | "/gallery" | "/outreach";
      label: string;
    }
  | { kind: "external"; href: string; label: string };

const nav: NavItem[] = [
  { kind: "internal", to: "/about", label: "Our Team" },
  { kind: "internal", to: "/coaches", label: "Coaches" },
  { kind: "internal", to: "/calendar", label: "Calendar" },
  { kind: "internal", to: "/assignments", label: "Assignments" },
  { kind: "internal", to: "/videos", label: "Videos" },
  { kind: "external", href: BIOGLOW_RESOURCES_URL, label: "Resources" },
  { kind: "internal", to: "/gallery", label: "Gallery" },
  { kind: "internal", to: "/outreach", label: "Outreach" },
];

const navLinkClass =
  "rounded-full px-2.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground xl:px-3.5";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="container-page flex h-20 items-center justify-between">
        <Link
          to="/"
          className="group flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <TeamLogo
            variant="light"
            size="sm"
            priority
            className="transition-transform duration-300 group-hover:-translate-y-0.5 md:!h-16 md:!w-16"
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-display text-xl text-forest-deep md:text-2xl">{SITE_NAME}</span>
            <span className="max-w-[11rem] text-xs leading-snug text-muted-foreground sm:max-w-xs sm:text-sm md:max-w-none">
              {SITE_TAGLINE}
            </span>
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-0.5 lg:flex xl:gap-1">
          {nav.map((item) =>
            item.kind === "external" ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={navLinkClass}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={navLinkClass}
                activeProps={{
                  className: "rounded-full px-3.5 py-2 text-sm bg-muted text-foreground font-medium",
                }}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <button
          className="grid h-10 w-10 place-items-center rounded-full border border-border lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background lg:hidden">
          <div className="container-page flex flex-col py-2">
            {nav.map((item) =>
              item.kind === "external" ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </header>
  );
}
