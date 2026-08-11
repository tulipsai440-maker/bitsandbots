import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteCalendarEvent,
  fetchAllCalendarAdmin,
  saveCalendarEvent,
  type CalendarAdminRow,
} from "@/lib/calendar-admin";
import { useAdminEdit } from "./AdminEditProvider";

type DraftRow = {
  key: string;
  id?: string;
  event_date: string;
  title: string;
  agenda: string;
  location: string;
  start_time: string;
  end_time: string;
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
  return {
    key: `new-${crypto.randomUUID()}`,
    event_date: new Date().toISOString().slice(0, 10),
    title: "",
    agenda: "",
    location: "",
    start_time: "15:00",
    end_time: "17:00",
  };
}

/** Inline calendar editor — add / edit / delete rows on the Calendar page. */
export function CalendarEventEditor({
  onChanged,
  standalone = false,
}: {
  onChanged?: () => void;
  /** When true, admin-only view — no extra wrapper chrome. */
  standalone?: boolean;
}) {
  const { canInlineEdit } = useAdminEdit();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAllCalendarAdmin();
      setRows(data.map(toDraft));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load calendar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canInlineEdit) load();
  }, [canInlineEdit]);

  if (!canInlineEdit) return null;

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
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
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSavingKey(null);
    }
  }

  async function removeRow(row: DraftRow) {
    if (!row.id) {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      return;
    }
    if (!confirm("Delete this event?")) return;
    try {
      await deleteCalendarEvent(row.id);
      toast.success("Deleted");
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <div className={standalone ? "" : "mt-10 rounded-2xl border border-forest/25 bg-forest/[0.03] p-4 md:p-6"}>
      <div className={`flex flex-wrap items-center gap-3 ${standalone ? "mb-4 justify-between" : "justify-between"}`}>
        {standalone ? (
          <h1 className="font-display text-3xl text-foreground md:text-4xl">Team calendar</h1>
        ) : (
          <div>
            <h2 className="font-display text-xl text-foreground">Edit calendar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add or update events here.</p>
          </div>
        )}
        <button
          type="button"
          className={`btn-primary gap-2 ${standalone ? "" : "ml-auto"}`}
          onClick={() => setRows((prev) => [...prev, emptyDraft()])}
        >
          <Plus size={16} /> Add event
        </button>
      </div>

      {loading ? (
        <p className={`text-sm text-muted-foreground ${standalone ? "" : "mt-6"}`}>Loading…</p>
      ) : (
        <div className={`overflow-x-auto rounded-xl border border-border bg-card ${standalone ? "" : "mt-6"}`}>
          <table className="min-w-[880px] w-full text-sm">
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
                      className="w-full min-w-[180px] rounded-lg border border-border bg-background px-2 py-1.5"
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
                      <button type="button" className="btn-outline !px-3 !py-1.5" onClick={() => removeRow(row)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No events yet. Click Add event.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
