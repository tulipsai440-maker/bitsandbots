import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminReviewPage } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchTroopUsers,
  grantTroopAdmin,
  isTroopAdminsSetupMissing,
  revokeTroopAdmin,
  troopAdminsErrorMessage,
  TROOP_ADMINS_SETUP_SQL,
  type TroopUser,
} from "@/lib/troop-admins";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/troop-admins")({
  component: AdminTroopAdminsPage,
});

const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new";

async function copySetupSql() {
  try {
    await navigator.clipboard.writeText(TROOP_ADMINS_SETUP_SQL);
    toast.success("SQL copied — paste into Supabase SQL Editor and click Run");
  } catch {
    toast.error("Could not copy — open supabase/setup-troop-admins.sql in the project");
  }
}

function formatDate(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AdminTroopAdminsPage() {
  const [users, setUsers] = useState<TroopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setUsers(await fetchTroopUsers());
      setNeedsSetup(false);
      setError(null);
    } catch (e) {
      if (isTroopAdminsSetupMissing(e)) {
        setNeedsSetup(true);
        setError(null);
      } else {
        console.error("[troop-admins] Load failed", e);
        setError(troopAdminsErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
    load();
  }, []);

  const adminCount = useMemo(() => users.filter((u) => u.isAdmin).length, [users]);

  async function toggleAdmin(user: TroopUser) {
    const granting = !user.isAdmin;
    if (
      !granting &&
      !confirm(`Remove admin access for ${user.email}? They keep their account but lose the admin tools.`)
    ) {
      return;
    }

    setBusyId(user.id);
    try {
      if (granting) {
        await grantTroopAdmin(user.id);
        toast.success(`${user.email} is now an admin`);
      } else {
        await revokeTroopAdmin(user.id);
        toast.success(`Admin access removed for ${user.email}`);
      }
      await load();
    } catch (e) {
      console.error("[troop-admins] Update failed", e);
      toast.error(troopAdminsErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminReviewPage
      active="troop-admins"
      title="Troop Admins"
      description={`Give troop leaders access to the admin tools. ${adminCount} admin${adminCount === 1 ? "" : "s"} right now.`}
    >
      {needsSetup && <TroopAdminsSetupBanner onRetry={load} />}

      {!needsSetup && (
        <div className="mb-6 rounded-2xl border border-border bg-sand/50 p-5 text-sm text-muted-foreground">
          Creating an account does not grant admin access on its own. Once someone signs up at{" "}
          <code className="rounded bg-muted px-1">/auth</code> and confirms their email, they appear
          below — select <strong>Make admin</strong> to let them manage events, Eagle Scouts,
          scoutmasters, and announcements.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
          <p className="font-medium text-destructive">Could not load accounts</p>
          <p className="mt-1 text-destructive/90">{error}</p>
          <p className="mt-3 text-muted-foreground">
            If the database setup has not been run yet on this project, run it now and try again.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={load} className="btn-outline">
              Try again
            </button>
            <button type="button" onClick={copySetupSql} className="btn-outline gap-2">
              <Copy size={16} /> Copy setup SQL
            </button>
            <a href={SQL_EDITOR_URL} target="_blank" rel="noreferrer" className="btn-outline gap-2">
              <ExternalLink size={16} /> Open SQL Editor
            </a>
          </div>
        </div>
      )}

      {!needsSetup && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-sand text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Access</th>
                <th className="p-3">Confirmed</th>
                <th className="p-3">Signed up</th>
                <th className="p-3">Last sign in</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border align-middle">
                  <td className="p-3 font-medium">
                    {user.email}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>
                    )}
                  </td>
                  <td className="p-3">
                    {user.isAdmin ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-forest">
                        <ShieldCheck size={13} /> Admin
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        No access
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {user.emailConfirmed ? (
                      <span className="inline-flex items-center gap-1.5 text-forest">
                        <CheckCircle2 size={14} /> Yes
                      </span>
                    ) : (
                      <span className="text-destructive">Not yet</span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDate(user.lastSignInAt)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => toggleAdmin(user)}
                      disabled={busyId === user.id || user.id === currentUserId}
                      title={user.id === currentUserId ? "You cannot change your own access" : undefined}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                        user.isAdmin
                          ? "border border-border text-destructive hover:bg-destructive/10"
                          : "bg-forest text-cream hover:brightness-110"
                      }`}
                    >
                      {user.isAdmin ? (
                        <>
                          <ShieldOff size={14} /> Remove admin
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} /> Make admin
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Loading accounts…
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No accounts have signed up yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminReviewPage>
  );
}

function TroopAdminsSetupBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-50 px-6 py-5 text-sm dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-700" />
        <div className="space-y-3">
          <div>
            <p className="font-medium text-amber-950 dark:text-amber-100">One-time database setup required</p>
            <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
              Run the setup SQL once to turn on admin management from this page. After that, adding
              a new admin never needs SQL again.
            </p>
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-amber-900/80 dark:text-amber-100/80">
            <li>Open the Supabase SQL Editor</li>
            <li>Copy the setup SQL (button below)</li>
            <li>Paste it and click <strong>Run</strong></li>
            <li>Return here and click <strong>Check again</strong></li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <a href={SQL_EDITOR_URL} target="_blank" rel="noreferrer" className="btn-primary gap-2">
              <ExternalLink size={16} /> Open SQL Editor
            </a>
            <button type="button" onClick={copySetupSql} className="btn-outline gap-2">
              <Copy size={16} /> Copy setup SQL
            </button>
            <button type="button" onClick={onRetry} className="btn-outline">
              Check again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
