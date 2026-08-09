import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminReviewPage } from "@/components/admin/AdminShell";
import {
  deleteCalendarEvent,
  fetchAllCalendarAdmin,
  saveCalendarEvent,
  type CalendarAdminRow,
} from "@/lib/calendar-admin";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/calendar")({
  component: AdminCalendarPage,
});

type DraftRow = {
  key: string;
  id?: string;
  event_date: string;
  title: string;
  agenda: string;
  location: string;
  start_time: string;
  end_time: string;
  dirty?: boolean;
};

function toDraft(row: CalendarAdminRow): DraftRow {
  return {
    key: row.id,
    id: row.id,
    event_date: row.event_date,
    title: row.title,
    agenda: row.agenda ?? "",
    location: row.location ?? "",
    start_time: (row.start_time ?? "").slice(0, 5),
    end_time: (row.end_time ?? "").slice(0, 5),
  };
}

function emptyDraft(): DraftRow {
  const today = new Date().toISOString().slice(0, 10);
  return {
    key: `new-${crypto.randomUUID()}`,
    event_date: today,
    title: "",
    agenda: "",
    location: "",
    start_time: "15:00",
    end_time: "17:00",
    dirty: true,
  };
}

function AdminCalendarPage() {
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    try {
      const data = await fetchAllCalendarAdmin();
      setRows(data.map(toDraft));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load calendar");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch, dirty: true } : r)));
  }

  async function saveRow(row: DraftRow) {
    if (!row.event_date || !row.title.trim()) {
      toast.error("Date and title are required");
      return;
    }
    setSavingKey(row.key);
    try {
      await saveCalendarEvent({
        id: row.id,
        event_date: row.event_date,
        title: row.title,
        agenda: row.agenda,
        location: row.location,
        start_time: row.start_time || null,
        end_time: row.end_time || null,
      });
      toast.success(row.id ? "Saved" : "Added");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <AdminReviewPage
      active="calendar"
      title="Calendar"
      description="Source of truth for the public Calendar page and homepage “Next” strip. Add, edit, or delete rows here — the website shows only what’s saved in this table."
      toolbar={
        <button
          type="button"
          className="btn-primary gap-2"
          onClick={() => setRows((prev) => [...prev, emptyDraft()])}
        >
          <Plus size={16} /> Add row
        </button>
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-[960px] w-full text-sm">
          <thead className="bg-sand text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Title</th>
              <th className="p-3">Agenda</th>
              <th className="p-3">Location</th>
              <th className="p-3">Start</th>
              <th className="p-3">End</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-border align-top">
                <td className="p-2">
                  <input
                    type="date"
                    value={row.event_date}
                    onChange={(e) => updateRow(row.key, { event_date: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  />
                </td>
                <td className="p-2">
                  <input
                    value={row.title}
                    onChange={(e) => updateRow(row.key, { title: e.target.value })}
                    className="w-full min-w-[140px] rounded-lg border border-border bg-background px-2 py-1.5"
                    placeholder="Title"
                  />
                </td>
                <td className="p-2">
                  <textarea
                    rows={2}
                    value={row.agenda}
                    onChange={(e) => updateRow(row.key, { agenda: e.target.value })}
                    className="w-full min-w-[200px] rounded-lg border border-border bg-background px-2 py-1.5"
                    placeholder="Agenda"
                  />
                </td>
                <td className="p-2">
                  <input
                    value={row.location}
                    onChange={(e) => updateRow(row.key, { location: e.target.value })}
                    className="w-full min-w-[120px] rounded-lg border border-border bg-background px-2 py-1.5"
                    placeholder="Location"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="time"
                    value={row.start_time}
                    onChange={(e) => updateRow(row.key, { start_time: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="time"
                    value={row.end_time}
                    onChange={(e) => updateRow(row.key, { end_time: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
                  />
                </td>
                <td className="p-2">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn-primary !px-3 !py-1.5 gap-1"
                      disabled={savingKey === row.key}
                      onClick={() => saveRow(row)}
                    >
                      <Save size={14} />
                      {savingKey === row.key ? "…" : "Save"}
                    </button>
                    {row.id && (
                      <button
                        type="button"
                        className="btn-outline !px-3 !py-1.5"
                        onClick={async () => {
                          if (!confirm("Delete this calendar row?")) return;
                          try {
                            await deleteCalendarEvent(row.id!);
                            toast.success("Deleted");
                            load();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Delete failed");
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {!row.id && (
                      <button
                        type="button"
                        className="btn-outline !px-3 !py-1.5"
                        onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No calendar rows. Click Add row, or run setup-calendar.sql.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminReviewPage>
  );
}
