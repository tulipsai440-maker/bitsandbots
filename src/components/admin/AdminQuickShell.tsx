import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { AdminAccessPending } from "@/components/admin/AdminAccessPending";
import { checkIsAdmin } from "@/lib/admin";
import { shouldUseDemoAssets } from "@/lib/demo/demo-tenant";
import { supabase } from "@/integrations/supabase/client";

/** Admin pages opened from the coach bar — no hero, no full admin nav. */
export function AdminQuickShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
    shouldUseDemoAssets().then(setIsDemo);
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  if (isAdmin === null) {
    return (
      <SiteLayout>
        <div className="container-page py-16 text-muted-foreground">Loading…</div>
      </SiteLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminAccessPending
        isDemo={isDemo}
        userEmail={userEmail}
        onSignOut={() => navigate({ to: "/auth" })}
      />
    );
  }

  return (
    <SiteLayout>
      <div className="container-page py-6 md:py-8">{children}</div>
    </SiteLayout>
  );
}

export const COACH_BAR_ADMIN_PATHS = [
  "/admin",
  "/admin/broadcast",
  "/admin/join-notifications",
  "/admin/parent-contacts",
  "/admin/parent-consents",
  "/admin/site-images",
  "/admin/gallery-photos",
  "/admin/site-settings",
  "/admin/team-admins",
] as const;

export function isCoachBarAdminPath(pathname: string): boolean {
  if (pathname === "/admin" || pathname === "/admin/") return true;
  return COACH_BAR_ADMIN_PATHS.some((path) => path !== "/admin" && pathname === path);
}
