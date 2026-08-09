import {
  fetchActiveJoinNotifyEmailAddresses,
  isJoinNotifyTableMissingError,
} from "@/lib/join-notify-emails";

export type JoinFormData = {
  parentName: string;
  scoutName: string;
  scoutAge: string;
  grade: string;
  school: string;
  parentEmail: string;
  parentPhone: string;
  questions: string;
};

async function loadRecipients(): Promise<string[]> {
  try {
    const emails = await fetchActiveJoinNotifyEmailAddresses();
    if (emails.length === 0) {
      throw new Error(
        "No notification emails are set up yet. A coach must add recipients in Admin → Join Notifications.",
      );
    }
    return emails;
  } catch (err) {
    if (isJoinNotifyTableMissingError(err)) {
      throw new Error(
        "Join notification emails are not set up yet. A coach must run the database setup in Admin → Join Notifications.",
      );
    }
    throw err;
  }
}

async function sendOne(recipient: string, form: JoinFormData, origin: string): Promise<void> {
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: origin,
      Referer: `${origin}/join`,
    },
    body: JSON.stringify({
      _subject: `Bits & Bots Join Request — ${form.scoutName}`,
      _template: "table",
      _captcha: "false",
      _replyto: form.parentEmail,
      "Parent Name": form.parentName,
      "Youth Name": form.scoutName,
      "Youth Age": form.scoutAge,
      Grade: form.grade,
      School: form.school,
      "Parent Email": form.parentEmail,
      "Parent Phone": form.parentPhone,
      "Questions / Notes": form.questions || "(none)",
    }),
  });

  let payload: { success?: string; message?: string } | null = null;
  try {
    payload = await res.json();
  } catch {
    throw new Error("Could not reach the email service. Please try again.");
  }

  if (payload?.success === "true") return;

  const message = payload?.message ?? "";
  if (message.toLowerCase().includes("activation")) {
    throw new Error(
      `One-time setup: open ${recipient}, find the FormSubmit activation email, click the link once, then submit this form again.`,
    );
  }

  throw new Error(message || "Email could not be sent. Please try again.");
}

/** Sends join form to every active admin notification email via FormSubmit. */
export async function sendJoinEmailFromBrowser(form: JoinFormData): Promise<void> {
  const recipients = await loadRecipients();
  const origin = window.location.origin;
  const failures: string[] = [];

  for (const recipient of recipients) {
    try {
      await sendOne(recipient, form, origin);
    } catch (err) {
      failures.push(err instanceof Error ? err.message : "Send failed");
    }
  }

  if (failures.length === recipients.length) {
    throw new Error(failures[0] ?? "Email could not be sent. Please try again.");
  }
}

export async function fetchJoinContactEmail(): Promise<string | null> {
  try {
    const emails = await fetchActiveJoinNotifyEmailAddresses();
    return emails[0] ?? null;
  } catch {
    return null;
  }
}
