import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { AdminNav } from "@/components/site/AdminNav";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin";
import { fetchAllJoinNotifyEmails, isJoinNotifyTableMissingError, JOIN_NOTIFY_SETUP_SQL, type JoinNotifyEmailRow } from "@/lib/join-notify-emails";
import { toast } from "sonner";
import { AlertTriangle, Copy, ExternalLink, LogOut, Mail, Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/join-notifications")({
  component: AdminJoinNotificationsPage,
});

function AdminJoinNotificationsPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<JoinNotifyEmailRow[]>([]);
  const [editing, setEditing] = useState<JoinNotifyEmailRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);

  async function load() {
    try {
      setRows(await fetchAllJoinNotifyEmails());
      setTableMissing(false);
    } catch (e) {
      if (isJoinNotifyTableMissingError(e)) {
        setTableMissing(true);
        setRows([]);
        return;
      }
      toast.error(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function remove(id: string) {
    if (!confirm("Remove this notification email?")) return;
    const { error } = await supabase.from("join_notify_emails").delete().eq("id", id);
    if (error) {
      if (isJoinNotifyTableMissingError(error)) {
        setTableMissing(true);
        return toast.error("Database table not set up yet — run the SQL below first.");
      }
      return toast.error(error.message);
    }
    toast.success("Removed");
    load();
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
        <PageHero eyebrow="Admin" title="Admin access required" description="Your account is signed in but not yet an admin." />
        <div className="container-page pb-20">
          <button onClick={signOut} className="btn-outline mt-6 gap-2">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </SiteLayout>
    );
  }

  const activeCount = rows.filter((r) => r.active).length;

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Admin"
        title="Join form notifications"
        description="Master list of email addresses notified when someone submits the Join Us form. Add, update, or remove recipients anytime."
      />
      <section className="py-12">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <AdminNav active="join-notifications" />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
                disabled={tableMissing}
                className="btn-primary gap-2 disabled:opacity-50"
              >
                <Plus size={16} /> Add email
              </button>
              <button onClick={signOut} className="btn-outline gap-2">
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>

          {tableMissing && <JoinNotifySetupBanner onRetry={load} />}

          {!tableMissing && (
            <div className="mb-6 rounded-xl border border-border bg-sand/60 px-5 py-4 text-sm text-foreground/85">
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-forest" />
                <div>
                  <p className="font-medium">
                    {activeCount === 0
                      ? "No active recipients — join submissions will not send email until you add one."
                      : `${activeCount} active recipient${activeCount === 1 ? "" : "s"} will be notified on each join form submission.`}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Inactive entries stay in the list but are skipped when the form is submitted.
                    When you add a new address, that inbox may need to click a one-time FormSubmit activation link after the first join form test.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!tableMissing && showForm && (
            <JoinNotifyEmailForm
              initial={editing}
              onDone={() => {
                setShowForm(false);
                setEditing(null);
                load();
              }}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          )}

          {!tableMissing && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-sand text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Label</th>
                  <th className="p-3">Active</th>
                  <th className="p-3">Order</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 font-medium">{r.email}</td>
                    <td className="p-3 text-muted-foreground">{r.label || "—"}</td>
                    <td className="p-3">{r.active ? "Yes" : "No"}</td>
                    <td className="p-3 text-muted-foreground">{r.sort_order}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setEditing(r);
                          setShowForm(true);
                        }}
                        className="mr-1 rounded-md p-2 hover:bg-muted"
                        aria-label="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      No notification emails yet. Add one to start receiving join form submissions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function JoinNotifySetupBanner({ onRetry }: { onRetry: () => void }) {
  const sqlEditorUrl =
    "https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new";

  async function copySql() {
    try {
      await navigator.clipboard.writeText(JOIN_NOTIFY_SETUP_SQL);
      toast.success("SQL copied — paste into Supabase SQL Editor and click Run");
    } catch {
      toast.error("Could not copy — open supabase/setup-join-notify-emails.sql in the project");
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-50 px-6 py-5 text-sm dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-700" />
        <div className="space-y-3">
          <div>
            <p className="font-medium text-amber-950 dark:text-amber-100">One-time database setup required</p>
            <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
              The <code className="rounded bg-amber-100 px-1">join_notify_emails</code> table does not exist in Supabase yet.
              Run the setup SQL once, then come back and click “Check again”.
            </p>
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-amber-900/80 dark:text-amber-100/80">
            <li>Open Supabase SQL Editor</li>
            <li>Copy the setup SQL (button below)</li>
            <li>Paste and click <strong>Run</strong></li>
            <li>Return here and click <strong>Check again</strong></li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <a href={sqlEditorUrl} target="_blank" rel="noreferrer" className="btn-primary gap-2">
              <ExternalLink size={16} /> Open SQL Editor
            </a>
            <button type="button" onClick={copySql} className="btn-outline gap-2">
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

function JoinNotifyEmailForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: JoinNotifyEmailRow | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState(initial?.email ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0));
  const [busy, setBusy] = useState(false);
  const field = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const labelClass = "text-xs font-medium uppercase tracking-widest text-muted-foreground";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      email: email.trim().toLowerCase(),
      label: label.trim() || null,
      active,
      sort_order: Number.parseInt(sortOrder, 10) || 0,
    };
    const { error } = initial
      ? await supabase.from("join_notify_emails").update(payload).eq("id", initial.id)
      : await supabase.from("join_notify_emails").insert(payload);
    setBusy(false);
    if (error) {
      if (isJoinNotifyTableMissingError(error)) {
        return toast.error("Database table not set up yet — run the SQL setup first.");
      }
      return toast.error(error.message);
    }
    toast.success(initial ? "Updated" : "Added");
    onDone();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass}>Email address</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            placeholder="leader@example.com"
          />
        </div>
        <div>
          <label className={labelClass}>Label (optional)</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={field}
            placeholder="Troop leader"
          />
        </div>
        <div>
          <label className={labelClass}>Sort order</label>
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={field}
          />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input id="notify-active" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <label htmlFor="notify-active" className="text-sm">
            Active — receive join form notifications
          </label>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary">
          {initial ? "Save" : "Add email"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}
