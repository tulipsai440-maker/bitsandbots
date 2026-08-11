import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { AdminNav } from "@/components/site/AdminNav";
import { checkIsAdmin } from "@/lib/admin";
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

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
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
      <SiteLayout>
        <PageHero
          eyebrow="Admin"
          title="Admin access required"
          description="Signed in successfully — admin is a role in the database, not a special password."
        />
        <div className="container-page pb-20">
          <div className="rounded-2xl border border-border bg-card p-8">
            <p className="text-sm text-muted-foreground">
              Your password only controls sign-in. Admin access requires{" "}
              <code className="rounded bg-muted px-1">user_roles.role = &apos;admin&apos;</code> for
              this account. Ask a current coach/admin to open{" "}
              <strong>Admin → Team Admins</strong> and select <strong>Make admin</strong> next to
              your email, or have them run{" "}
              <code className="rounded bg-muted px-1">supabase/grant-admin.sql</code> in the
              Supabase SQL Editor. Sign in as the same email they granted, then refresh this page.
            </p>
            <button onClick={signOut} className="btn-outline mt-6 gap-2">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </SiteLayout>
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
