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
  isDemo = false,
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

      {isDemo ? (
        <>
          <p className="text-sm text-muted-foreground">
            Your account is ready — admin access is granted separately (about one minute after you
            sign up). Once the platform owner adds your email, refresh this page and the coach tools
            will unlock.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Confirm you completed email verification (check your inbox for the confirmation link).
            </li>
            <li>Email the platform owner the address you used to sign up.</li>
            <li>After they grant admin, click Refresh below or open the Admin dashboard again.</li>
          </ol>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Your password only controls sign-in. Admin access requires a coach to grant your account in{" "}
          <strong className="text-foreground">Admin → Team Admins</strong>, or via Supabase SQL. Sign
          in with the same email they granted, then refresh this page.
        </p>
      )}

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
        title={isDemo ? "Almost there — admin pending" : "Admin access required"}
        description={
          isDemo
            ? "You are signed in. Waiting for demo admin to be enabled on your account."
            : "Signed in successfully — admin is a role in the database, not a special password."
        }
      />
      <div className="container-page pb-20">{body}</div>
    </SiteLayout>
  );
}
