import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminReviewPage } from "@/components/admin/AdminShell";
import {
  deleteParentContact,
  fetchFamilyRosterAdmin,
  isParentContactsSetupMissing,
  parentContactsErrorMessage,
  saveParentContact,
  saveParticipantDetails,
  type FamilyRosterRow,
  type ParentContact,
} from "@/lib/parent-contacts";
import { toast } from "sonner";
import { Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/parent-contacts")({
  component: AdminParentContactsPage,
});

const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new";

async function copySetupHint() {
  try {
    await navigator.clipboard.writeText(
      "Open supabase/setup-parent-contacts.sql in the project, copy all, paste into Supabase SQL Editor, Run.",
    );
    toast.success("Reminder copied — open setup-parent-contacts.sql and run it in Supabase");
  } catch {
    toast.error("Open supabase/setup-parent-contacts.sql and run it in the SQL Editor");
  }
}

function formatDob(value: string): string {
  if (!value) return "—";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AdminParentContactsPage() {
  const [rows, setRows] = useState<FamilyRosterRow[]>([]);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [editingKid, setEditingKid] = useState<FamilyRosterRow | null>(null);
  const [editingParent, setEditingParent] = useState<{
    kid: FamilyRosterRow;
    parent: ParentContact | null;
  } | null>(null);

  async function load() {
    try {
      setRows(await fetchFamilyRosterAdmin());
      setNeedsSetup(false);
    } catch (e) {
      if (isParentContactsSetupMissing(e)) {
        setNeedsSetup(true);
      } else {
        toast.error(parentContactsErrorMessage(e));
      }
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminReviewPage
      active="parent-contacts"
      title="Parents info"
      description="Private coach roster — kid + parent contacts. Not shown on the public site."
    >
      {needsSetup && (
        <div className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-medium">One-time setup required</p>
          <p className="mt-1">
            Run <code className="rounded bg-white/70 px-1">supabase/setup-parent-contacts.sql</code>{" "}
            in the Supabase SQL Editor (seeds all current teammates).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={SQL_EDITOR_URL} target="_blank" rel="noreferrer" className="btn-outline gap-2">
              <ExternalLink size={16} /> Open SQL Editor
            </a>
            <button type="button" className="btn-outline gap-2" onClick={copySetupHint}>
              <Copy size={16} /> How to run
            </button>
            <button type="button" className="btn-outline" onClick={load}>
              Check again
            </button>
          </div>
        </div>
      )}

      {!needsSetup && editingKid && (
        <KidForm
          initial={editingKid}
          onCancel={() => setEditingKid(null)}
          onSave={async (payload) => {
            await saveParticipantDetails(payload);
            toast.success("Kid contact updated");
            setEditingKid(null);
            load();
          }}
        />
      )}

      {!needsSetup && editingParent && (
        <ParentForm
          kidName={editingParent.kid.kidName}
          teamMemberId={editingParent.kid.teamMemberId}
          initial={editingParent.parent}
          nextSort={
            editingParent.parent?.sortOrder ??
            (editingParent.kid.parents.length > 0
              ? Math.max(...editingParent.kid.parents.map((p) => p.sortOrder)) + 1
              : 1)
          }
          onCancel={() => setEditingParent(null)}
          onSave={async (payload) => {
            await saveParentContact(payload);
            toast.success(payload.id ? "Parent updated" : "Parent added");
            setEditingParent(null);
            load();
          }}
        />
      )}

      {!needsSetup && (
        <div className="space-y-5">
          {rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              No teammates yet — add kids under Admin → Our Team first.
            </p>
          ) : (
            rows.map((row) => (
              <article
                key={row.teamMemberId}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-sand/50 px-5 py-4">
                  <div>
                    <h2 className="font-display text-xl text-foreground">{row.kidName}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      DOB {formatDob(row.dateOfBirth)}
                      {row.email ? ` · ${row.email}` : ""}
                      {row.phone ? ` · ${row.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-outline gap-1.5 !px-3 !py-1.5 text-xs"
                      onClick={() => {
                        setEditingParent(null);
                        setEditingKid(row);
                      }}
                    >
                      <Pencil size={14} /> Edit kid
                    </button>
                    <button
                      type="button"
                      className="btn-outline gap-1.5 !px-3 !py-1.5 text-xs"
                      onClick={() => {
                        setEditingKid(null);
                        setEditingParent({ kid: row, parent: null });
                      }}
                    >
                      <Plus size={14} /> Add parent
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr>
                        <th className="p-3">Parent name</th>
                        <th className="p-3">Relation</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Email</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {row.parents.length === 0 ? (
                        <tr className="border-t border-border">
                          <td colSpan={5} className="p-4 text-muted-foreground">
                            No parents listed yet.
                          </td>
                        </tr>
                      ) : (
                        row.parents.map((p) => (
                          <tr key={p.id} className="border-t border-border">
                            <td className="p-3 font-medium">{p.parentName}</td>
                            <td className="p-3 text-muted-foreground">{p.relation}</td>
                            <td className="p-3 text-muted-foreground">{p.phone || "—"}</td>
                            <td className="p-3 text-muted-foreground">{p.email || "—"}</td>
                            <td className="p-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  className="btn-outline gap-1 !px-2.5 !py-1 text-xs"
                                  onClick={() => {
                                    setEditingKid(null);
                                    setEditingParent({ kid: row, parent: p });
                                  }}
                                >
                                  <Pencil size={14} /> Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-outline gap-1 !px-2.5 !py-1 text-xs text-destructive"
                                  onClick={async () => {
                                    if (!confirm(`Remove ${p.parentName}?`)) return;
                                    try {
                                      await deleteParentContact(p.id);
                                      toast.success("Parent removed");
                                      load();
                                    } catch (e) {
                                      toast.error(parentContactsErrorMessage(e));
                                    }
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </AdminReviewPage>
  );
}

function KidForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: FamilyRosterRow;
  onSave: (payload: {
    teamMemberId: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mb-6 space-y-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave({
            teamMemberId: initial.teamMemberId,
            email,
            phone,
            dateOfBirth,
          });
        } catch (err) {
          toast.error(parentContactsErrorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3 className="font-display text-xl">Edit kid — {initial.kidName}</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Phone
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Date of birth
          </span>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ParentForm({
  kidName,
  teamMemberId,
  initial,
  nextSort,
  onSave,
  onCancel,
}: {
  kidName: string;
  teamMemberId: string;
  initial: ParentContact | null;
  nextSort: number;
  onSave: (payload: {
    id?: string;
    teamMemberId: string;
    parentName: string;
    relation: string;
    phone: string;
    email: string;
    sortOrder: number;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [parentName, setParentName] = useState(initial?.parentName ?? "");
  const [relation, setRelation] = useState(initial?.relation ?? "Parent");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? nextSort);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mb-6 space-y-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave({
            id: initial?.id,
            teamMemberId,
            parentName,
            relation,
            phone,
            email,
            sortOrder,
          });
        } catch (err) {
          toast.error(parentContactsErrorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3 className="font-display text-xl">
        {initial ? "Edit parent" : "Add parent"} — {kidName}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Parent name
          </span>
          <input
            required
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Relation
          </span>
          <input
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="Parent 1, Mother, Father…"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Order
          </span>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Phone
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}
