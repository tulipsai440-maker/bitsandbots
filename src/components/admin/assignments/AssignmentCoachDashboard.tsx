import { useMemo, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Loader,
  TrendingUp,
  Users,
} from "lucide-react";
import type { AssignmentStatus, AssignmentWithProgress, RosterMember } from "@/lib/assignments";

function isOverdue(dueDate: string, status: AssignmentStatus): boolean {
  return status !== "done" && new Date(`${dueDate}T23:59:59`).getTime() < Date.now();
}

function formatDue(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type MemberStats = {
  id: string;
  name: string;
  total: number;
  done: number;
  doing: number;
  todo: number;
  overdue: number;
  completionPct: number;
};

function buildMemberStats(rows: AssignmentWithProgress[]): MemberStats[] {
  const map = new Map<string, MemberStats>();

  for (const assignment of rows) {
    for (const task of assignment.tasks) {
      const existing = map.get(task.teamMemberId) ?? {
        id: task.teamMemberId,
        name: task.memberName,
        total: 0,
        done: 0,
        doing: 0,
        todo: 0,
        overdue: 0,
        completionPct: 0,
      };
      existing.total += 1;
      if (task.status === "done") existing.done += 1;
      else if (task.status === "doing") existing.doing += 1;
      else existing.todo += 1;
      if (isOverdue(assignment.dueDate, task.status)) existing.overdue += 1;
      map.set(task.teamMemberId, existing);
    }
  }

  return [...map.values()]
    .map((member) => ({
      ...member,
      completionPct: member.total ? Math.round((member.done / member.total) * 100) : 0,
    }))
    .sort((a, b) => {
      if (b.overdue !== a.overdue) return b.overdue - a.overdue;
      if (a.completionPct !== b.completionPct) return a.completionPct - b.completionPct;
      return a.name.localeCompare(b.name);
    });
}

export function AssignmentCoachDashboard({
  rows,
  roster,
  headerAction,
}: {
  rows: AssignmentWithProgress[];
  roster: RosterMember[];
  headerAction?: ReactNode;
}) {
  const stats = useMemo(() => {
    let totalTasks = 0;
    let done = 0;
    let doing = 0;
    let todo = 0;
    let overdue = 0;

    for (const assignment of rows) {
      for (const task of assignment.tasks) {
        totalTasks += 1;
        if (task.status === "done") done += 1;
        else if (task.status === "doing") doing += 1;
        else todo += 1;
        if (isOverdue(assignment.dueDate, task.status)) overdue += 1;
      }
    }

    const activeAssignments = rows.filter((row) =>
      row.tasks.some((task) => task.status !== "done"),
    ).length;

    return {
      assignmentCount: rows.length,
      activeAssignments,
      totalTasks,
      done,
      doing,
      todo,
      overdue,
      completionPct: totalTasks ? Math.round((done / totalTasks) * 100) : 0,
    };
  }, [rows]);

  const memberStats = useMemo(() => buildMemberStats(rows), [rows]);
  const overdueMembers = memberStats.filter((m) => m.overdue > 0);
  const pinsPending = roster.filter((m) => !m.hasPin).length;

  return (
    <section className="border-b border-border/60 bg-sand/30 py-10 md:py-12">
      <div className="container-page">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest">Coach dashboard</p>
            <h2 className="mt-2 font-display text-3xl text-foreground md:text-4xl">Assignment pulse</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              See who&apos;s on track, who&apos;s stuck, and how the team is progressing — at a glance.
              Teammates use this same URL with their name and PIN.
            </p>
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active assignments"
            value={String(stats.activeAssignments)}
            hint={`${stats.assignmentCount} total posted`}
            icon={<ClipboardList size={18} />}
            tone="forest"
          />
          <StatCard
            label="Completed"
            value={String(stats.done)}
            hint={`${stats.completionPct}% of all tasks`}
            icon={<CheckCircle2 size={18} />}
            tone="done"
          />
          <StatCard
            label="In progress"
            value={String(stats.doing)}
            hint={`${stats.todo} not started yet`}
            icon={<Loader size={18} />}
            tone="doing"
          />
          <StatCard
            label="Overdue"
            value={String(stats.overdue)}
            hint={stats.overdue ? "Needs a nudge" : "All caught up"}
            icon={<AlertTriangle size={18} />}
            tone={stats.overdue ? "alert" : "muted"}
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl">Team completion</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats.totalTasks
                  ? `${stats.done} of ${stats.totalTasks} tasks marked done across the roster`
                  : "No tasks yet — create an assignment below"}
              </p>
            </div>
            <span className="font-display text-3xl text-forest">{stats.completionPct}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-forest to-gold transition-all"
              style={{ width: `${stats.completionPct}%` }}
            />
          </div>
          {pinsPending > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              <Users size={14} className="mr-1 inline" />
              {pinsPending} teammate{pinsPending === 1 ? "" : "s"} still need to set up their PIN on first visit.
            </p>
          )}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-2xl">Overdue assignments</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Teammates with work past the due date that isn&apos;t marked done.
            </p>
            <ul className="mt-4 space-y-3">
              {overdueMembers.length === 0 && (
                <li className="rounded-xl border border-forest/20 bg-forest/5 px-4 py-5 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-forest" />
                    <div>
                      <p className="font-medium text-foreground">Everyone is on time</p>
                      <p className="mt-1 text-muted-foreground">
                        No overdue assignments right now — the team is completing work by the due date.
                        Keep it up!
                      </p>
                    </div>
                  </div>
                </li>
              )}
              {overdueMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.overdue} overdue · {member.done}/{member.total} done · {member.doing} in
                      progress
                    </p>
                  </div>
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                    {member.overdue} overdue
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-2xl">Roster snapshot</h3>
            <p className="mt-1 text-sm text-muted-foreground">Completion rate per teammate.</p>
            <ul className="mt-4 space-y-2">
              {memberStats.map((member) => (
                <li key={member.id} className="rounded-xl border border-border bg-background px-4 py-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-muted-foreground">
                      {member.done}/{member.total} done
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-forest"
                      style={{ width: `${member.completionPct}%` }}
                    />
                  </div>
                </li>
              ))}
              {memberStats.length === 0 && (
                <li className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  Add teammates and assignments to see roster stats.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-forest" />
            <h3 className="font-display text-2xl">By assignment</h3>
          </div>
          <div className="mt-4 space-y-4">
            {rows.map((row) => {
              const pct = row.totalCount ? Math.round((row.doneCount / row.totalCount) * 100) : 0;
              const overdueCount = row.tasks.filter((t) => isOverdue(row.dueDate, t.status)).length;
              return (
                <article key={row.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Due {formatDue(row.dueDate)}
                        {overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}
                      </p>
                      <h4 className="mt-1 font-display text-xl">{row.title}</h4>
                    </div>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-foreground">
                      {row.doneCount}/{row.totalCount} done
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-forest" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <MiniGroup label="Done" names={row.tasks.filter((t) => t.status === "done").map((t) => t.memberName)} />
                    <MiniGroup label="In progress" names={row.tasks.filter((t) => t.status === "doing").map((t) => t.memberName)} />
                    <MiniGroup label="Not started" names={row.tasks.filter((t) => t.status === "todo").map((t) => t.memberName)} />
                  </div>
                </article>
              );
            })}
            {rows.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No assignments yet. Create one in the manage section below.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  tone: "forest" | "done" | "doing" | "alert" | "muted";
}) {
  const toneClass =
    tone === "forest"
      ? "border-forest/20 bg-forest/5 text-forest"
      : tone === "done"
        ? "border-forest/25 bg-forest/10 text-forest"
        : tone === "doing"
          ? "border-gold/35 bg-gold/10 text-forest-deep"
          : tone === "alert"
            ? "border-destructive/30 bg-destructive/5 text-destructive"
            : "border-border bg-sand/50 text-muted-foreground";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
        {icon}
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
      <p className="mt-1 text-xs opacity-80">{hint}</p>
    </div>
  );
}

function MiniGroup({ label, names }: { label: string; names: string[] }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label} ({names.length})
      </p>
      {names.length === 0 ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/70">
          <CircleDashed size={12} /> —
        </p>
      ) : (
        <p className="mt-1 text-xs leading-relaxed text-foreground">{names.join(", ")}</p>
      )}
    </div>
  );
}
