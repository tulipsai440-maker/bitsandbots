import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminQuickShell } from "@/components/admin/AdminQuickShell";
import {
  broadcastErrorMessage,
  fetchCoachBroadcastEmails,
  fetchParentBroadcastEmails,
  fetchParentBroadcastPhones,
  fetchWhatsAppGroupUrl,
  formatBroadcastMessage,
  isBroadcastSetupMissing,
  openWhatsAppGroupWithMessage,
  probeBroadcastSettingsTable,
  saveWhatsAppGroupUrl,
} from "@/lib/broadcast";
import { getBroadcastTemplates } from "@/lib/broadcast-templates";
import { brandingFromSettings } from "@/lib/team-branding";
import { useSiteSettings } from "@/lib/site-settings-context";
import { sendBroadcastWhatsApp, sendParentBroadcast } from "@/lib/broadcast.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, ExternalLink, Mail, MessageCircle, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/broadcast")({
  component: AdminBroadcastPage,
});

const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new";

function AdminBroadcastPage() {
  const siteSettings = useSiteSettings();
  const broadcastTemplates = getBroadcastTemplates(brandingFromSettings(siteSettings));
  const defaultTemplate =
    broadcastTemplates.find((t) => t.id === "general-update") ?? broadcastTemplates[0];
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [coachCcEmails, setCoachCcEmails] = useState<string[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [subject, setSubject] = useState(defaultTemplate.subject);
  const [body, setBody] = useState(defaultTemplate.body);
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
      const broadcastTableOk = await probeBroadcastSettingsTable();
      setNeedsSetup(!broadcastTableOk);

      const [list, coachList, phoneList, wa] = await Promise.all([
        fetchParentBroadcastEmails(),
        fetchCoachBroadcastEmails(),
        fetchParentBroadcastPhones(),
        fetchWhatsAppGroupUrl(),
      ]);
      setToEmails(list);
      setCoachCcEmails(coachList);
      setPhones(phoneList);
      setWhatsappUrl(wa);
    } catch (e) {
      toast.error(broadcastErrorMessage(e));
      try {
        const broadcastTableOk = await probeBroadcastSettingsTable();
        setNeedsSetup(!broadcastTableOk);
        const [list, coachList, phoneList, wa] = await Promise.all([
          fetchParentBroadcastEmails().catch(() => [] as string[]),
          fetchCoachBroadcastEmails().catch(() => [] as string[]),
          fetchParentBroadcastPhones().catch(() => [] as string[]),
          fetchWhatsAppGroupUrl(),
        ]);
        setToEmails(list);
        setCoachCcEmails(coachList);
        setPhones(phoneList);
        setWhatsappUrl(wa);
      } catch {
        /* partial load failed */
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
    if (toEmails.length === 0) {
      toast.error("No parent emails in To — add them under Admin → Parents or restore recipients.");
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
          onlyTo: toEmails,
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
      await load();
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
      await navigator.clipboard.writeText(toEmails.join(", "));
      toast.success("To emails copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  function removeToEmail(email: string) {
    setToEmails((prev) => prev.filter((e) => e !== email));
  }

  function restoreAllToEmails() {
    void fetchParentBroadcastEmails()
      .then(setToEmails)
      .catch((e) => toast.error(broadcastErrorMessage(e)));
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
    <AdminQuickShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Send message to parents</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          All parent emails load in <strong className="text-foreground">To</strong> — remove anyone
          who should not receive this send. Coaches are always CC&apos;d. Pick a template to start
          fast.
        </p>
      </div>

      {needsSetup && (
        <div className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-medium">Optional: save WhatsApp link in the database</p>
          <p className="mt-1">
            Run <code className="rounded bg-white/70 px-1">supabase/setup-broadcast.sql</code> once
            in Supabase so the group link is shared for all admins. Until then, the default group
            link still works.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={SQL_EDITOR_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-outline inline-flex gap-2"
            >
              <ExternalLink size={16} /> Open SQL Editor
            </a>
            <button type="button" className="btn-outline" onClick={load}>
              Check again
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-sand/40 p-5 text-sm">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              To
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-outline gap-2 !px-3 !py-1.5 text-xs"
                onClick={copyEmails}
                disabled={toEmails.length === 0}
              >
                <Copy size={14} /> Copy
              </button>
              <button
                type="button"
                className="btn-outline !px-3 !py-1.5 text-xs"
                onClick={restoreAllToEmails}
              >
                Restore all
              </button>
            </div>
          </div>
          <p className="mt-1 text-muted-foreground">
            {toEmails.length} parent email{toEmails.length === 1 ? "" : "s"} — tap × to remove
            anyone who should not receive this message.
          </p>
          {toEmails.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {toEmails.map((email) => (
                <li key={email}>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground">
                    {email}
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => removeToEmail(email)}
                      aria-label={`Remove ${email}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-amber-800">
              No recipients in To. Add parent emails under Admin → Parents, or tap Restore all.
            </p>
          )}
        </div>

        <div className="border-t border-border/60 pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">CC</p>
          <p className="mt-1 text-muted-foreground">
            Coach emails are CC&apos;d on every parent message (
            {coachCcEmails.length} address{coachCcEmails.length === 1 ? "" : "es"}).{" "}
            <Link to="/admin/join-notifications" className="font-medium text-forest underline">
              Manage coach CC emails
            </Link>
          </p>
          {coachCcEmails.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {coachCcEmails.map((email) => (
                <li key={email}>
                  <span className="inline-flex rounded-full border border-forest/20 bg-forest/5 px-2.5 py-1 text-xs text-foreground">
                    {email}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No coach CC emails yet.{" "}
              <Link to="/admin/join-notifications" className="font-medium text-forest underline">
                Add coach CC emails
              </Link>
              .
            </p>
          )}
        </div>

        <p className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
          {phones.length} unique parent phone{phones.length === 1 ? "" : "s"} for WhatsApp — from{" "}
          <code className="rounded bg-muted px-1">parent_contacts</code>.
        </p>
      </div>

      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Quick templates
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {broadcastTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-forest/40 hover:bg-forest/5"
                onClick={() => {
                  setSubject(template.subject);
                  setBody(template.body);
                  toast.success(`Template: ${template.label}`);
                }}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Subject
          </span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
            placeholder="Reminder: team practice this Sunday"
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
            placeholder="Hi families — a quick team update…"
            maxLength={10000}
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            className="btn-primary gap-2"
            disabled={busy !== null || toEmails.length === 0}
            onClick={sendEmail}
          >
            <Mail size={16} />
            {busy === "email" ? "Sending…" : `Send email (${toEmails.length})`}
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
    </AdminQuickShell>
  );
}
