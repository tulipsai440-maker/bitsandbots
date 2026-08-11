import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminQuickShell } from "@/components/admin/AdminQuickShell";
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
import { fetchMediaConsentedMemberIds } from "@/lib/parent-consent";
import { toast } from "sonner";
import { Copy, ExternalLink, Pencil, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

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
  const [consentedIds, setConsentedIds] = useState<Set<string>>(new Set());
  const [needsSetup, setNeedsSetup] = useState(false);
  const [editingKid, setEditingKid] = useState<FamilyRosterRow | null>(null);
  const [editingParent, setEditingParent] = useState<{
    kid: FamilyRosterRow;
    parent: ParentContact | null;
  } | null>(null);

  async function load() {
    try {
      const [roster, consented] = await Promise.all([
        fetchFamilyRosterAdmin(),
        fetchMediaConsentedMemberIds(),
      ]);
      setRows(roster);
      setConsentedIds(new Set(consented.map((id) => id.toLowerCase())));
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
    const refresh = () => load();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
    return () => {
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <AdminQuickShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Parents</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          One place for every family — kid details plus <strong className="text-foreground">both
          parents</strong> with separate emails for broadcast and reminders. Media consent status is
          shown per teammate.
        </p>
      </div>

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
            rows.map((row) => {
              const parentEmails = row.parents.filter((p) => p.email.trim().includes("@"));
              const hasBothParents = parentEmails.length >= 2;
              const hasConsent = consentedIds.has(row.teamMemberId.toLowerCase());

              return (
              <article
                key={row.teamMemberId}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-sand/50 px-5 py-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl text-foreground">{row.kidName}</h2>
                      {hasConsent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest">
                          <CheckCircle2 size={12} /> Consent signed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                          <AlertCircle size={12} /> Consent needed
                        </span>
                      )}
                      {!hasBothParents && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                          Add Parent {parentEmails.length === 0 ? "1 & 2" : "2"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      DOB {formatDob(row.dateOfBirth)}
                      {row.email ? ` · Kid email: ${row.email}` : ""}
                      {row.phone ? ` · Kid phone: ${row.phone}` : ""}
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
                        <th className="p-3">Parent</th>
                        <th className="p-3">Relation</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Email (broadcast)</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {row.parents.length === 0 ? (
                        <tr className="border-t border-border">
                          <td colSpan={5} className="p-4 text-muted-foreground">
                            No parents yet — add Parent 1 and Parent 2 so both receive team emails.
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
            );
            })
          )}
        </div>
      )}
    </AdminQuickShell>
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
  const defaultRelation =
    initial?.relation ??
    (nextSort === 1 ? "Parent 1" : nextSort === 2 ? "Parent 2" : `Parent ${nextSort}`);
  const [parentName, setParentName] = useState(initial?.parentName ?? "");
  const [relation, setRelation] = useState(defaultRelation);
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
            placeholder="Parent 1, Parent 2, Mother, Father…"
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
