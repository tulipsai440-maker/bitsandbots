import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";

/** Paths that exist in src/routes (plus legacy redirects). */
const KNOWN_INTERNAL_PATHS = new Set([
  "/",
  "/about",
  "/assignments",
  "/auth",
  "/calendar",
  "/coaches",
  "/core-values",
  "/events",
  "/gallery",
  "/join",
  "/outreach",
  "/parentsconsent",
  "/quick-links",
  "/resources",
  "/sponsors",
  "/videos",
]);

export function normalizeInternalHref(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function isKnownInternalPath(path: string): boolean {
  const normalized = normalizeInternalHref(path).split(/[?#]/)[0] ?? "/";
  if (KNOWN_INTERNAL_PATHS.has(normalized)) return true;
  return normalized.startsWith("/admin");
}

type InternalRouteLinkProps = {
  to: string;
  className?: string;
  children: ReactNode;
  activeProps?: ComponentProps<typeof Link>["activeProps"];
  onClick?: () => void;
};

/** SPA link when the route exists; plain anchor otherwise (avoids crashing the whole site). */
export function InternalRouteLink({
  to,
  className,
  children,
  activeProps,
  onClick,
}: InternalRouteLinkProps) {
  const href = normalizeInternalHref(to);
  if (!isKnownInternalPath(href)) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href as "/"} className={className} activeProps={activeProps} onClick={onClick}>
      {children}
    </Link>
  );
}
