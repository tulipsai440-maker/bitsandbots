import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { AdminAccessPending } from "@/components/admin/AdminAccessPending";
import { AdminNav } from "@/components/site/AdminNav";
import { checkIsAdmin } from "@/lib/admin";
import { shouldUseDemoAssets } from "@/lib/demo/demo-tenant";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export type AdminNavKey =
  | "calendar"
  | "team"
  | "coaches"
  | "sponsors"
  | "events"
  | "announcements"
  | "gallery-photos"
  | "site-images"
  | "site-settings"
  | "join-notifications"
  | "team-admins"
  | "assignments"
  | "parent-contacts"
  | "parent-consents"
  | "broadcast";

export function AdminReviewPage({
  active,
  title,
  description,
  toolbar,
  children,
}: {
  active: AdminNavKey;
  title: string;
  description: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
    shouldUseDemoAssets().then(setIsDemo);
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (isAdmin === null) {
    return (
      <SiteLayout>
        <div className="container-page py-20 text-muted-foreground">Loading…</div>
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
      <PageHero eyebrow="Admin" title={title} description={description} />
      <section className="py-12">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <AdminNav active={active} />
            <button onClick={signOut} className="btn-outline gap-2">
              <LogOut size={16} /> Sign out
            </button>
          </div>
          {toolbar && <div className="mb-6 flex flex-wrap items-center gap-3">{toolbar}</div>}
          {children}
        </div>
      </section>
    </SiteLayout>
  );
}

export function FilterToggle({
  filter,
  setFilter,
  pendingCount,
}: {
  filter: "pending" | "all";
  setFilter: (f: "pending" | "all") => void;
  pendingCount: number;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      <button
        onClick={() => setFilter("pending")}
        className={`rounded-full px-4 py-2 text-sm ${filter === "pending" ? "bg-gold text-forest-deep font-medium" : "text-muted-foreground"}`}
      >
        Pending {pendingCount > 0 ? `(${pendingCount})` : ""}
      </button>
      <button
        onClick={() => setFilter("all")}
        className={`rounded-full px-4 py-2 text-sm ${filter === "all" ? "bg-muted text-foreground font-medium" : "text-muted-foreground"}`}
      >
        All entries
      </button>
    </div>
  );
}
