import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { TroopLogo } from "./TroopLogo";

const nav = [
  { to: "/about", label: "About Us" },
  { to: "/eagle-scouts", label: "Eagle Scouts" },
  { to: "/calendar", label: "Calendar" },
  { to: "/events", label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/quick-links", label: "Quick Links" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-28 items-center justify-between md:h-32">
        <Link
          to="/"
          className="group flex items-center gap-3.5"
          onClick={() => setOpen(false)}
        >
          <TroopLogo variant="light" size="md" priority className="group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_28px_rgba(27,54,40,0.18)]" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-xl text-forest-deep md:text-2xl">Troop 2001</span>
            <span className="text-sm text-muted-foreground">Naples, FL</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              className="rounded-full px-3.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-full px-3.5 py-2 text-sm bg-muted text-foreground font-medium" }}
            >
              {i.label}
            </Link>
          ))}
          <Link to="/join" className="btn-primary ml-2 !py-2 !px-4 text-sm">Join Troop 2001</Link>
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
          <div className="container-page flex flex-col py-3">
            {nav.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm text-foreground hover:bg-muted"
              >
                {i.label}
              </Link>
            ))}
            <Link to="/join" onClick={() => setOpen(false)} className="btn-primary mt-2 text-sm">Join Troop 2001</Link>
          </div>
        </div>
      )}
    </header>
  );
}
