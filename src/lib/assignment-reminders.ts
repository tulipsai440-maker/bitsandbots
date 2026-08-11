/**
 * Sends overdue assignment reminders to each parent (separate email per parent/kid/task).
 * Runs daily via Cloudflare cron the day after due_date; CC coach on every send.
 */

import {
  emailFromFallback,
  emailSignoff,
  loadTeamBrandingServer,
} from "@/lib/team-branding";
import { loadCoachCcEmailsServer } from "@/lib/coach-cc-emails";

export type OverdueReminderRow = {
  taskId: string;
  memberName: string;
  parentName: string;
  parentEmail: string;
  title: string;
  description: string;
  linkUrl: string | null;
  dueDate: string;
  status: string;
};

export type OverdueReminderResult = {
  sent: number;
  skipped: number;
  failures: string[];
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

function formatDueDate(isoDate: string) {
  try {
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

async function resendConfig() {
  const branding = await loadTeamBrandingServer();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = emailFromFallback(branding);
  const envCc = process.env.ASSIGNMENT_REMINDER_CC?.trim() || process.env.RESEND_REPLY_TO?.trim();
  const coachCc = await loadCoachCcEmailsServer();
  const cc = [...new Set([...(envCc ? [envCc] : []), ...coachCc])];
  const siteOrigin = branding.siteUrl;
  return { apiKey, fromAddress, cc, siteOrigin, branding };
}

/** Tasks due yesterday, not done, parent has email, reminder not yet sent. */
export async function loadOverdueReminderRows(): Promise<OverdueReminderRow[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dueOn = yesterday.toISOString().slice(0, 10);

  const { data: assignments, error: assignError } = await admin
    .from("assignments")
    .select("id, title, description, link_url, due_date")
    .eq("due_date", dueOn);

  if (assignError) {
    throw new Error(`Could not load assignments: ${assignError.message}`);
  }
  if (!assignments?.length) return [];

  const assignmentIds = assignments.map((a: { id: string }) => a.id);
  const assignmentById = new Map(
    assignments.map((a: {
      id: string;
      title: string;
      description: string;
      link_url: string | null;
      due_date: string;
    }) => [a.id, a]),
  );

  const { data: tasks, error: taskError } = await admin
    .from("assignment_tasks")
    .select("id, status, team_member_id, assignment_id, team_members!inner ( name )")
    .in("assignment_id", assignmentIds)
    .neq("status", "done");

  const taskIds = tasks.map((t: { id: string }) => t.id);
  const { data: sentRows } = await admin
    .from("assignment_overdue_reminders")
    .select("assignment_task_id, parent_email")
    .in("assignment_task_id", taskIds);

  const alreadySent = new Set(
    (sentRows ?? []).map(
      (r: { assignment_task_id: string; parent_email: string }) =>
        `${r.assignment_task_id}:${String(r.parent_email).trim().toLowerCase()}`,
    ),
  );

  const memberIds = [...new Set(tasks.map((t: { team_member_id: string }) => t.team_member_id))];
  const { data: parents, error: parentError } = await admin
    .from("parent_contacts")
    .select("team_member_id, parent_name, email")
    .in("team_member_id", memberIds);

  if (parentError) {
    throw new Error(`Could not load parent contacts: ${parentError.message}`);
  }

  const parentsByMember = new Map<string, Array<{ parentName: string; email: string }>>();
  for (const p of parents ?? []) {
    const email = String(p.email ?? "").trim().toLowerCase();
    if (!email.includes("@")) continue;
    const list = parentsByMember.get(p.team_member_id) ?? [];
    list.push({ parentName: String(p.parent_name ?? "Parent"), email });
    parentsByMember.set(p.team_member_id, list);
  }

  const rows: OverdueReminderRow[] = [];
  for (const t of tasks) {
    const assignment = assignmentById.get(t.assignment_id);
    if (!assignment) continue;
    const member = t.team_members as { name: string };
    const parentList = parentsByMember.get(t.team_member_id) ?? [];

    for (const parent of parentList) {
      const key = `${t.id}:${parent.email}`;
      if (alreadySent.has(key)) continue;
      rows.push({
        taskId: t.id,
        memberName: member.name,
        parentName: parent.parentName,
        parentEmail: parent.email,
        title: assignment.title,
        description: assignment.description,
        linkUrl: assignment.link_url,
        dueDate: assignment.due_date,
        status: t.status,
      });
    }
  }

  return rows;
}

async function sendReminderEmail(
  row: OverdueReminderRow,
  config: Awaited<ReturnType<typeof resendConfig>>,
) {
  if (!config.apiKey) throw new Error("RESEND_API_KEY is missing.");

  const signoff = emailSignoff(config.branding);
  const dueLabel = formatDueDate(row.dueDate);
  const assignmentsUrl = `${config.siteOrigin.replace(/\/$/, "")}/assignments`;
  const subject = `${config.branding.siteName}: ${row.memberName} — overdue assignment (${row.title})`;

  const text = `Hi ${row.parentName},

${row.memberName} has not completed this assignment, which was due ${dueLabel}:

${row.title}
${row.description ? `\n${row.description}\n` : ""}
Status: ${row.status === "doing" ? "In progress" : "Not started"}
${row.linkUrl ? `\nLink: ${row.linkUrl}\n` : ""}
Teammates can update their task at ${assignmentsUrl} (name + 4-digit PIN).

— ${signoff}`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.5">
      <p style="color:#666;margin:0 0 12px;font-size:13px">${escapeHtml(config.branding.siteName)} assignment reminder</p>
      <p>Hi ${escapeHtml(row.parentName)},</p>
      <p><strong>${escapeHtml(row.memberName)}</strong> has not completed this assignment, which was due <strong>${escapeHtml(dueLabel)}</strong>:</p>
        <h2 style="font-family:Georgia,serif;color:${escapeHtml(config.branding.brandColor)};margin:16px 0 8px;font-size:20px">${escapeHtml(row.title)}</h2>
      ${row.description ? `<p style="white-space:pre-wrap">${escapeHtml(row.description)}</p>` : ""}
      <p>Status: <strong>${row.status === "doing" ? "In progress" : "Not started"}</strong></p>
      ${row.linkUrl ? `<p><a href="${escapeHtml(row.linkUrl)}">Open assignment link</a></p>` : ""}
      <p style="margin-top:20px">Teammates can update their task at <a href="${escapeHtml(assignmentsUrl)}">${escapeHtml(assignmentsUrl)}</a> (name + 4-digit PIN).</p>
      <p style="color:#666;font-size:13px;margin-top:24px">— ${escapeHtml(signoff)}</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.fromAddress,
      to: [row.parentEmail],
      ...(config.cc.length > 0 ? { cc: config.cc, reply_to: [config.cc[0]] } : {}),
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Failed to send to ${row.parentEmail}`);
  }
}

async function markReminderSent(taskId: string, parentEmail: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;
  const { error } = await admin.from("assignment_overdue_reminders").insert({
    assignment_task_id: taskId,
    parent_email: parentEmail.trim().toLowerCase(),
  });
  if (error && !String(error.message).includes("duplicate")) {
    console.error("[assignment-reminders] mark sent", error.message);
  }
}

/** Send all pending overdue reminders (cron + admin manual). */
export async function sendOverdueAssignmentReminders(): Promise<OverdueReminderResult> {
  const config = await resendConfig();
  if (!config.apiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  const rows = await loadOverdueReminderRows();
  let sent = 0;
  const failures: string[] = [];

  if (rows.length === 0) {
    console.log("[assignment-reminders] nothing to send");
    return { sent: 0, skipped: 0, failures: [] };
  }

  console.log(`[assignment-reminders] sending ${rows.length} reminder(s)`);

  for (const row of rows) {
    try {
      await sendReminderEmail(row, config);
      await markReminderSent(row.taskId, row.parentEmail);
      sent += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "send failed";
      failures.push(`${row.parentEmail} (${row.memberName}): ${msg}`);
    }
  }

  return { sent, skipped: 0, failures };
}
