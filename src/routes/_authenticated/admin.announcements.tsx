import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { AdminNav } from "@/components/site/AdminNav";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin";
import { fetchAllAnnouncements, type AnnouncementRow } from "@/lib/announcements";
import { toast } from "sonner";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  component: AdminAnnouncementsPage,
});

function AdminAnnouncementsPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      setRows(await fetchAllAnnouncements());
    } catch (e) {
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
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
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

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Admin"
        title="Manage announcements"
        description="Updates shown in the home page sidebar. Uncheck “Show on home page” to hide without deleting."
      />
      <section className="py-12">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <AdminNav active="announcements" />
            <div className="flex gap-2">
              <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary gap-2">
                <Plus size={16} /> New announcement
              </button>
              <button onClick={signOut} className="btn-outline gap-2">
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>

          {showForm && (
            <AnnouncementForm
              initial={editing}
              onDone={() => { setShowForm(false); setEditing(null); load(); }}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          )}

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-sand text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="p-3">Published</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Message</th>
                  <th className="p-3">Active</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {new Date(r.published_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 font-medium">{r.title}</td>
                    <td className="p-3 max-w-xl text-muted-foreground">{r.body}</td>
                    <td className="p-3">{r.active ? "Yes" : "No"}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => { setEditing(r); setShowForm(true); }}
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
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">No announcements yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function AnnouncementForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: AnnouncementRow | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [busy, setBusy] = useState(false);
  const field = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const label = "text-xs font-medium uppercase tracking-widest text-muted-foreground";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const trimmedBody = body.trim();
    const payload = {
      title: title.trim() || trimmedBody.slice(0, 80),
      body: trimmedBody,
      expires_at: active ? null : new Date().toISOString(),
      ...(initial ? {} : { published_at: new Date().toISOString() }),
    };
    const { error } = initial
      ? await supabase.from("announcements").update(payload).eq("id", initial.id)
      : await supabase.from("announcements").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Updated" : "Created");
    onDone();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4">
        <div>
          <label className={label}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={field}
            placeholder="Optional — first line of message is used if blank"
          />
        </div>
        <div>
          <label className={label}>Message</label>
          <textarea required value={body} onChange={(e) => setBody(e.target.value)} className={field} rows={3} />
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <label htmlFor="active" className="text-sm">Show on home page</label>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary">{initial ? "Save" : "Create"}</button>
        <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>
      </div>
    </form>
  );
}
