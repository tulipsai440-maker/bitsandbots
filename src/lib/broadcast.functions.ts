import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { uniquePhonesFromParentRows } from "@/lib/broadcast-phones";

const schema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Message is required").max(10000),
  accessToken: z.string().min(20, "Not signed in"),
  /** If set, only these addresses are emailed (still must pass Resend rules). */
  onlyTo: z.array(z.string().email()).optional(),
});

const whatsappSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Message is required").max(10000),
  accessToken: z.string().min(20, "Not signed in"),
  /** Prefer free-form text (24h window) or force an approved template. */
  mode: z.enum(["text", "template"]).optional(),
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

async function assertAdmin(accessToken: string) {
  const url = process.env.SUPABASE_URL?.trim();
  const anon =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !anon) {
    throw new Error("Server email is not configured (missing Supabase env).");
  }

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData.user) throw new Error("Not signed in — refresh and try again.");

  const { data: isAdmin, error: roleError } = await client.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleError || !isAdmin) throw new Error("Admin access required.");

  return userData.user;
}

async function loadParentEmails(): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;

  const { data: rpcData, error: rpcError } = await admin.rpc("list_unique_parent_emails");
  if (!rpcError && Array.isArray(rpcData)) {
    const emails = rpcData
      .map((row: { email?: string } | string) =>
        typeof row === "string" ? row : String(row.email ?? ""),
      )
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => e.includes("@"));
    if (emails.length > 0) return [...new Set(emails)].sort();
  }

  const { data, error } = await admin.from("parent_contacts").select("email");
  if (error) {
    console.error("[broadcast] parent emails", error.message, rpcError?.message);
    throw new Error(
      "Could not load parent emails. Run supabase/setup-parent-contacts.sql and supabase/reseed-parent-emails.sql.",
    );
  }

  const unique = new Set<string>();
  for (const row of data ?? []) {
    const email = String(row.email ?? "")
      .trim()
      .toLowerCase();
    if (email.includes("@")) unique.add(email);
  }
  return [...unique].sort();
}

async function loadParentPhones(): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any;

  const { data, error } = await admin.from("parent_contacts").select("phone");
  if (error) {
    console.error("[broadcast] parent phones", error.message);
    throw new Error(
      "Could not load parent phones. Run supabase/setup-parent-contacts.sql and add phones under Admin → Parents.",
    );
  }

  return uniquePhonesFromParentRows(data ?? []);
}

function whatsappApiConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim() || "";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG?.trim() || "en_US";

  return { token, phoneNumberId, apiVersion, templateName, templateLang };
}

async function sendOneWhatsApp(
  token: string,
  phoneNumberId: string,
  apiVersion: string,
  to: string,
  payload: Record<string, unknown>,
) {
  const res = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        ...payload,
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[broadcast] WhatsApp error", to, res.status, detail);
    let message = detail || `Failed to send to ${to}`;
    try {
      const parsed = JSON.parse(detail) as {
        error?: { message?: string; error_user_msg?: string };
      };
      message =
        parsed.error?.error_user_msg ||
        parsed.error?.message ||
        message;
    } catch {
      /* keep raw */
    }
    throw new Error(message);
  }
}

async function sendOneResend(
  apiKey: string,
  fromAddress: string,
  to: string,
  subject: string,
  text: string,
  html: string,
  replyTo?: string,
) {
  const body: Record<string, unknown> = {
    from: fromAddress,
    to: [to],
    subject,
    text,
    html,
  };
  if (replyTo) body.reply_to = [replyTo];

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
    console.error("[broadcast] Resend error", to, res.status, detail);
    let message = detail || `Failed to send to ${to}`;
    try {
      const parsed = JSON.parse(detail) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      /* keep raw */
    }
    if (message.toLowerCase().includes("only send testing emails")) {
      throw new Error(
        "Resend test mode: verify fllbots.com at resend.com/domains and set RESEND_FROM to an @fllbots.com address.",
      );
    }
    if (message.toLowerCase().includes("not verified")) {
      throw new Error(
        "fllbots.com is not verified in Resend yet. Add the DNS records at resend.com/domains, then try again.",
      );
    }
    throw new Error(message);
  }

  return res.json().catch(() => ({}));
}

/** Send one personalized email per parent via Resend batch API (reliable delivery). */
async function sendBroadcastResend(
  apiKey: string,
  fromAddress: string,
  recipients: string[],
  subject: string,
  text: string,
  html: string,
  replyTo?: string,
) {
  const batch = recipients.map((to) => {
    const item: Record<string, unknown> = {
      from: fromAddress,
      to: [to],
      subject,
      text,
      html,
    };
    if (replyTo) item.reply_to = [replyTo];
    return item;
  });

  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(batch),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[broadcast] Resend batch error", res.status, detail);
    let message = detail || "Failed to send broadcast emails";
    try {
      const parsed = JSON.parse(detail) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      /* keep raw */
    }
    throw new Error(message);
  }

  const result = (await res.json().catch(() => null)) as {
    data?: Array<{ id?: string }>;
  } | null;
  const delivered = result?.data?.filter((d) => d?.id).length ?? recipients.length;
  if (delivered === 0) {
    throw new Error("Resend accepted the request but no emails were queued.");
  }
  return delivered;
}

/** Admin-only: email every unique parent address via Resend. */
export const sendParentBroadcast = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.accessToken);

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is missing. Add it to .env (see supabase/EMAIL-SETUP.txt) and restart the server.",
      );
    }

    const fromAddress =
      process.env.RESEND_FROM?.trim() || "Bits & Bots <updates@fllbots.com>";
    const replyTo =
      process.env.RESEND_REPLY_TO?.trim() || "sravanthi440@gmail.com";

    let recipients = await loadParentEmails();
    if (data.onlyTo?.length) {
      const allowed = new Set(data.onlyTo.map((e) => e.trim().toLowerCase()));
      recipients = recipients.filter((e) => allowed.has(e));
      // Still allow sending to onlyTo even if not in parents table (test inbox)
      for (const e of data.onlyTo) {
        const normalized = e.trim().toLowerCase();
        if (normalized.includes("@") && !recipients.includes(normalized)) {
          recipients.push(normalized);
        }
      }
      recipients.sort();
    }
    if (recipients.length === 0) {
      throw new Error(
        "No parent emails found. Add emails under Admin → Parents first.",
      );
    }

    const subject = data.subject.trim();
    const text = data.body.trim();
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.5">
        <p style="color:#666;margin:0 0 12px;font-size:13px">Bits &amp; Bots team update</p>
        <h2 style="font-family:Georgia,serif;color:#1f3d1f;margin:0 0 16px;font-size:22px">${escapeHtml(subject)}</h2>
        <div style="white-space:pre-wrap;font-size:15px">${escapeHtml(text)}</div>
      </div>
    `;

    const failures: string[] = [];
    let sent = 0;

    try {
      sent = await sendBroadcastResend(
        apiKey,
        fromAddress,
        recipients,
        subject,
        text,
        html,
        replyTo,
      );
    } catch (err) {
      // Batch failed — fall back to one-by-one so partial delivery still works.
      console.warn("[broadcast] batch send failed, falling back to individual sends", err);
      for (const to of recipients) {
        try {
          await sendOneResend(apiKey, fromAddress, to, subject, text, html, replyTo);
          sent += 1;
        } catch (oneErr) {
          failures.push(
            `${to}: ${oneErr instanceof Error ? oneErr.message : "send failed"}`,
          );
        }
      }
    }

    if (sent === 0) {
      throw new Error(failures[0] ?? "No emails were sent.");
    }

    return {
      sent,
      total: recipients.length,
      failures,
    };
  });

/**
 * Admin-only: WhatsApp Cloud API broadcast to unique parent phone numbers.
 * Group invite links cannot auto-send — this messages each parent individually.
 *
 * Free-form text works only inside Meta’s 24-hour customer-care window.
 * Outside that window, set WHATSAPP_TEMPLATE_NAME to an approved template
 * (or pass mode: "template").
 */
export const sendBroadcastWhatsApp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => whatsappSchema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.accessToken);

    const { token, phoneNumberId, apiVersion, templateName, templateLang } =
      whatsappApiConfig();

    if (!token || !phoneNumberId) {
      throw new Error(
        "WhatsApp Cloud API is not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID (see supabase/WHATSAPP-SETUP.txt), then restart / redeploy.",
      );
    }

    const recipients = await loadParentPhones();
    if (recipients.length === 0) {
      throw new Error(
        "No parent phone numbers found. Add phones under Admin → Parents first.",
      );
    }

    const subject = data.subject.trim();
    const body = data.body.trim();
    const textBody = `*${subject}*\n\n${body}`.slice(0, 4096);

    const useTemplate =
      data.mode === "template" ||
      (data.mode !== "text" && Boolean(templateName));

    if (useTemplate && !templateName) {
      throw new Error(
        "Template mode needs WHATSAPP_TEMPLATE_NAME (an approved Meta template). See supabase/WHATSAPP-SETUP.txt.",
      );
    }

    const payload: Record<string, unknown> = useTemplate
      ? {
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLang },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: subject.slice(0, 1024) },
                  { type: "text", text: body.slice(0, 1024) },
                ],
              },
            ],
          },
        }
      : {
          type: "text",
          text: { preview_url: false, body: textBody },
        };

    const failures: string[] = [];
    let sent = 0;

    for (const to of recipients) {
      try {
        await sendOneWhatsApp(token, phoneNumberId, apiVersion, to, payload);
        sent += 1;
      } catch (err) {
        failures.push(
          `${to}: ${err instanceof Error ? err.message : "send failed"}`,
        );
      }
    }

    if (sent === 0) {
      throw new Error(failures[0] ?? "No WhatsApp messages were sent.");
    }

    return {
      sent,
      total: recipients.length,
      failures,
      mode: useTemplate ? ("template" as const) : ("text" as const),
    };
  });
