import { Link } from "@tanstack/react-router";
import { LogOut, RefreshCw } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";

type AdminAccessPendingProps = {
  isDemo?: boolean;
  userEmail?: string | null;
  onSignOut?: () => void;
  compact?: boolean;
};

export function AdminAccessPending({
  userEmail,
  onSignOut,
  compact = false,
}: AdminAccessPendingProps) {
  async function signOut() {
    await supabase.auth.signOut();
    onSignOut?.();
  }

  const body = (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      {userEmail && (
        <p className="mb-4 text-sm text-muted-foreground">
          Signed in as <strong className="text-foreground">{userEmail}</strong>
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Your password only controls sign-in. Admin access requires a coach to grant your account in{" "}
        <strong className="text-foreground">Admin → Team Admins</strong>, or via Supabase SQL. Sign
        in with the same email they granted, then refresh this page.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="btn-primary gap-2" onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> Refresh
        </button>
        <Link to="/" className="btn-outline">
          Back to site
        </Link>
        <button type="button" onClick={signOut} className="btn-outline gap-2">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  if (compact) {
    return body;
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Admin"
        title="Admin access required"
        description="Signed in successfully — admin is a role in the database, not a special password."
      />
      <div className="container-page pb-20">{body}</div>
    </SiteLayout>
  );
}
