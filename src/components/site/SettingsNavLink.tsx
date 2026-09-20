import type { ReactNode } from "react";
import { InternalRouteLink } from "@/lib/internal-route-link";

/** Renders an internal route or external URL from site settings button paths. */
export function SettingsNavLink({
  path,
  className,
  children,
}: {
  path: string;
  className?: string;
  children: ReactNode;
}) {
  if (path.startsWith("http")) {
    return (
      <a href={path} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  const to = path.startsWith("/") ? path : `/${path}`;
  return (
    <InternalRouteLink to={to} className={className}>
      {children}
    </InternalRouteLink>
  );
}
