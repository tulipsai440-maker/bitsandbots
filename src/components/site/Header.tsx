import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ManageInAdmin } from "@/components/admin/inline-edit/AdminLiveEditBar";
import { EditableText } from "@/components/admin/inline-edit/EditableText";
import { TeamLogo } from "./TeamLogo";
import { EditableBrandColor } from "@/components/admin/inline-edit/EditableBrandColor";
import { useSiteSettings } from "@/lib/site-settings-context";
import type { NavLinkItem } from "@/lib/site-settings";

const navLinkClass =
  "rounded-full px-2.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground xl:px-3.5";

export function Header() {
  const { siteName, siteTagline, navLinks } = useSiteSettings();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="container-page flex h-20 items-center justify-between">
        <Link
          to="/"
          className="group flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <span className="relative shrink-0">
            <TeamLogo
              variant="light"
              size="sm"
              priority
              className="transition-transform duration-300 group-hover:-translate-y-0.5 md:!h-16 md:!w-16"
            />
            <span className="absolute -bottom-0.5 -right-0.5">
              <EditableBrandColor />
            </span>
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-display text-xl text-forest-deep md:text-2xl">
              <EditableText settingKey="siteName" label="Team name">
                {siteName}
              </EditableText>
            </span>
            <span className="max-w-[11rem] text-xs leading-snug text-muted-foreground sm:max-w-xs sm:text-sm md:max-w-none">
              <EditableText settingKey="siteTagline" label="Tagline">
                {siteTagline}
              </EditableText>
            </span>
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-0.5 lg:flex xl:gap-1">
          {navLinks.map((item) => (
            <NavLink key={navKey(item)} item={item} className={navLinkClass} activeClassName="rounded-full px-2.5 py-2 text-sm bg-muted text-foreground font-medium xl:px-3.5" />
          ))}
          <ManageInAdmin label="Edit menu" to="/admin/site-settings" />
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
            {navLinks.map((item) => (
              <MobileNavLink key={navKey(item)} item={item} onNavigate={() => setOpen(false)} />
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function navKey(item: NavLinkItem) {
  return item.kind === "internal" ? item.to : item.href;
}

function NavLink({
  item,
  className,
  activeClassName,
}: {
  item: NavLinkItem;
  className: string;
  activeClassName?: string;
}) {
  if (item.kind === "external") {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {item.label}
      </a>
    );
  }
  return (
    <Link
      to={item.to as "/"}
      className={className}
      activeProps={{ className: activeClassName ?? className }}
    >
      {item.label}
    </Link>
  );
}

function MobileNavLink({ item, onNavigate }: { item: NavLinkItem; onNavigate: () => void }) {
  if (item.kind === "external") {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted"
      >
        {item.label}
      </a>
    );
  }
  return (
    <Link to={item.to as "/"} onClick={onNavigate} className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted">
      {item.label}
    </Link>
  );
}
