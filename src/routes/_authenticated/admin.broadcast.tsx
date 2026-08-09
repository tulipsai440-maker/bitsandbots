import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminReviewPage } from "@/components/admin/AdminShell";
import {
  broadcastErrorMessage,
  copyOtherParentEmails,
  fetchParentBroadcastEmails,
  fetchWhatsAppGroupUrl,
  formatBroadcastMessage,
  isBroadcastSetupMissing,
  openParentBroadcastInEmailApp,
  openWhatsAppGroupWithMessage,
  otherParentEmails,
  RESEND_TEST_INBOX,
  saveWhatsAppGroupUrl,
} from "@/lib/broadcast";
import { sendParentBroadcast } from "@/lib/broadcast.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, ExternalLink, Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/broadcast")({
  component: AdminBroadcastPage,
});

const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new";

function AdminBroadcastPage() {
  const [emails, setEmails] = useState<string[]>([]);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState<
    "email" | "gmail" | "me-copy" | "whatsapp" | "save-wa" | null
  >(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [lastResult, setLastResult] = useState<{
    sent: number;
    total: number;
    failures: string[];
  } | null>(null);

  async function load() {
    try {
      const [list, wa] = await Promise.all([
        fetchParentBroadcastEmails(),
        fetchWhatsAppGroupUrl(),
      ]);
      setEmails(list);
      setWhatsappUrl(wa);
      setNeedsSetup(false);
    } catch (e) {
      if (isBroadcastSetupMissing(e)) {
        setNeedsSetup(true);
        try {
          setEmails(await fetchParentBroadcastEmails());
        } catch {
          /* parents may also be empty */
        }
        setWhatsappUrl("https://chat.whatsapp.com/I14hN2OpZci2C2F4RsquwQ");
      } else {
        toast.error(broadcastErrorMessage(e));
      }
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function sendToMeAndCopyOthers() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and message first.");
      return;
    }

    setBusy("me-copy");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not signed in — refresh and try again.");

      const result = await sendParentBroadcast({
        data: {
          subject: subject.trim(),
          body: body.trim(),
          accessToken,
          onlyTo: [RESEND_TEST_INBOX],
        },
      });

      setLastResult(result);

      const others = otherParentEmails(emails);
      let copied = 0;
      if (others.length > 0) {
        copied = await copyOtherParentEmails(emails);
      }

      if (result.sent > 0 && copied > 0) {
        toast.success(
          `Emailed ${RESEND_TEST_INBOX}. Copied ${copied} other parent emails to clipboard.`,
        );
      } else if (result.sent > 0) {
        toast.success(`Emailed ${RESEND_TEST_INBOX}. No other parent emails to copy.`);
      } else {
        toast.error(result.failures[0] ?? "Could not send test email.");
      }
    } catch (e) {
      toast.error(broadcastErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function openEmailApp() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and message first.");
      return;
    }
    if (emails.length === 0) {
      toast.error("No parent emails yet — add them under Admin → Parents.");
      return;
    }
    setBusy("gmail");
    try {
      openParentBroadcastInEmailApp(emails, subject, body);
      toast.success(
        `Opened Gmail with ${emails.length} parents in BCC — review and click Send`,
      );
    } catch (e) {
      toast.error(broadcastErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function sendEmail() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and message first.");
      return;
    }
    if (emails.length === 0) {
      toast.error("No parent emails yet — add them under Admin → Parents.");
      return;
    }

    setBusy("email");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not signed in — refresh and try again.");

      const result = await sendParentBroadcast({
        data: {
          subject: subject.trim(),
          body: body.trim(),
          accessToken,
        },
      });

      setLastResult(result);

      if (result.failures.length > 0) {
        toast.error(
          `Resend delivered ${result.sent} of ${result.total}. Use “Open Gmail (BCC all)” until you have a domain.`,
        );
      } else {
        toast.success(`Email sent to ${result.sent} parent${result.sent === 1 ? "" : "s"}`);
      }
    } catch (e) {
      toast.error(broadcastErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function sendWhatsApp() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and message first.");
      return;
    }
    setBusy("whatsapp");
    try {
      await openWhatsAppGroupWithMessage(whatsappUrl, subject, body);
      toast.success("Message copied — paste it in the WhatsApp group and tap Send");
    } catch (e) {
      toast.error(broadcastErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function saveWa() {
    setBusy("save-wa");
    try {
      await saveWhatsAppGroupUrl(whatsappUrl);
      toast.success("WhatsApp group link saved");
      setNeedsSetup(false);
    } catch (e) {
      if (isBroadcastSetupMissing(e)) {
        setNeedsSetup(true);
        toast.error("Run setup-broadcast.sql once, then save the link again.");
      } else {
        toast.error(broadcastErrorMessage(e));
      }
    } finally {
      setBusy(null);
    }
  }

  async function copyEmails() {
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      toast.success("Parent emails copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(formatBroadcastMessage(subject, body));
      toast.success("Message copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <AdminReviewPage
      active="broadcast"
      title="Broadcast"
      description="Message all parents: open Gmail with everyone in BCC (works now, no domain), WhatsApp group, or Resend once you verify a domain."
    >
      <div className="mb-6 rounded-2xl border border-forest/20 bg-forest/5 p-5 text-sm text-foreground">
        <p className="font-medium">No domain yet</p>
        <p className="mt-1 text-muted-foreground">
          Use <strong className="text-foreground">Email me + copy others</strong> — Resend sends to{" "}
          {RESEND_TEST_INBOX}, and the remaining parent emails are copied (no Gmail popup). Or use{" "}
          <strong className="text-foreground">Open Gmail (BCC all)</strong> to send everyone in one go.
        </p>
      </div>
      {needsSetup && (
        <div className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-medium">Optional: save WhatsApp link in the database</p>
          <p className="mt-1">
            Run <code className="rounded bg-white/70 px-1">supabase/setup-broadcast.sql</code> once
            so the group link is shared for all admins. Until then, the default group link still works.
          </p>
          <a
            href={SQL_EDITOR_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-outline mt-4 inline-flex gap-2"
          >
            <ExternalLink size={16} /> Open SQL Editor
          </a>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-border bg-sand/40 p-5 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">
              {emails.length} unique parent email{emails.length === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-muted-foreground">
              Pulled from <code className="rounded bg-muted px-1">parent_contacts</code> only —
              duplicates removed. Rows without an email are skipped.
            </p>
          </div>
          <button
            type="button"
            className="btn-outline gap-2 !px-3 !py-1.5 text-xs"
            onClick={copyEmails}
            disabled={emails.length === 0}
          >
            <Copy size={14} /> Copy emails
          </button>
        </div>
        {emails.length > 0 && (
          <p className="mt-3 break-all text-xs text-muted-foreground">{emails.join(" · ")}</p>
        )}
      </div>

      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-card p-6">
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Subject
          </span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="Practice cancelled this Sunday"
            maxLength={200}
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Message
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="Hi families — a quick update from Bits & Bots…"
            maxLength={10000}
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            className="btn-primary gap-2"
            disabled={busy !== null}
            onClick={sendToMeAndCopyOthers}
          >
            <Mail size={16} />
            {busy === "me-copy"
              ? "Working…"
              : `Email me + copy others (${otherParentEmails(emails).length})`}
          </button>
          <button
            type="button"
            className="btn-outline gap-2"
            disabled={busy !== null || emails.length === 0}
            onClick={openEmailApp}
          >
            <Mail size={16} />
            {busy === "gmail"
              ? "Opening…"
              : `Open Gmail (BCC all ${emails.length})`}
          </button>
          <button
            type="button"
            className="btn-outline gap-2"
            disabled={busy !== null}
            onClick={sendWhatsApp}
          >
            <MessageCircle size={16} />
            {busy === "whatsapp" ? "Opening…" : "WhatsApp group"}
          </button>
          <button
            type="button"
            className="btn-outline gap-2"
            disabled={busy !== null || emails.length === 0}
            onClick={sendEmail}
            title="Needs a verified domain in Resend to reach everyone"
          >
            <Mail size={16} />
            {busy === "email" ? "Sending…" : "Resend all (needs domain)"}
          </button>
          <button
            type="button"
            className="btn-outline gap-2"
            disabled={busy !== null || !subject.trim()}
            onClick={copyMessage}
          >
            <Copy size={16} /> Copy message
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          “Email me + copy others” sends via Resend to {RESEND_TEST_INBOX} and copies the rest to
          your clipboard (comma-separated). No Gmail window.
        </p>
        {lastResult && (
          <div
            className={`mt-4 rounded-xl border p-4 text-sm ${
              lastResult.failures.length
                ? "border-amber-300/60 bg-amber-50 text-amber-950"
                : "border-forest/20 bg-forest/5 text-foreground"
            }`}
          >
            <p className="font-medium">
              Last send: {lastResult.sent}/{lastResult.total} delivered
            </p>
            {lastResult.failures.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {lastResult.failures.slice(0, 8).map((f) => (
                  <li key={f} className="break-words">
                    {f}
                  </li>
                ))}
                {lastResult.failures.length > 8 && (
                  <li>…and {lastResult.failures.length - 8} more</li>
                )}
              </ul>
            )}
            {lastResult.failures.some((f) => f.toLowerCase().includes("verify a domain")) && (
              <p className="mt-3 text-xs">
                Fix: verify a domain at{" "}
                <a
                  href="https://resend.com/domains"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  resend.com/domains
                </a>
                , then set{" "}
                <code className="rounded bg-white/70 px-1">RESEND_FROM</code> to an address on that
                domain (e.g. <code className="rounded bg-white/70 px-1">Bits &amp; Bots &lt;hello@yourdomain.com&gt;</code>
                ) and restart the server.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">WhatsApp group link</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite link for the Bits &amp; Bots parents group.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={whatsappUrl}
            onChange={(e) => setWhatsappUrl(e.target.value)}
            className="w-full flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="https://chat.whatsapp.com/…"
          />
          <button
            type="button"
            className="btn-outline shrink-0"
            disabled={busy !== null}
            onClick={saveWa}
          >
            {busy === "save-wa" ? "Saving…" : "Save link"}
          </button>
        </div>
      </div>
    </AdminReviewPage>
  );
}
