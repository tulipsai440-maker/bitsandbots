import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminReviewPage, FilterToggle } from "@/components/admin/AdminShell";
import { EagleForm, statusBadge } from "@/components/admin/content-forms";
import { supabase } from "@/integrations/supabase/client";
import {
  countApprovedEagleScouts,
  fetchAllEagleScouts,
  rankEagleScouts,
  type ContentStatus,
  type EagleScoutRow,
} from "@/lib/content";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/eagle-scouts")({
  component: AdminEagleScoutsPage,
});

function AdminEagleScoutsPage() {
  const [filter, setFilter] = useState<"pending" | "all">("all");
  const [eagles, setEagles] = useState<EagleScoutRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EagleScoutRow | null>(null);

  async function load() {
    try {
      setEagles(await fetchAllEagleScouts());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pendingCount = useMemo(() => eagles.filter((e) => e.status === "pending").length, [eagles]);
  const approvedCount = useMemo(() => countApprovedEagleScouts(eagles), [eagles]);
  const rankById = useMemo(() => {
    const ranked = rankEagleScouts(eagles.filter((e) => e.status === "approved"));
    return new Map(ranked.map((e) => [e.id, e.rank]));
  }, [eagles]);
  const filtered = useMemo(
    () => (filter === "pending" ? eagles.filter((e) => e.status === "pending") : eagles),
    [eagles, filter],
  );

  async function review(id: string, status: ContentStatus) {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("eagle_scouts")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userData.user?.id ?? null,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Eagle Scout approved" : "Submission rejected");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this Eagle Scout entry?")) return;
    const { error } = await supabase.from("eagle_scouts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  return (
    <AdminReviewPage
      active="eagle-scouts"
      title="Eagle Scouts Review"
      description={`Approve, edit, or add Eagle Scout entries before they appear on the public site. ${approvedCount} approved on the public roll.`}
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
            <Plus size={16} /> Add Eagle Scout
          </button>
        </>
      }
    >
      {showForm && (
        <EagleForm
          initial={editing}
          onDone={() => {
            setShowForm(false);
            setEditing(null);
            setFilter("all");
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
              <th className="p-3">#</th>
              <th className="p-3">Year</th>
              <th className="p-3">Name</th>
              <th className="p-3">Project</th>
              <th className="p-3">Status</th>
              <th className="p-3">Submitted by</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-border align-top">
                <td className="p-3 whitespace-nowrap tabular-nums text-muted-foreground">
                  {row.status === "approved" ? `#${rankById.get(row.id)}` : "—"}
                </td>
                <td className="p-3 whitespace-nowrap">{row.year}</td>
                <td className="p-3 font-medium">{row.name}</td>
                <td className="p-3 max-w-xs text-muted-foreground">{row.project}</td>
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
                  {filter === "pending" ? "No pending Eagle Scout submissions." : "No Eagle Scout entries yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminReviewPage>
  );
}
