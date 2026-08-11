import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminQuickShell } from "@/components/admin/AdminQuickShell";
import {
  deleteJoinNotifyEmail,
  saveJoinNotifyEmail,
  setJoinNotifyEmailActive,
} from "@/lib/join-notify-emails-admin";
import {
  fetchAllJoinNotifyEmails,
  isJoinNotifyTableMissingError,
  JOIN_NOTIFY_SETUP_SQL,
  type JoinNotifyEmailRow,
} from "@/lib/join-notify-emails";
import { toast } from "sonner";
import { ExternalLink, Mail, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/join-notifications")({
  component: AdminCoachCcEmailsPage,
});

const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new";

function AdminCoachCcEmailsPage() {
  const [rows, setRows] = useState<JoinNotifyEmailRow[]>([]);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setRows(await fetchAllJoinNotifyEmails());
      setNeedsSetup(false);
    } catch (e) {
      if (isJoinNotifyTableMissingError(e)) {
        setNeedsSetup(true);
        setRows([]);
      } else {
        toast.error(e instanceof Error ? e.message : "Could not load coach emails");
      }
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addEmail() {
    if (!email.trim()) {
      toast.error("Enter an email address");
      return;
    }
    setBusy(true);
    try {
      await saveJoinNotifyEmail({ email, label: label || null, sortOrder: rows.length });
      setEmail("");
      setLabel("");
      toast.success("Coach email added");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(row: JoinNotifyEmailRow) {
    try {
      await setJoinNotifyEmailActive(row.id, !row.active);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this coach CC email?")) return;
    try {
      await deleteJoinNotifyEmail(id);
      toast.success("Removed");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    }
  }

  async function copySql() {
    try {
      await navigator.clipboard.writeText(JOIN_NOTIFY_SETUP_SQL);
      toast.success("SQL copied — paste into Supabase SQL Editor and Run");
    } catch {
      toast.error("Copy supabase/setup-join-notify-emails.sql manually");
    }
  }

  return (
    <AdminQuickShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">Coach CC emails</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            These addresses are CC&apos;d when you email parents from{" "}
            <Link to="/admin/broadcast" className="text-forest underline">
              Broadcast
            </Link>
            , notified on{" "}
            <Link to="/join" className="text-forest underline">
              Join
            </Link>{" "}
            form submissions, and included on consent reminders.
          </p>
        </div>
        <Link to="/admin/broadcast" className="btn-outline text-sm">
          Back to broadcast
        </Link>
      </div>

      {needsSetup && (
        <div className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-medium">One-time setup required</p>
          <p className="mt-1">
            Run <code className="rounded bg-white/70 px-1">supabase/setup-join-notify-emails.sql</code>{" "}
            in Supabase to create the coach email list.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={SQL_EDITOR_URL} target="_blank" rel="noreferrer" className="btn-outline gap-2">
              <ExternalLink size={16} /> Open SQL Editor
            </a>
            <button type="button" className="btn-outline" onClick={copySql}>
              Copy SQL
            </button>
            <button type="button" className="btn-outline" onClick={load}>
              Check again
            </button>
          </div>
        </div>
      )}

      {!needsSetup && (
        <>
          <div className="mb-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg">Add coach email</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2"
                  placeholder="coach@example.com"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Label (optional)</span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2"
                  placeholder="Jaime — head coach"
                />
              </label>
              <button
                type="button"
                className="btn-primary gap-2"
                disabled={busy}
                onClick={addEmail}
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card">
            {rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No coach CC emails yet. Add at least one above.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Mail size={18} className="mt-0.5 shrink-0 text-forest" />
                      <div>
                        <p className="font-medium text-foreground">{row.email}</p>
                        {row.label ? (
                          <p className="text-sm text-muted-foreground">{row.label}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={row.active}
                          onChange={() => toggleActive(row)}
                          className="h-4 w-4 accent-forest"
                        />
                        Active
                      </label>
                      <button
                        type="button"
                        className="btn-outline px-3"
                        onClick={() => remove(row.id)}
                        aria-label={`Remove ${row.email}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </AdminQuickShell>
  );
}
