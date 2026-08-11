import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AdminQuickShell } from "@/components/admin/AdminQuickShell";
import {
  fetchAdminDashboardSnapshot,
  formatEventDate,
  type AdminDashboardSnapshot,
} from "@/lib/admin-dashboard";
import { runOverdueAssignmentReminders } from "@/lib/assignment-reminders.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Camera,
  ClipboardList,
  Contact,
  FileCheck,
  LayoutDashboard,
  Megaphone,
  RefreshCw,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminderBusy, setReminderBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setData(await fetchAdminDashboardSnapshot());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
    return () => window.removeEventListener("focus", refresh);
  }, []);

  async function sendOverdueReminders() {
    setReminderBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not signed in");

      const result = await runOverdueAssignmentReminders({ data: { accessToken } });
      if (result.sent === 0) {
        toast.message("No overdue reminders to send right now");
      } else if (result.failures.length) {
        toast.error(`Sent ${result.sent}; ${result.failures.length} failed`);
      } else {
        toast.success(`Sent ${result.sent} overdue reminder${result.sent === 1 ? "" : "s"}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reminder send failed");
    } finally {
      setReminderBusy(false);
    }
  }

  const needsAttention =
    (data?.overdue.length ?? 0) +
    (data?.pendingGalleryCount ?? 0) +
    (data?.missingConsentKids.length ?? 0);

  return (
    <AdminQuickShell>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-forest">
            <LayoutDashboard size={22} />
            <span className="text-xs font-semibold uppercase tracking-widest">Coach home</span>
          </div>
          <h1 className="font-display text-3xl text-foreground md:text-4xl">Today</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Everything that needs your attention — plus one-click actions. Edit calendar, team, and
            coaches on their public pages with pencils enabled.
          </p>
        </div>
        <button type="button" className="btn-outline gap-2" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <p className="text-muted-foreground">Loading dashboard…</p>
      ) : data ? (
        <>
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Needs attention"
              value={needsAttention}
              hint={needsAttention === 0 ? "All clear" : "Items below"}
              tone={needsAttention > 0 ? "amber" : "green"}
            />
            <StatCard
              label="Parent emails"
              value={data.parentEmailCount}
              hint={`${data.bothParentsCount}/${data.familyCount} families with both parents`}
            />
            <StatCard
              label="Media consents"
              value={`${data.consentedCount}/${data.familyCount}`}
              hint={
                data.missingConsentKids.length
                  ? `${data.missingConsentKids.length} still needed`
                  : "All signed"
              }
              tone={data.missingConsentKids.length ? "amber" : "green"}
            />
            <StatCard
              label="Photos to review"
              value={data.pendingGalleryCount}
              hint={data.pendingGalleryCount ? "Waiting for you" : "Inbox clear"}
              tone={data.pendingGalleryCount ? "amber" : "green"}
            />
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            <Link to="/admin/broadcast" className="btn-primary gap-2">
              <Megaphone size={16} /> Send message
            </Link>
            <Link to="/assignments" className="btn-outline gap-2">
              <ClipboardList size={16} /> Assignments
            </Link>
            <Link to="/admin/parent-contacts" className="btn-outline gap-2">
              <Contact size={16} /> Parents
            </Link>
            <Link to="/calendar" search={{ edit: "1" }} className="btn-outline gap-2">
              <Calendar size={16} /> Calendar
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardPanel
              title="Overdue assignments"
              icon={<AlertTriangle size={18} className="text-amber-600" />}
              empty="No overdue assignments — great work!"
              action={
                data.overdue.length > 0 ? (
                  <button
                    type="button"
                    className="btn-outline !px-3 !py-1.5 text-xs"
                    disabled={reminderBusy}
                    onClick={sendOverdueReminders}
                  >
                    {reminderBusy ? "Sending…" : "Email reminders now"}
                  </button>
                ) : null
              }
            >
              {data.overdue.length > 0 && (
                <ul className="space-y-2 text-sm">
                  {data.overdue.slice(0, 8).map((item, i) => (
                    <li
                      key={`${item.memberName}-${item.title}-${i}`}
                      className="flex justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2"
                    >
                      <span>
                        <strong className="text-foreground">{item.memberName}</strong>
                        <span className="text-muted-foreground"> — {item.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-amber-700">{item.dueDate}</span>
                    </li>
                  ))}
                  {data.overdue.length > 8 && (
                    <li className="text-xs text-muted-foreground">
                      +{data.overdue.length - 8} more — open Assignments for full list
                    </li>
                  )}
                </ul>
              )}
            </DashboardPanel>

            <DashboardPanel
              title="Next event"
              icon={<Calendar size={18} className="text-forest" />}
              empty="No upcoming events — add one on the Calendar page."
              action={
                <Link to="/calendar" search={{ edit: "1" }} className="btn-outline !px-3 !py-1.5 text-xs">
                  Edit calendar
                </Link>
              }
            >
              {data.nextEvent && (
                <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                  <p className="font-medium text-foreground">{data.nextEvent.title}</p>
                  <p className="mt-1 text-muted-foreground">
                    {formatEventDate(data.nextEvent.eventDate, data.nextEvent.startTime)}
                  </p>
                  {data.nextEvent.location && (
                    <p className="mt-1 text-xs text-muted-foreground">{data.nextEvent.location}</p>
                  )}
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel
              title="Missing media consents"
              icon={<FileCheck size={18} className="text-forest" />}
              empty="Every teammate has a signed consent on file."
              action={
                data.missingConsentKids.length > 0 ? (
                  <Link to="/admin/parent-consents" className="btn-outline !px-3 !py-1.5 text-xs">
                    View consents
                  </Link>
                ) : null
              }
            >
              {data.missingConsentKids.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Still needed:{" "}
                  <span className="font-medium text-foreground">
                    {data.missingConsentKids.join(", ")}
                  </span>
                </p>
              )}
            </DashboardPanel>

            <DashboardPanel
              title="Gallery review"
              icon={<Camera size={18} className="text-forest" />}
              empty="No photos waiting for approval."
              action={
                data.pendingGalleryCount > 0 ? (
                  <Link to="/admin/gallery-photos" className="btn-primary !px-3 !py-1.5 text-xs">
                    Review {data.pendingGalleryCount} photo
                    {data.pendingGalleryCount === 1 ? "" : "s"}
                  </Link>
                ) : (
                  <Link to="/admin/gallery-photos" className="btn-outline !px-3 !py-1.5 text-xs">
                    Open gallery admin
                  </Link>
                )
              }
            >
              {data.pendingGalleryCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {data.pendingGalleryCount} submission
                  {data.pendingGalleryCount === 1 ? "" : "s"} from families need approve/reject.
                </p>
              )}
            </DashboardPanel>
          </div>

          <section className="mt-8 rounded-2xl border border-border bg-sand/30 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users size={18} className="text-forest" />
              <h2 className="font-display text-xl">Edit site pages</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Turn on <strong className="text-foreground">Show pencils</strong> in the coach bar,
              then edit directly on each page — no duplicate admin screens.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { to: "/about", label: "Our Team" },
                { to: "/coaches", label: "Coaches" },
                { to: "/sponsors", label: "Sponsors" },
                { to: "/calendar", label: "Calendar", search: { edit: "1" } },
                { to: "/core-values", label: "Core Values" },
                { to: "/outreach", label: "Outreach" },
                { to: "/", label: "Home" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  search={"search" in link ? link.search : undefined}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/admin/site-settings"
                className="rounded-full border border-forest/25 bg-forest/5 px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest/10"
              >
                Site content (nav & text)
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </AdminQuickShell>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "neutral" | "amber" | "green";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200/80 bg-amber-50/80"
      : tone === "green"
        ? "border-forest/20 bg-forest/5"
        : "border-border bg-card";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function DashboardPanel({
  title,
  icon,
  empty,
  action,
  children,
}: {
  title: string;
  icon: ReactNode;
  empty: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const hasContent = Boolean(children);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-display text-lg">{title}</h2>
        </div>
        {action}
      </div>
      {hasContent ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}
