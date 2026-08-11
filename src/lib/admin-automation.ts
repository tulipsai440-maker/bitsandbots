/**
 * Automated coach/parent emails — daily Cloudflare cron.
 * Dedup via optional tables in supabase/patch-admin-automation.sql
 */

import { sendOverdueAssignmentReminders } from "@/lib/assignment-reminders";
import { loadCoachCcEmailsServer } from "@/lib/coach-cc-emails";
import {
  emailFromFallback,
  emailSignoff,
  loadTeamBrandingServer,
} from "@/lib/team-branding";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

async function resendConfig() {
  const branding = await loadTeamBrandingServer();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = emailFromFallback(branding);
  const siteOrigin = branding.siteUrl;
  return { apiKey, fromAddress, siteOrigin, branding };
}

async function loadCoachCc(): Promise<string[]> {
  return loadCoachCcEmailsServer();
}

async function sendResendEmail(input: {
  to: string;
  cc?: string[];
  subject: string;
  text: string;
  html: string;
}) {
  const { apiKey, fromAddress } = await resendConfig();
  if (!apiKey) throw new Error("RESEND_API_KEY is missing.");

  const body: Record<string, unknown> = {
    from: fromAddress,
    to: [input.to],
    subject: input.subject,
    text: input.text,
    html: input.html,
  };
  if (input.cc?.length) body.cc = input.cc;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || "Resend send failed");
  }
}

type DueSoonRow = {
  taskId: string;
  memberName: string;
  parentName: string;
  parentEmail: string;
  title: string;
  dueDate: string;
};

async function loadDueSoonReminderRows(): Promise<DueSoonRow[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const dueOn = tomorrow.toISOString().slice(0, 10);

  const { data: assignments, error: assignError } = await admin
    .from("assignments")
    .select("id, title, due_date")
    .eq("due_date", dueOn);
  if (assignError) throw new Error(assignError.message);
  if (!assignments?.length) return [];

  const assignmentIds = assignments.map((a: { id: string }) => a.id);
  const assignmentById = new Map(
    assignments.map((a: { id: string; title: string; due_date: string }) => [a.id, a]),
  );

  const { data: tasks, error: taskError } = await admin
    .from("assignment_tasks")
    .select("id, status, team_member_id, assignment_id, team_members!inner ( name )")
    .in("assignment_id", assignmentIds)
    .neq("status", "done");
  if (taskError) throw new Error(taskError.message);
  if (!tasks?.length) return [];

  const taskIds = tasks.map((t: { id: string }) => t.id);
  const { data: sentRows } = await admin
    .from("assignment_due_soon_reminders")
    .select("assignment_task_id, parent_email")
    .in("assignment_task_id", taskIds);

  const sent = new Set(
    (sentRows ?? []).map(
      (r: { assignment_task_id: string; parent_email: string }) =>
        `${r.assignment_task_id}:${r.parent_email}`,
    ),
  );

  const memberIds = [...new Set(tasks.map((t: { team_member_id: string }) => t.team_member_id))];
  const { data: parents } = await admin
    .from("parent_contacts")
    .select("team_member_id, parent_name, email")
    .in("team_member_id", memberIds);

  const parentsByMember = new Map<string, Array<{ parent_name: string; email: string }>>();
  for (const p of parents ?? []) {
    const email = String(p.email ?? "")
      .trim()
      .toLowerCase();
    if (!email.includes("@")) continue;
    const list = parentsByMember.get(p.team_member_id) ?? [];
    list.push({ parent_name: p.parent_name, email });
    parentsByMember.set(p.team_member_id, list);
  }

  const rows: DueSoonRow[] = [];
  for (const task of tasks) {
    const assignment = assignmentById.get(task.assignment_id);
    if (!assignment) continue;
    const member = task.team_members as { name: string };
    const parentList = parentsByMember.get(task.team_member_id) ?? [];
    for (const parent of parentList) {
      const key = `${task.id}:${parent.email}`;
      if (sent.has(key)) continue;
      rows.push({
        taskId: task.id,
        memberName: member.name,
        parentName: parent.parent_name,
        parentEmail: parent.email,
        title: assignment.title,
        dueDate: assignment.due_date,
      });
    }
  }
  return rows;
}

async function markDueSoonSent(taskId: string, parentEmail: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const { error } = await admin.from("assignment_due_soon_reminders").insert({
    assignment_task_id: taskId,
    parent_email: parentEmail.trim().toLowerCase(),
  });
  if (error && !String(error.message).includes("duplicate") && !String(error.message).includes("does not exist")) {
    console.warn("[automation] due-soon mark", error.message);
  }
}

export async function sendDueSoonAssignmentReminders(): Promise<{
  sent: number;
  failures: string[];
}> {
  const config = await resendConfig();
  if (!config.apiKey) return { sent: 0, failures: ["RESEND_API_KEY missing"] };

  const signoff = emailSignoff(config.branding);

  let rows: DueSoonRow[] = [];
  try {
    rows = await loadDueSoonReminderRows();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "load failed";
    if (msg.includes("does not exist")) {
      console.warn("[automation] due-soon table missing — run patch-admin-automation.sql");
      return { sent: 0, failures: [] };
    }
    throw err;
  }

  const coachCc = await loadCoachCc();
  let sent = 0;
  const failures: string[] = [];

  for (const row of rows) {
    const subject = `Reminder: ${row.title} due tomorrow`;
    const text = `Hi ${row.parentName},

${row.memberName}'s assignment "${row.title}" is due tomorrow (${row.dueDate}).

Please have them update their task on ${config.siteOrigin}/assignments and add a short note.

— ${signoff}`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;line-height:1.5">
        <p>Hi ${escapeHtml(row.parentName)},</p>
        <p><strong>${escapeHtml(row.memberName)}</strong>'s assignment
        <strong>${escapeHtml(row.title)}</strong> is due tomorrow (${escapeHtml(row.dueDate)}).</p>
        <p>Please have them update their task on
        <a href="${escapeHtml(config.siteOrigin)}/assignments">Assignments</a> and add a short note.</p>
        <p style="color:#666;font-size:13px">— ${escapeHtml(signoff)}</p>
      </div>`;

    try {
      await sendResendEmail({
        to: row.parentEmail,
        cc: coachCc,
        subject,
        text,
        html,
      });
      await markDueSoonSent(row.taskId, row.parentEmail);
      sent += 1;
    } catch (err) {
      failures.push(`${row.parentEmail}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  return { sent, failures };
}

type CalendarEventRow = {
  id: string;
  title: string;
  eventDate: string;
  location: string | null;
  startTime: string | null;
  agenda: string | null;
};

async function loadTomorrowEvents(): Promise<CalendarEventRow[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const date = tomorrow.toISOString().slice(0, 10);

  const { data, error } = await admin
    .from("calendar")
    .select("id, title, event_date, location, start_time, agenda")
    .eq("event_date", date);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    eventDate: row.event_date as string,
    location: (row.location as string | null) ?? null,
    startTime: (row.start_time as string | null) ?? null,
    agenda: (row.agenda as string | null) ?? null,
  }));
}

async function loadAllParentEmails(): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const { data: rpcData } = await admin.rpc("list_unique_parent_emails");
  if (Array.isArray(rpcData) && rpcData.length) {
    return [
      ...new Set(
        rpcData
          .map((row: { email?: string } | string) =>
            typeof row === "string" ? row : String(row.email ?? ""),
          )
          .map((e: string) => e.trim().toLowerCase())
          .filter((e: string) => e.includes("@")),
      ),
    ];
  }
  const { data } = await admin.from("parent_contacts").select("email");
  const unique = new Set<string>();
  for (const row of data ?? []) {
    const email = String(row.email ?? "")
      .trim()
      .toLowerCase();
    if (email.includes("@")) unique.add(email);
  }
  return [...unique];
}

async function eventReminderAlreadySent(calendarId: string, reminderDate: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const { data, error } = await admin
    .from("calendar_reminder_log")
    .select("calendar_id")
    .eq("calendar_id", calendarId)
    .eq("reminder_date", reminderDate)
    .maybeSingle();
  if (error?.message?.includes("does not exist")) return false;
  return Boolean(data);
}

async function markEventReminderSent(calendarId: string, reminderDate: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  await admin.from("calendar_reminder_log").insert({
    calendar_id: calendarId,
    reminder_date: reminderDate,
  });
}

export async function sendCalendarEventReminders(): Promise<{ sent: number; failures: string[] }> {
  const config = await resendConfig();
  if (!config.apiKey) return { sent: 0, failures: ["RESEND_API_KEY missing"] };

  const signoff = emailSignoff(config.branding);

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const reminderDate = tomorrow.toISOString().slice(0, 10);

  let events: CalendarEventRow[] = [];
  try {
    events = await loadTomorrowEvents();
  } catch (err) {
    return { sent: 0, failures: [err instanceof Error ? err.message : "load events failed"] };
  }
  if (events.length === 0) return { sent: 0, failures: [] };

  const parentEmails = await loadAllParentEmails();
  if (parentEmails.length === 0) return { sent: 0, failures: [] };

  const coachCc = await loadCoachCc();
  let sent = 0;
  const failures: string[] = [];

  for (const event of events) {
    if (await eventReminderAlreadySent(event.id, reminderDate)) continue;

    const timeLabel = event.startTime ? event.startTime.slice(0, 5) : "see calendar";
    const subject = `Reminder: ${event.title} tomorrow`;
    const text = `Hi families,

Reminder — ${event.title} is tomorrow (${reminderDate})${event.location ? ` at ${event.location}` : ""}.
${event.startTime ? `Start time: ${timeLabel}.` : ""}

${event.agenda ? `${event.agenda}\n\n` : ""}Calendar: ${config.siteOrigin}/calendar

— ${signoff}`;

    for (const to of parentEmails) {
      try {
        await sendResendEmail({
          to,
          cc: coachCc,
          subject,
          text,
          html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;line-height:1.5;white-space:pre-wrap">${escapeHtml(text)}</div>`,
        });
        sent += 1;
      } catch (err) {
        failures.push(`${to}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }

    try {
      await markEventReminderSent(event.id, reminderDate);
    } catch {
      /* table may be missing */
    }
  }

  return { sent, failures };
}

function weekStartUtc(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export async function sendWeeklyCoachDigest(): Promise<{ sent: boolean; failures: string[] }> {
  const config = await resendConfig();
  if (!config.apiKey) return { sent: false, failures: ["RESEND_API_KEY missing"] };

  const week = weekStartUtc();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;

  const { data: existing } = await admin
    .from("coach_digest_log")
    .select("week_start")
    .eq("week_start", week)
    .maybeSingle();
  if (existing) return { sent: false, failures: [] };

  const coachEmails = await loadCoachCc();
  if (coachEmails.length === 0) return { sent: false, failures: [] };

  const { count: pendingGallery } = await admin
    .from("gallery_photos")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { data: members } = await admin.from("team_members").select("id, name");
  const { data: consents } = await admin.from("parent_media_consents").select("team_member_id");
  const consented = new Set((consents ?? []).map((c: { team_member_id: string }) => c.team_member_id));
  const missingConsent = (members ?? [])
    .filter((m: { id: string }) => !consented.has(m.id))
    .map((m: { name: string }) => m.name);

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const overdueDate = yesterday.toISOString().slice(0, 10);
  const { data: overdueAssignments } = await admin
    .from("assignments")
    .select("id, title")
    .eq("due_date", overdueDate);

  const subject = `${config.branding.siteName} — weekly coach digest`;
  const lines = [
    "Weekly coach digest",
    "",
    `Pending gallery photos: ${pendingGallery ?? 0}`,
    missingConsent.length
      ? `Missing media consents: ${missingConsent.join(", ")}`
      : "Media consents: all signed",
    overdueAssignments?.length
      ? `Assignments that were due yesterday: ${overdueAssignments.map((a: { title: string }) => a.title).join(", ")}`
      : "No assignments were due yesterday",
    "",
    `Admin home: ${config.siteOrigin}/admin`,
  ];
  const text = lines.join("\n");
  const html = `<pre style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.5">${escapeHtml(text)}</pre>`;

  const failures: string[] = [];
  for (const to of coachEmails) {
    try {
      await sendResendEmail({ to, subject, text, html });
    } catch (err) {
      failures.push(`${to}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  if (failures.length < coachEmails.length) {
    try {
      await admin.from("coach_digest_log").insert({ week_start: week });
    } catch {
      /* table may be missing */
    }
    return { sent: true, failures };
  }

  return { sent: false, failures };
}

/** Run all daily automation jobs (cron entry point). */
export async function runDailyAdminAutomation(): Promise<void> {
  const overdue = await sendOverdueAssignmentReminders().catch((err) => {
    console.error("[automation] overdue", err);
    return { sent: 0, failures: [String(err)] };
  });
  console.log("[automation] overdue reminders", overdue);

  const dueSoon = await sendDueSoonAssignmentReminders().catch((err) => {
    console.error("[automation] due-soon", err);
    return { sent: 0, failures: [String(err)] };
  });
  console.log("[automation] due-soon reminders", dueSoon);

  const events = await sendCalendarEventReminders().catch((err) => {
    console.error("[automation] calendar", err);
    return { sent: 0, failures: [String(err)] };
  });
  console.log("[automation] calendar reminders", events);

  const utcDay = new Date().getUTCDay();
  if (utcDay === 1) {
    const digest = await sendWeeklyCoachDigest().catch((err) => {
      console.error("[automation] digest", err);
      return { sent: false, failures: [String(err)] };
    });
    console.log("[automation] weekly digest", digest);
  }
}
