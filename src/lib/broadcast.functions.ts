import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const schema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Message is required").max(10000),
  accessToken: z.string().min(20, "Not signed in"),
  /** If set, only these addresses are emailed (still must pass Resend rules). */
  onlyTo: z.array(z.string().email()).optional(),
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

async function sendOneResend(
  apiKey: string,
  fromAddress: string,
  to: string,
  subject: string,
  text: string,
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
      to: [to],
      subject,
      text,
      html,
    }),
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
        "Resend test mode: can only email your Resend account address until you verify a domain at resend.com/domains and set RESEND_FROM to that domain.",
      );
    }
    throw new Error(message);
  }
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
      process.env.RESEND_FROM?.trim() || "Bits & Bots <onboarding@resend.dev>";

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

    for (const to of recipients) {
      try {
        await sendOneResend(apiKey, fromAddress, to, subject, text, html);
        sent += 1;
      } catch (err) {
        failures.push(
          `${to}: ${err instanceof Error ? err.message : "send failed"}`,
        );
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
