import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminReviewPage } from "@/components/admin/AdminShell";
import {
  broadcastErrorMessage,
  fetchParentBroadcastEmails,
  fetchParentBroadcastPhones,
  fetchWhatsAppGroupUrl,
  formatBroadcastMessage,
  isBroadcastSetupMissing,
  openWhatsAppGroupWithMessage,
  saveWhatsAppGroupUrl,
} from "@/lib/broadcast";
import { sendBroadcastWhatsApp, sendParentBroadcast } from "@/lib/broadcast.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, ExternalLink, Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/broadcast")({
  component: AdminBroadcastPage,
});

const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new";

function AdminBroadcastPage() {
  const [emails, setEmails] = useState<string[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState<"email" | "whatsapp" | "whatsapp-group" | "save-wa" | null>(
    null,
  );
  const [needsSetup, setNeedsSetup] = useState(false);
  const [lastResult, setLastResult] = useState<{
    sent: number;
    total: number;
    failures: string[];
    channel?: "email" | "whatsapp";
    mode?: "text" | "template";
  } | null>(null);

  async function load() {
    try {
      const [list, phoneList, wa] = await Promise.all([
        fetchParentBroadcastEmails(),
        fetchParentBroadcastPhones(),
        fetchWhatsAppGroupUrl(),
      ]);
      setEmails(list);
      setPhones(phoneList);
      setWhatsappUrl(wa);
      setNeedsSetup(false);
    } catch (e) {
      if (isBroadcastSetupMissing(e)) {
        setNeedsSetup(true);
        try {
          const [list, phoneList] = await Promise.all([
            fetchParentBroadcastEmails(),
            fetchParentBroadcastPhones(),
          ]);
          setEmails(list);
          setPhones(phoneList);
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

      setLastResult({ ...result, channel: "email" });
      if (result.failures.length > 0) {
        toast.error(
          `Email sent to ${result.sent} of ${result.total} parents. See failures below.`,
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

  async function sendWhatsAppToParents() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and message first.");
      return;
    }
    if (phones.length === 0) {
      toast.error("No parent phones yet — add them under Admin → Parents.");
      return;
    }

    setBusy("whatsapp");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not signed in — refresh and try again.");

      const result = await sendBroadcastWhatsApp({
        data: {
          subject: subject.trim(),
          body: body.trim(),
          accessToken,
        },
      });

      setLastResult({
        sent: result.sent,
        total: result.total,
        failures: result.failures,
        channel: "whatsapp",
        mode: result.mode,
      });

      if (result.failures.length > 0) {
        toast.error(
          `WhatsApp delivered ${result.sent} of ${result.total}. Check failures below.`,
        );
      } else {
        toast.success(
          `WhatsApp sent to ${result.sent} parent${result.sent === 1 ? "" : "s"} (${result.mode})`,
        );
      }
    } catch (e) {
      toast.error(broadcastErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function openWhatsAppGroup() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and message first.");
      return;
    }
    setBusy("whatsapp-group");
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
      description="Email all parents with one click, or send WhatsApp messages automatically."
    >
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
              {emails.length} unique parent email{emails.length === 1 ? "" : "s"} ·{" "}
              {phones.length} unique phone{phones.length === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-muted-foreground">
              Pulled from <code className="rounded bg-muted px-1">parent_contacts</code> — duplicates
              removed.
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
            disabled={busy !== null || emails.length === 0}
            onClick={sendEmail}
          >
            <Mail size={16} />
            {busy === "email" ? "Sending…" : `Send email (${emails.length})`}
          </button>
          <button
            type="button"
            className="btn-outline gap-2"
            disabled={busy !== null || phones.length === 0}
            onClick={sendWhatsAppToParents}
            title="Requires WhatsApp Business Cloud API credentials"
          >
            <MessageCircle size={16} />
            {busy === "whatsapp"
              ? "Sending…"
              : `Send WhatsApp (${phones.length})`}
          </button>
          <button
            type="button"
            className="btn-outline gap-2"
            disabled={busy !== null}
            onClick={openWhatsAppGroup}
            title="Opens the group invite — paste & send manually"
          >
            <MessageCircle size={16} />
            {busy === "whatsapp-group" ? "Opening…" : "Open WhatsApp group"}
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

        {lastResult && (
          <div
            className={`mt-4 rounded-xl border p-4 text-sm ${
              lastResult.failures.length
                ? "border-amber-300/60 bg-amber-50 text-amber-950"
                : "border-forest/20 bg-forest/5 text-foreground"
            }`}
          >
            <p className="font-medium">
              Last {lastResult.channel === "whatsapp" ? "WhatsApp" : "email"} send:{" "}
              {lastResult.sent}/{lastResult.total} delivered
              {lastResult.mode ? ` (${lastResult.mode})` : ""}
            </p>
            {lastResult.failures.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {lastResult.failures.map((f) => (
                  <li key={f} className="break-words">
                    {f}
                  </li>
                ))}
              </ul>
            )}
            {lastResult.channel === "email" &&
              lastResult.failures.some((f) => f.toLowerCase().includes("not verified")) && (
                <p className="mt-3 text-xs">
                  Add DNS records at{" "}
                  <a
                    href="https://resend.com/domains"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    resend.com/domains
                  </a>{" "}
                  → Cloudflare → DNS for fllbots.com. See{" "}
                  <code className="rounded bg-white/70 px-1">supabase/EMAIL-SETUP.txt</code>.
                </p>
              )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">WhatsApp group link (manual)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite links cannot auto-send. Use <strong className="text-foreground">Send WhatsApp</strong>{" "}
          above for automatic delivery to parent phone numbers.
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
