import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadCoachCcEmailsServer } from "@/lib/coach-cc-emails";
import { emailFromFallback, loadTeamBrandingServer } from "@/lib/team-branding";

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
  const emails = await loadCoachCcEmailsServer();
  if (emails.length === 0) {
    throw new Error(
      "No coach notification emails yet. Add them under Admin → Coach CC emails.",
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
  siteName: string,
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
      subject: `${siteName} Join Request — ${data.scoutName}`,
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
    const branding = await loadTeamBrandingServer();
    const fromAddress = emailFromFallback(branding);

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
        <h2 style="font-family:Georgia,serif;color:${escapeHtml(branding.brandColor)};margin:0 0 8px">New ${escapeHtml(branding.siteName)} Join Request</h2>
        <p style="color:#666;margin:0 0 16px">Submitted from ${escapeHtml(branding.siteName)}</p>
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

    await sendViaResend(apiKey, fromAddress, recipients, data, summary, html, branding.siteName);
    return { ok: true as const, delivered: true as const, useClientFormSubmit: false as const };
  });
