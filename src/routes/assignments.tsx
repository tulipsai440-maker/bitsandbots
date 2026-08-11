import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AssignmentsCoachView } from "@/components/admin/assignments/AssignmentsCoachView";
import { SiteLayout } from "@/components/site/Layout";
import { checkIsAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";import {
  assignmentsErrorMessage,
  clearAssignmentSession,
  fetchAssignmentRoster,
  fetchMyAssignmentProfile,
  fetchMyAssignmentTasks,
  getStoredAssignmentSession,
  isAssignmentsSetupMissing,
  loginMemberPin,
  logoutAssignmentSession,
  setMemberPin,
  updateMyAssignmentTask,
  uploadAssignmentAttachment,
  type AssignmentStatus,
  type MyAssignmentTask,
  type RosterMember,
} from "@/lib/assignments";
import { brandingRouteLoader, routeTeamName } from "@/lib/team-branding";
import { useSiteSettings } from "@/lib/site-settings-context";
import { displayTeamNameText } from "@/lib/site-settings";
import { ExternalLink, LogOut, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/assignments")({
  loader: brandingRouteLoader,
  head: ({ loaderData }) => {
    const name = routeTeamName(loaderData);
    return {
      meta: [
        { title: `Assignments — ${name}` },
        { name: "robots", content: "noindex, nofollow" },
        {
          name: "description",
          content: `Team member assignment portal for ${name}.`,
        },
      ],
    };
  },
  component: AssignmentsPortalPage,
});

const STATUS_OPTIONS: { value: AssignmentStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "doing", label: "In progress" },
  { value: "done", label: "Done" },
];

function AssignmentsPortalPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkIsAdmin().then(setIsAdmin);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setBootstrapping(false);
      return;
    }
    if (isAdmin === null) return;

    const existing = getStoredAssignmentSession();
    if (!existing) {
      setBootstrapping(false);
      return;
    }
    fetchMyAssignmentProfile(existing)
      .then((profile) => {
        if (profile) {
          setToken(existing);
          setName(profile.name);
        } else {
          clearAssignmentSession();
        }
      })
      .catch(() => clearAssignmentSession())
      .finally(() => setBootstrapping(false));
  }, [isAdmin]);

  if (isAdmin === null || bootstrapping) {
    return (
      <SiteLayout>
        <div className="container-page py-16 text-muted-foreground">Loading…</div>
      </SiteLayout>
    );
  }

  if (isAdmin) {
    return (
      <SiteLayout>
        <AssignmentsCoachView />
      </SiteLayout>
    );
  }

  if (!token || !name) {
    return (
      <SiteLayout>
        <PinGate
          onSignedIn={(nextToken, nextName) => {
            setToken(nextToken);
            setName(nextName);
          }}
        />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <TaskBoard
        token={token}
        name={name}
        onLogout={async () => {
          await logoutAssignmentSession(token);
          setToken(null);
          setName(null);
        }}
      />
    </SiteLayout>
  );
}

function PinGate({ onSignedIn }: { onSignedIn: (token: string, name: string) => void }) {
  const { siteName, assignmentsIntro } = useSiteSettings();
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [memberId, setMemberId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [setupMissing, setSetupMissing] = useState(false);

  const selected = roster.find((m) => m.id === memberId);
  const needsNewPin = selected ? !selected.hasPin : false;

  useEffect(() => {
    fetchAssignmentRoster()
      .then(setRoster)
      .catch((e) => {
        if (isAssignmentsSetupMissing(e)) setSetupMissing(true);
        else toast.error(assignmentsErrorMessage(e));
      });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!memberId) return toast.error("Choose your name");
    if (!/^\d{4}$/.test(pin)) return toast.error("PIN must be exactly 4 digits");
    if (needsNewPin && pin !== confirmPin) return toast.error("PINs do not match");

    setBusy(true);
    try {
      const token = needsNewPin
        ? await setMemberPin(memberId, pin)
        : await loginMemberPin(memberId, pin);
      const profile = await fetchMyAssignmentProfile(token);
      if (!profile) throw new Error("Could not load your profile");
      onSignedIn(token, profile.name);
      toast.success(`Welcome, ${profile.name}`);
    } catch (err) {
      toast.error(assignmentsErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="py-14 md:py-16">
      <div className="container-page">
        <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-4xl text-foreground">Assignments</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {displayTeamNameText(assignmentsIntro, siteName)}
        </p>

        {setupMissing ? (
          <p className="mt-8 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-950">
            Assignments are not set up yet. Ask a coach to run the database setup.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your name
              </label>
              <select
                required
                value={memberId}
                onChange={(e) => {
                  setMemberId(e.target.value);
                  setPin("");
                  setConfirmPin("");
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <option value="">Select…</option>
                {roster.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {needsNewPin ? "Create a 4-digit PIN" : "4-digit PIN"}
              </label>
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{4}"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 tracking-[0.35em]"
                placeholder="••••"
              />
            </div>

            {needsNewPin && (
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Confirm PIN
                </label>
                <input
                  required
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 tracking-[0.35em]"
                  placeholder="••••"
                />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Choose something you&apos;ll remember — you&apos;ll use it every time you open Assignments.
                </p>
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
              {busy ? "Checking…" : needsNewPin ? "Save PIN & continue" : "Open my tasks"}
            </button>
          </form>
        )}
        </div>
      </div>
    </section>
  );
}

function TaskBoard({
  token,
  name,
  onLogout,
}: {
  token: string;
  name: string;
  onLogout: () => Promise<void>;
}) {
  const [tasks, setTasks] = useState<MyAssignmentTask[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setTasks(await fetchMyAssignmentTasks(token));
    } catch (e) {
      toast.error(assignmentsErrorMessage(e));
      if (assignmentsErrorMessage(e).toLowerCase().includes("session")) {
        clearAssignmentSession();
        await onLogout();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <section className="py-14 md:py-16">
      <div className="container-page">
        <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <h1 className="font-display text-4xl text-foreground">{name}</h1>
          </div>
          <button
            type="button"
            className="btn-outline gap-2"
            onClick={async () => {
              await onLogout();
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>

        <div className="mt-10 space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Loading tasks…</p>}
          {!loading && tasks.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              No assignments yet. Check back after a coach posts one.
            </p>
          )}
          {tasks.map((task) => (
            <TaskCard
              key={task.taskId}
              task={task}
              onSave={async (status, note, attachment) => {
                try {
                  await updateMyAssignmentTask(token, task.taskId, status, note, attachment);
                  toast.success("Saved");
                  load();
                } catch (e) {
                  toast.error(assignmentsErrorMessage(e));
                }
              }}
            />
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

function TaskCard({
  task,
  onSave,
}: {
  task: MyAssignmentTask;
  onSave: (
    status: AssignmentStatus,
    note: string,
    attachment: { url: string | null; name: string | null },
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState(task.status);
  const [note, setNote] = useState(task.note);
  const [attachmentUrl, setAttachmentUrl] = useState(task.attachmentUrl);
  const [attachmentName, setAttachmentName] = useState(task.attachmentName);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dueLabel = formatDue(task.dueDate);
  const overdue =
    task.status !== "done" &&
    new Date(task.dueDate + "T23:59:59").getTime() < Date.now();

  useEffect(() => {
    setStatus(task.status);
    setNote(task.note);
    setAttachmentUrl(task.attachmentUrl);
    setAttachmentName(task.attachmentName);
  }, [task]);

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-xs font-medium uppercase tracking-widest ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
          Due {dueLabel}
          {overdue ? " · Overdue" : ""}
        </p>
        <span className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground">
          {STATUS_OPTIONS.find((s) => s.value === task.status)?.label}
        </span>
      </div>
      <h2 className="mt-2 font-display text-2xl">{task.title}</h2>
      {task.description && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      )}
      {task.linkUrl && (
        <a
          href={task.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline"
        >
          Open resource <ExternalLink size={14} />
        </a>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-[160px_1fr]">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your note <span className="text-destructive">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="What did you work on, learn, or finish? Required every time you save."
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Attachment (optional)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            try {
              const uploaded = await uploadAssignmentAttachment(file, task.taskId);
              setAttachmentUrl(uploaded.url);
              setAttachmentName(uploaded.name);
              toast.success("File uploaded — tap Save update to keep it");
            } catch (err) {
              toast.error(assignmentsErrorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="btn-outline !px-2.5 !py-1 text-xs gap-1.5"
          >
            <Paperclip size={14} /> {attachmentUrl ? "Replace file" : "Choose file"}
          </button>
          {attachmentUrl && (
            <>
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-[220px] items-center gap-1 truncate text-sm font-medium text-forest hover:underline"
              >
                {attachmentName || "View attachment"} <ExternalLink size={12} />
              </a>
              <button
                type="button"
                disabled={busy}
                className="btn-outline !px-2 !py-1 text-xs"
                onClick={() => {
                  setAttachmentUrl(null);
                  setAttachmentName(null);
                }}
                aria-label="Remove attachment"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">PDF, Word, text, or image · max 10 MB</p>
      </div>

      <button
        type="button"
        disabled={busy}
        className="btn-primary mt-4 disabled:opacity-50"
        onClick={async () => {
          if (!note.trim()) {
            toast.error("Please add a note before saving");
            return;
          }
          setBusy(true);
          try {
            await onSave(status, note.trim(), {
              url: attachmentUrl,
              name: attachmentName,
            });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Saving…" : "Save update"}
      </button>
    </article>
  );
}

function formatDue(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
