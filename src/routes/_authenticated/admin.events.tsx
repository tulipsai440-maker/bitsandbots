import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { AdminNav } from "@/components/site/AdminNav";
import { checkIsAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllSupabaseEvents, type EventRow } from "@/lib/events";
import { toast } from "sonner";
import { Trash2, Pencil, Plus, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/events")({
  component: AdminEventsPage,
});

const TYPES = ["Meeting", "Ceremony", "Campout", "Deadline", "Service", "Other"] as const;

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminEventsPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function checkRole() {
    setIsAdmin(await checkIsAdmin());
  }

  async function load() {
    try {
      setEvents(await fetchAllSupabaseEvents());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    checkRole();
    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function remove(id: string) {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
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
          <div className="rounded-2xl border border-border bg-card p-8">
            <p className="text-sm text-muted-foreground">
              Ask a current troop leader to grant your account admin access. Once granted, refresh this page.
            </p>
            <button onClick={signOut} className="btn-outline mt-6 gap-2"><LogOut size={16} /> Sign out</button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero eyebrow="Admin" title="Manage events" description="Supabase events shown here. Public Calendar and Events pages use the Band app feed when BAND_ICAL_URL is set." />
      <section className="py-12">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <AdminNav active="events" />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setEditing(null); setShowForm(true); }}
                className="btn-primary gap-2"
              >
                <Plus size={16} /> New event
              </button>
              <button onClick={signOut} className="btn-outline gap-2"><LogOut size={16} /> Sign out</button>
            </div>
          </div>

          {showForm && (
            <EventForm
              initial={editing}
              onDone={() => { setShowForm(false); setEditing(null); load(); }}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          )}

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-sand text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Location</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">{new Date(e.starts_at).toLocaleString()}</td>
                    <td className="p-3 font-medium">{e.title}</td>
                    <td className="p-3">{e.type}</td>
                    <td className="p-3 text-muted-foreground">{e.location}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => { setEditing(e); setShowForm(true); }}
                        className="mr-2 rounded-md p-2 hover:bg-muted"
                        aria-label="Edit"
                      ><Pencil size={16} /></button>
                      <button
                        onClick={() => remove(e.id)}
                        className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                        aria-label="Delete"
                      ><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No events yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function EventForm({ initial, onDone, onCancel }: { initial: EventRow | null; onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState(initial?.type ?? "Meeting");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.ends_at ?? null));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [bandUrl, setBandUrl] = useState(initial?.band_url ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      title,
      type,
      location: location || null,
      description: description || null,
      band_url: bandUrl || null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    };
    const { error } = initial
      ? await supabase.from("events").update(payload).eq("id", initial.id)
      : await supabase.from("events").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Updated" : "Created");
    onDone();
  }

  const field = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const label = "text-xs font-medium uppercase tracking-widest text-muted-foreground";

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={label}>Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Starts at</label>
          <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Ends at (optional)</label>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={field} />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Band app URL (optional)</label>
          <input value={bandUrl} onChange={(e) => setBandUrl(e.target.value)} className={field} placeholder="https://band.us/..." />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={field} rows={3} />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary">{initial ? "Save" : "Create"}</button>
        <button type="button" onClick={onCancel} className="btn-outline">Cancel</button>
      </div>
    </form>
  );
}
