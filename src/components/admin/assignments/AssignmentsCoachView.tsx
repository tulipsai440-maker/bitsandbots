import { useEffect, useMemo, useState } from "react";
import { AssignmentCoachDashboard } from "@/components/admin/assignments/AssignmentCoachDashboard";
import {
  adminReopenAssignment,
  adminReopenAssignmentTask,
  adminResetMemberPin,
  adminSetAssignmentTaskStatus,
  ASSIGNMENT_ATTACHMENTS_SETUP_SQL,
  assignmentsErrorMessage,
  createAssignment,
  deleteAssignment,
  fetchAssignmentRoster,
  fetchAssignmentsAdmin,
  isAssignmentsSetupMissing,
  needsAssignmentAttachmentsUpgrade,
  type AssignmentStatus,
  type AssignmentWithProgress,
  type RosterMember,
} from "@/lib/assignments";
import { runOverdueAssignmentReminders } from "@/lib/assignment-reminders.functions";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Copy, ExternalLink, Mail, Plus, RotateCcw, Trash2, Paperclip } from "lucide-react";
import { toast } from "sonner";

const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new";

const STATUS_LABEL: Record<AssignmentStatus, string> = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
};

async function copyAttachmentsSql() {
  try {
    await navigator.clipboard.writeText(ASSIGNMENT_ATTACHMENTS_SETUP_SQL);
    toast.success("SQL copied — paste into Supabase SQL Editor and click Run");
  } catch {
    toast.error("Could not copy — open supabase/setup-assignment-attachments.sql");
  }
}

export function AssignmentsCoachView() {
  const [rows, setRows] = useState<AssignmentWithProgress[]>([]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [needsAttachments, setNeedsAttachments] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [assignments, members, attachmentsMissing] = await Promise.all([
        fetchAssignmentsAdmin(),
        fetchAssignmentRoster(),
        needsAssignmentAttachmentsUpgrade(),
      ]);
      setRows(assignments);
      setRoster(members);
      setNeedsSetup(false);
      setNeedsAttachments(attachmentsMissing);
    } catch (e) {
      if (isAssignmentsSetupMissing(e)) {
        setNeedsSetup(true);
      } else {
        toast.error(assignmentsErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNewAssignmentForm() {
    setShowForm(true);
    requestAnimationFrame(() => {
      document.getElementById("new-assignment-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function sendOverdueReminders() {
    setReminderBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not signed in — refresh and try again.");

      const result = await runOverdueAssignmentReminders({
        data: { accessToken },
      });

      if (result.failures.length > 0) {
        toast.error(
          `Sent ${result.sent} overdue reminder(s). ${result.failures.length} failed — see console.`,
        );
        console.warn("[assignments] reminder failures", result.failures);
      } else if (result.sent === 0) {
        toast.message("No overdue reminders to send (due yesterday, not done, not already emailed).");
      } else {
        toast.success(`Sent ${result.sent} overdue reminder email(s) to parents (CC suresh440@gmail.com).`);
      }
    } catch (e) {
      toast.error(assignmentsErrorMessage(e));
    } finally {
      setReminderBusy(false);
    }
  }

  if (loading) {
    return <div className="container-page py-16 text-muted-foreground">Loading assignments…</div>;
  }

  if (needsSetup) {
    return (
      <div className="container-page py-12">
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-medium">One-time setup required</p>
          <p className="mt-1">
            Run <code className="rounded bg-white/70 px-1">supabase/setup-assignments.sql</code> in
            the Supabase SQL Editor, then refresh.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={SQL_EDITOR_URL} target="_blank" rel="noreferrer" className="btn-outline gap-2">
              <ExternalLink size={16} /> Open SQL Editor
            </a>
            <button type="button" className="btn-outline" onClick={load}>
              Check again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AssignmentCoachDashboard
        rows={rows}
        roster={roster}
        headerAction={
          <button type="button" className="btn-primary gap-2" onClick={openNewAssignmentForm}>
            <Plus size={16} /> New assignment
          </button>
        }
      />

      <section id="manage-assignments" className="py-12">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl">Manage assignments</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create tasks, reset PINs, and send overdue parent emails.
              </p>
            </div>
            <button
              type="button"
              className="btn-outline gap-2"
              disabled={reminderBusy}
              onClick={sendOverdueReminders}
              title="Email parents for tasks due yesterday that are still not done"
            >
              <Mail size={16} />
              {reminderBusy ? "Sending…" : "Send overdue emails"}
            </button>
          </div>

          <div className="mb-6 rounded-2xl border border-forest/20 bg-forest/5 p-5 text-sm text-foreground">
            <p className="font-medium">Overdue parent emails</p>
            <p className="mt-1 text-muted-foreground">
              Each day at <strong className="text-foreground">8 AM Eastern</strong>, parents get a separate email if their kid did not finish a
              task by the due date (sent the <strong className="text-foreground">next day</strong>).
              Coach <strong className="text-foreground">suresh440@gmail.com</strong> is CC&apos;d on
              every reminder. One-time: run{" "}
              <code className="rounded bg-muted px-1">supabase/setup-assignment-reminders.sql</code> in
              Supabase.
            </p>
          </div>

          {needsAttachments && (
            <div className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-950">
              <p className="font-medium">Optional: enable assignment file uploads</p>
              <p className="mt-1">
                You can create assignments now. To let kids attach files, run{" "}
                <code className="rounded bg-white/70 px-1">supabase/setup-assignment-attachments.sql</code>
                .
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={SQL_EDITOR_URL} target="_blank" rel="noreferrer" className="btn-outline gap-2">
                  <ExternalLink size={16} /> Open SQL Editor
                </a>
                <button type="button" className="btn-outline gap-2" onClick={copyAttachmentsSql}>
                  <Copy size={16} /> Copy attachments SQL
                </button>
                <button type="button" className="btn-outline" onClick={load}>
                  Check again
                </button>
              </div>
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-border bg-sand/40 p-5 text-sm text-muted-foreground">
            Kids pick their name on this page, set or enter a 4-digit PIN, then update task status.
            Reset a forgotten PIN below.
          </div>

          {showForm && (
            <div id="new-assignment-form">
              <AssignmentForm
              roster={roster}
              onCancel={() => setShowForm(false)}
              onSave={async (payload) => {
                await createAssignment(payload);
                toast.success("Assignment created for selected teammates");
                setShowForm(false);
                load();
              }}
            />
            </div>
          )}

          {roster.length > 0 && (
            <section className="mb-8">
              <h3 className="font-display text-xl">PIN status</h3>
              <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
                {roster.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="font-medium">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          m.hasPin ? "bg-forest/15 text-forest" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.hasPin ? "PIN set" : "No PIN yet"}
                      </span>
                      {m.hasPin && (
                        <button
                          type="button"
                          className="btn-outline !px-2.5 !py-1 text-xs"
                          onClick={async () => {
                            if (!confirm(`Reset PIN for ${m.name}? They will set a new one next visit.`)) {
                              return;
                            }
                            try {
                              await adminResetMemberPin(m.id);
                              toast.success(`PIN reset for ${m.name}`);
                              load();
                            } catch (e) {
                              toast.error(assignmentsErrorMessage(e));
                            }
                          }}
                        >
                          Reset PIN
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="space-y-4">
            {rows.map((row) => {
              const open = expandedId === row.id;
              const pct = row.totalCount ? Math.round((row.doneCount / row.totalCount) * 100) : 0;
              return (
                <article key={row.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                        <ClipboardList size={14} /> Due {formatDue(row.dueDate)}
                      </div>
                      <h3 className="mt-1 font-display text-2xl">{row.title}</h3>
                      {row.description && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                          {row.description}
                        </p>
                      )}
                      {row.linkUrl && (
                        <a
                          href={row.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline"
                        >
                          Open link <ExternalLink size={14} />
                        </a>
                      )}
                      <p className="mt-3 text-sm font-medium text-foreground">
                        Progress: {row.doneCount}/{row.totalCount} done ({pct}%)
                      </p>
                      <div className="mt-2 h-2 max-w-md overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-forest transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <StatusNameGroups tasks={row.tasks} />
                    </div>
                    <div className="flex gap-2">
                      {row.doneCount > 0 && (
                        <button
                          type="button"
                          className="btn-outline !px-3 !py-1.5 text-xs gap-1"
                          title="Set all completed tasks back to To do"
                          onClick={async () => {
                            if (
                              !confirm(
                                `Reopen "${row.title}" for teammates who marked done? Their status will go back to To do.`,
                              )
                            ) {
                              return;
                            }
                            try {
                              const count = await adminReopenAssignment(row.id);
                              toast.success(
                                count > 0
                                  ? `Reopened ${count} completed task(s) — teammates can update again`
                                  : "No completed tasks to reopen",
                              );
                              load();
                            } catch (e) {
                              toast.error(assignmentsErrorMessage(e));
                            }
                          }}
                        >
                          <RotateCcw size={14} /> Reopen
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-outline !px-3 !py-1.5 text-xs"
                        onClick={() => setExpandedId(open ? null : row.id)}
                      >
                        {open ? "Hide notes" : "Notes & details"}
                      </button>
                      <button
                        type="button"
                        className="btn-outline !px-3 !py-1.5 text-xs text-destructive"
                        onClick={async () => {
                          if (!confirm("Delete this assignment for everyone?")) return;
                          try {
                            await deleteAssignment(row.id);
                            toast.success("Assignment deleted");
                            load();
                          } catch (e) {
                            toast.error(assignmentsErrorMessage(e));
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-sand text-left text-xs uppercase tracking-widest text-muted-foreground">
                          <tr>
                            <th className="p-3">Teammate</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Note</th>
                            <th className="p-3">Attachment</th>
                            <th className="p-3">Updated</th>
                            <th className="p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.tasks.map((t) => (
                            <tr key={t.taskId} className="border-t border-border">
                              <td className="p-3 font-medium">{t.memberName}</td>
                              <td className="p-3">
                                <select
                                  value={t.status}
                                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                                  onChange={async (e) => {
                                    const next = e.target.value as AssignmentStatus;
                                    try {
                                      await adminSetAssignmentTaskStatus(t.taskId, next);
                                      toast.success(`Updated ${t.memberName}`);
                                      load();
                                    } catch (err) {
                                      toast.error(assignmentsErrorMessage(err));
                                    }
                                  }}
                                >
                                  {(Object.keys(STATUS_LABEL) as AssignmentStatus[]).map((key) => (
                                    <option key={key} value={key}>
                                      {STATUS_LABEL[key]}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="max-w-xs p-3 text-muted-foreground">{t.note || "—"}</td>
                              <td className="p-3">
                                {t.attachmentUrl ? (
                                  <a
                                    href={t.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex max-w-[180px] items-center gap-1 truncate text-sm font-medium text-forest hover:underline"
                                  >
                                    <Paperclip size={14} className="shrink-0" />
                                    {t.attachmentName || "File"}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="p-3 whitespace-nowrap text-muted-foreground">
                                {new Date(t.updatedAt).toLocaleString()}
                              </td>
                              <td className="p-3">
                                {t.status === "done" ? (
                                  <button
                                    type="button"
                                    className="btn-outline !px-2 !py-1 text-xs gap-1"
                                    onClick={async () => {
                                      if (
                                        !confirm(
                                          `Reopen for ${t.memberName}? Status will go back to To do.`,
                                        )
                                      ) {
                                        return;
                                      }
                                      try {
                                        await adminReopenAssignmentTask(t.taskId);
                                        toast.success(`Reopened for ${t.memberName}`);
                                        load();
                                      } catch (err) {
                                        toast.error(assignmentsErrorMessage(err));
                                      }
                                    }}
                                  >
                                    <RotateCcw size={12} /> Reopen
                                  </button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              );
            })}

            {rows.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No assignments yet. Create one to send a task to the team.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function formatDue(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusNameGroups({ tasks }: { tasks: AssignmentWithProgress["tasks"] }) {
  const done = tasks.filter((t) => t.status === "done");
  const doing = tasks.filter((t) => t.status === "doing");
  const todo = tasks.filter((t) => t.status === "todo");

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <StatusNameColumn label="Completed" tasks={done} tone="done" />
      <StatusNameColumn label="In progress" tasks={doing} tone="doing" />
      <StatusNameColumn label="Not started" tasks={todo} tone="todo" />
    </div>
  );
}

function StatusNameColumn({
  label,
  tasks,
  tone,
}: {
  label: string;
  tasks: AssignmentWithProgress["tasks"];
  tone: "done" | "doing" | "todo";
}) {
  const toneClass =
    tone === "done"
      ? "border-forest/25 bg-forest/5"
      : tone === "doing"
        ? "border-gold/40 bg-gold/10"
        : "border-border bg-sand/60";

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label} ({tasks.length})
      </div>
      {tasks.length === 0 ? (
        <p className="mt-1.5 text-sm text-muted-foreground/70">—</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {tasks.map((t) => (
            <li key={t.taskId} className="flex items-start gap-1.5 text-sm font-medium text-foreground">
              <span className="min-w-0 flex-1">{t.memberName}</span>
              {t.attachmentUrl ? (
                <a
                  href={t.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-forest hover:underline"
                  title={t.attachmentName || "Attachment"}
                >
                  <Paperclip size={14} />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AssignmentForm({
  roster,
  onSave,
  onCancel,
}: {
  roster: RosterMember[];
  onSave: (payload: {
    title: string;
    description: string;
    linkUrl?: string | null;
    dueDate: string;
    memberIds: string[];
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const allIds = useMemo(() => roster.map((m) => m.id), [roster]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selected, setSelected] = useState<string[]>(allIds);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSelected(allIds);
  }, [allIds]);

  const allSelected = selected.length === allIds.length && allIds.length > 0;

  return (
    <form
      className="mb-8 space-y-4 rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave({
            title,
            description,
            linkUrl: linkUrl || null,
            dueDate,
            memberIds: selected,
          });
        } catch (err) {
          toast.error(assignmentsErrorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Title
        </label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          placeholder="Watch this video and bring an idea"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Instructions
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          placeholder="Please watch the video and come up with one idea to share at practice."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Link (optional)
          </label>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="https://…"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Due date
          </label>
          <input
            required
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Assign to
          </label>
          <button
            type="button"
            className="text-xs font-medium text-forest hover:underline"
            onClick={() => setSelected(allSelected ? [] : allIds)}
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {roster.map((m) => {
            const checked = selected.includes(m.id);
            return (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setSelected((prev) =>
                      checked ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                    )
                  }
                />
                {m.name}
              </label>
            );
          })}
        </div>
        {roster.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add teammates under Admin → Our Team first.
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={busy || selected.length === 0} className="btn-primary disabled:opacity-50">
          {busy ? "Creating…" : "Create assignment"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}
