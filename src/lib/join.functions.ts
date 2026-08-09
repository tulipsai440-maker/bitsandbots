import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  parentName: z.string().min(1, "Parent name is required").max(120),
  scoutName: z.string().min(1, "Youth name is required").max(120),
  scoutAge: z.string().min(1).max(3),
  grade: z.string().min(1).max(40),
  school: z.string().min(1).max(120),
  parentEmail: z.string().email("Enter a valid email"),
  parentPhone: z.string().min(7).max(40),
  questions: z.string().max(4000).optional().default(""),
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

async function loadNotifyRecipients(): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("join_notify_emails")
    .select("email")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[join] Could not load notify emails", error.message);
    throw new Error(
      "Join notification emails are not set up yet. A coach must add recipients in Admin → Join Notifications.",
    );
  }

  const emails = (data ?? []).map((row) => row.email.trim()).filter(Boolean);
  if (emails.length === 0) {
    throw new Error(
      "No notification emails are set up yet. A coach must add recipients in Admin → Join Notifications.",
    );
  }
  return emails;
}

async function sendViaResend(
  apiKey: string,
  fromAddress: string,
  recipients: string[],
  data: z.infer<typeof schema>,
  summary: string,
  html: string,
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: recipients,
      reply_to: data.parentEmail,
      subject: `Bits & Bots Join Request — ${data.scoutName}`,
      text: summary,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[join] Resend error", res.status, detail);
    throw new Error("Email service failed. Please try again or contact the coaches.");
  }
}

export const getJoinContactEmail = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const recipients = await loadNotifyRecipients();
    return { email: recipients[0] ?? null };
  } catch {
    return { email: null };
  }
});

export const submitJoinRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return { ok: true as const, delivered: false as const, useClientFormSubmit: true as const };
    }

    const recipients = await loadNotifyRecipients();
    const fromAddress = process.env.RESEND_FROM || "Bits & Bots <onboarding@resend.dev>";

    const summary = [
      `Parent: ${data.parentName}`,
      `Youth:  ${data.scoutName} (age ${data.scoutAge}, grade ${data.grade})`,
      `School: ${data.school}`,
      `Email:  ${data.parentEmail}`,
      `Phone:  ${data.parentPhone}`,
      "",
      "Questions / Notes:",
      data.questions || "(none)",
    ].join("\n");

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <h2 style="font-family:Georgia,serif;color:#1f3d1f;margin:0 0 8px">New Bits &amp; Bots Join Request</h2>
        <p style="color:#666;margin:0 0 16px">Submitted from Bits &amp; Bots</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tbody>
            ${[
              ["Parent Name", data.parentName],
              ["Youth Name", data.scoutName],
              ["Youth Age", data.scoutAge],
              ["Grade", data.grade],
              ["School", data.school],
              ["Parent Email", data.parentEmail],
              ["Parent Phone", data.parentPhone],
            ]
              .map(
                ([k, v]) =>
                  `<tr><td style="padding:8px 12px;background:#f7f5ef;border:1px solid #eae5d8;width:140px;font-weight:600">${k}</td><td style="padding:8px 12px;border:1px solid #eae5d8">${escapeHtml(v)}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
        <h3 style="font-family:Georgia,serif;margin:24px 0 8px">Questions / Notes</h3>
        <p style="white-space:pre-wrap;line-height:1.5">${escapeHtml(data.questions || "(none)")}</p>
      </div>
    `;

    await sendViaResend(apiKey, fromAddress, recipients, data, summary, html);
    return { ok: true as const, delivered: true as const, useClientFormSubmit: false as const };
  });
