import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AdminReviewPage } from "@/components/admin/AdminShell";
import {
  deleteSponsor,
  fetchAllSponsorsAdmin,
  saveSponsor,
  type Sponsor,
} from "@/lib/sponsors";
import { uploadProfilePhoto } from "@/lib/profile-photos";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/sponsors")({
  component: AdminSponsorsPage,
});

function AdminSponsorsPage() {
  const [rows, setRows] = useState<Sponsor[]>([]);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      setRows(await fetchAllSponsorsAdmin());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load sponsors");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminReviewPage
      active="sponsors"
      title="Sponsors"
      description="Add or edit sponsors — logo, name, and description shown on the Sponsors page."
      toolbar={
        <button
          type="button"
          className="btn-primary gap-2"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={16} /> Add sponsor
        </button>
      }
    >
      {showForm && (
        <SponsorForm
          initial={editing}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={async (payload) => {
            await saveSponsor(payload);
            toast.success(payload.id ? "Sponsor updated" : "Sponsor added");
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-sand text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3">Logo</th>
              <th className="p-3">Name</th>
              <th className="p-3">Description</th>
              <th className="p-3">Order</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="p-3">
                  {row.logoUrl ? (
                    <img src={row.logoUrl} alt="" className="h-12 w-12 rounded-lg object-contain bg-sand" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-sand text-xs text-muted-foreground">
                      —
                    </div>
                  )}
                </td>
                <td className="p-3 font-medium">{row.name}</td>
                <td className="max-w-md p-3 text-muted-foreground">
                  {row.description || <span className="italic">Placeholder</span>}
                </td>
                <td className="p-3 text-muted-foreground">{row.sortOrder ?? 0}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn-outline !px-3 !py-1.5"
                      onClick={() => {
                        setEditing(row);
                        setShowForm(true);
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-outline !px-3 !py-1.5"
                      onClick={async () => {
                        if (!confirm(`Delete ${row.name}?`)) return;
                        try {
                          await deleteSponsor(row.id);
                          toast.success("Deleted");
                          load();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Delete failed");
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No sponsors yet. Add one, or run setup-sponsors.sql.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminReviewPage>
  );
}

function SponsorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Sponsor | null;
  onSave: (payload: {
    id?: string;
    name: string;
    description?: string | null;
    logoUrl?: string | null;
    sortOrder?: number;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "Coming soon");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form
      className="mb-8 space-y-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave({
            id: initial?.id,
            name,
            description,
            logoUrl: logoUrl || null,
            sortOrder: Number(sortOrder) || 0,
          });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Logo
          </label>
          <div className="overflow-hidden rounded-xl border border-border bg-sand">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="aspect-square w-full object-contain p-2" />
            ) : (
              <div className="grid aspect-square place-items-center text-xs text-muted-foreground">
                No logo
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                const url = await uploadProfilePhoto(file, "sponsors", initial?.id);
                setLogoUrl(url);
                toast.success("Logo uploaded");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-outline mt-2 !px-2.5 !py-1 text-xs"
          >
            Choose file
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              placeholder="Optional — leave blank for placeholder text"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sort order
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-32 rounded-xl border border-border bg-background px-3 py-2"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? "Saving…" : initial ? "Save changes" : "Add sponsor"}
        </button>
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
