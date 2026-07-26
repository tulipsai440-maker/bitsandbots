import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminReviewPage, FilterToggle } from "@/components/admin/AdminShell";
import { ScoutmasterForm, statusBadge } from "@/components/admin/content-forms";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllScoutmasters, type ContentStatus, type ScoutmasterRow } from "@/lib/content";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/scoutmasters")({
  component: AdminScoutmastersPage,
});

function AdminScoutmastersPage() {
  const [filter, setFilter] = useState<"pending" | "all">("all");
  const [scoutmasters, setScoutmasters] = useState<ScoutmasterRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScoutmasterRow | null>(null);

  async function load() {
    try {
      setScoutmasters(await fetchAllScoutmasters());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pendingCount = useMemo(
    () => scoutmasters.filter((s) => s.status === "pending").length,
    [scoutmasters],
  );
  const filtered = useMemo(
    () => (filter === "pending" ? scoutmasters.filter((s) => s.status === "pending") : scoutmasters),
    [scoutmasters, filter],
  );

  async function review(id: string, status: ContentStatus) {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("scoutmasters")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userData.user?.id ?? null,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Scoutmaster approved" : "Submission rejected");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this Scoutmaster entry?")) return;
    const { error } = await supabase.from("scoutmasters").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  return (
    <AdminReviewPage
      active="scoutmasters"
      title="Scoutmasters Review"
      description="Approve, edit, or add Scoutmaster profiles and Class A headshots for the About page."
      toolbar={
        <>
          <FilterToggle filter={filter} setFilter={setFilter} pendingCount={pendingCount} />
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="btn-primary gap-2"
          >
            <Plus size={16} /> Add Scoutmaster
          </button>
        </>
      }
    >
      {showForm && (
        <ScoutmasterForm
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

      <div className={`overflow-hidden rounded-2xl border border-border bg-card ${showForm ? "mt-8" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-sand text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3">Photo</th>
              <th className="p-3">Name</th>
              <th className="p-3">Years</th>
              <th className="p-3">Bio</th>
              <th className="p-3">Status</th>
              <th className="p-3">Submitted by</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-border align-top">
                <td className="p-3">
                  {row.photo_url ? (
                    <img
                      src={row.photo_url}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover object-top ring-1 ring-border"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3 font-medium">{row.name}</td>
                <td className="p-3 whitespace-nowrap">{row.years}</td>
                <td className="p-3 max-w-xs text-muted-foreground">{row.bio || "—"}</td>
                <td className="p-3">{statusBadge(row.status)}</td>
                <td className="p-3 text-muted-foreground">{row.submitted_by_email || "—"}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  {row.status === "pending" && (
                    <>
                      <button
                        onClick={() => review(row.id, "approved")}
                        className="mr-1 rounded-md p-2 text-forest hover:bg-forest/10"
                        aria-label="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => review(row.id, "rejected")}
                        className="mr-1 rounded-md p-2 text-destructive hover:bg-destructive/10"
                        aria-label="Reject"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setEditing(row);
                      setShowForm(true);
                    }}
                    className="mr-1 rounded-md p-2 hover:bg-muted"
                    aria-label="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => remove(row.id)}
                    className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  {filter === "pending" ? "No pending Scoutmaster submissions." : "No Scoutmaster entries yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminReviewPage>
  );
}
