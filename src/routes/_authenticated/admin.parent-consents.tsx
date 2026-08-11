import { createFileRoute, Link } from "@tanstack/react-router";

import { useEffect, useMemo, useState } from "react";

import { AdminQuickShell } from "@/components/admin/AdminQuickShell";

import {

  fetchParentMediaConsentsAdmin,

  isParentConsentSetupMissing,

  parentConsentErrorMessage,

  type ParentMediaConsentRow,

} from "@/lib/parent-consent-admin";

import {
  fetchUnsignedConsentFamilies,
  type UnsignedConsentFamily,
} from "@/lib/consent-reminders";
import { consentFormUrl, brandingFromSettings } from "@/lib/team-branding";
import { useSiteSettings } from "@/lib/site-settings-context";

import { sendConsentFormReminderEmails } from "@/lib/parent-consent.functions";

import { supabase } from "@/integrations/supabase/client";

import { Copy, ExternalLink, Mail, RefreshCw } from "lucide-react";

import { toast } from "sonner";



export const Route = createFileRoute("/_authenticated/admin/parent-consents")({

  component: AdminParentConsentsPage,

});



const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new";

function formatDate(value: string): string {

  const [y, m, d] = value.split("-").map(Number);

  if (!y || !m || !d) return value;

  return new Date(y, m - 1, d).toLocaleDateString("en-US", {

    month: "short",

    day: "numeric",

    year: "numeric",

  });

}



function formatWhen(iso: string): string {

  return new Date(iso).toLocaleString("en-US", {

    month: "short",

    day: "numeric",

    year: "numeric",

    hour: "numeric",

    minute: "2-digit",

  });

}



function AdminParentConsentsPage() {

  const siteSettings = useSiteSettings();

  const formUrl = consentFormUrl(brandingFromSettings(siteSettings));

  const [rows, setRows] = useState<ParentMediaConsentRow[]>([]);

  const [unsigned, setUnsigned] = useState<UnsignedConsentFamily[]>([]);

  const [needsSetup, setNeedsSetup] = useState(false);

  const [busy, setBusy] = useState(false);

  const [lastSend, setLastSend] = useState<{

    sent: number;

    total: number;

    skippedNoEmail: string[];

    failures: string[];

  } | null>(null);



  async function load() {

    try {

      const [signed, pending] = await Promise.all([

        fetchParentMediaConsentsAdmin(),

        fetchUnsignedConsentFamilies(),

      ]);

      setRows(signed);

      setUnsigned(pending);

      setNeedsSetup(false);

    } catch (e) {

      if (isParentConsentSetupMissing(e)) {

        setNeedsSetup(true);

      } else {

        toast.error(parentConsentErrorMessage(e));

      }

    }

  }



  useEffect(() => {

    load();

    const refresh = () => load();

    window.addEventListener("focus", refresh);

    document.addEventListener("visibilitychange", () => {

      if (document.visibilityState === "visible") refresh();

    });

    return () => window.removeEventListener("focus", refresh);

  }, []);



  const recipientCount = useMemo(() => {

    const emails = new Set<string>();

    for (const family of unsigned) {

      for (const r of family.recipients) {

        if (r.email.includes("@")) emails.add(r.email.toLowerCase());

      }

    }

    return emails.size;

  }, [unsigned]);



  async function sendReminders() {

    if (unsigned.length === 0) {

      toast.message("Everyone has signed — nothing to send.");

      return;

    }

    if (recipientCount === 0) {

      toast.error("Add parent emails under Admin → Parents first.");

      return;

    }



    setBusy(true);

    try {

      const { data: sessionData } = await supabase.auth.getSession();

      const accessToken = sessionData.session?.access_token;

      if (!accessToken) throw new Error("Not signed in — refresh and try again.");



      const result = await sendConsentFormReminderEmails({ data: { accessToken } });

      setLastSend(result);



      if (result.sent === 0) {

        toast.message("No emails sent — all teammates may already be signed.");

      } else if (result.failures.length) {

        toast.error(`Sent ${result.sent} of ${result.total}. See details below.`);

      } else {

        toast.success(

          `Consent form link sent to ${result.sent} parent email${result.sent === 1 ? "" : "s"}`,

        );

      }

    } catch (e) {

      toast.error(e instanceof Error ? e.message : "Send failed");

    } finally {

      setBusy(false);

    }

  }



  return (

    <AdminQuickShell>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">

        <div>

          <h1 className="font-display text-3xl text-foreground">Media consents</h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">

            Signed forms appear below. Email parents who haven&apos;t signed yet — each message

            includes a link to{" "}

            <a href="/parentsconsent" className="text-forest underline" target="_blank" rel="noreferrer">

              the consent form

            </a>

            . Coaches are CC&apos;d.

          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          <button type="button" className="btn-outline gap-2 text-sm" onClick={load}>

            <RefreshCw size={16} /> Refresh

          </button>

          <a href="/parentsconsent" target="_blank" rel="noreferrer" className="btn-outline text-sm">

            Open public form

          </a>

        </div>

      </div>



      {!needsSetup && unsigned.length > 0 && (

        <div className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>

              <p className="font-medium text-amber-950">

                {unsigned.length} teammate{unsigned.length === 1 ? "" : "s"} still need consent

              </p>

              <p className="mt-1 text-sm text-amber-900/90">

                Will email {recipientCount} parent address{recipientCount === 1 ? "" : "es"} with

                link to {formUrl.replace(/^https?:\/\//, "")}

              </p>

              <ul className="mt-3 space-y-1 text-sm text-amber-950">

                {unsigned.map((family) => (

                  <li key={family.teamMemberId}>

                    <strong>{family.kidName}</strong>

                    {family.recipients.length > 0 ? (

                      <span className="text-amber-900/90">

                        {" "}

                        → {family.recipients.map((r) => r.email).join(", ")}

                      </span>

                    ) : (

                      <span className="text-amber-800"> — no parent email on file</span>

                    )}

                  </li>

                ))}

              </ul>

            </div>

            <button

              type="button"

              className="btn-primary shrink-0 gap-2"

              disabled={busy || recipientCount === 0}

              onClick={sendReminders}

            >

              <Mail size={16} />

              {busy ? "Sending…" : "Send consent forms to parents"}

            </button>

          </div>

          {recipientCount === 0 && (

            <p className="mt-3 text-sm text-amber-900">

              Add parent emails under{" "}

              <Link to="/admin/parent-contacts" className="font-medium underline">

                Admin → Parents

              </Link>{" "}

              before sending.

            </p>

          )}

        </div>

      )}



      {!needsSetup && unsigned.length === 0 && rows.length > 0 && (

        <div className="mb-6 rounded-2xl border border-forest/20 bg-forest/5 p-4 text-sm text-foreground">

          All teammates have a signed consent on file.

        </div>

      )}



      {lastSend && (

        <div

          className={`mb-6 rounded-xl border p-4 text-sm ${

            lastSend.failures.length

              ? "border-amber-300/60 bg-amber-50 text-amber-950"

              : "border-forest/20 bg-forest/5 text-foreground"

          }`}

        >

          <p className="font-medium">

            Last send: {lastSend.sent}/{lastSend.total} delivered

          </p>

          {lastSend.skippedNoEmail.length > 0 && (

            <p className="mt-2 text-xs">

              No email on file for: {lastSend.skippedNoEmail.join(", ")}

            </p>

          )}

          {lastSend.failures.length > 0 && (

            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">

              {lastSend.failures.map((f) => (

                <li key={f}>{f}</li>

              ))}

            </ul>

          )}

        </div>

      )}



      {needsSetup && (

        <div className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-950">

          <p className="font-medium">One-time setup required</p>

          <p className="mt-1">

            Run <code className="rounded bg-white/70 px-1">supabase/setup-parent-media-consents.sql</code>{" "}

            in the Supabase SQL Editor.

          </p>

          <div className="mt-4 flex flex-wrap gap-2">

            <a href={SQL_EDITOR_URL} target="_blank" rel="noreferrer" className="btn-outline gap-2">

              <ExternalLink size={16} /> Open SQL Editor

            </a>

            <button

              type="button"

              className="btn-outline gap-2"

              onClick={async () => {

                try {

                  await navigator.clipboard.writeText(

                    "Open supabase/setup-parent-media-consents.sql, copy all, paste into Supabase SQL Editor, Run.",

                  );

                  toast.success("Reminder copied");

                } catch {

                  toast.error("Open setup-parent-media-consents.sql in the repo");

                }

              }}

            >

              <Copy size={16} /> How to run

            </button>

            <button type="button" className="btn-outline" onClick={load}>

              Check again

            </button>

          </div>

        </div>

      )}



      {!needsSetup && (

        <div className="overflow-x-auto rounded-2xl border border-border">

          <table className="w-full min-w-[880px] text-left text-sm">

            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">

              <tr>

                <th className="px-4 py-3">Teammate</th>

                <th className="px-4 py-3">Signed by</th>

                <th className="px-4 py-3">Signature date</th>

                <th className="px-4 py-3">Mother</th>

                <th className="px-4 py-3">Father</th>

                <th className="px-4 py-3">Submitted</th>

              </tr>

            </thead>

            <tbody>

              {rows.length === 0 ? (

                <tr>

                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">

                    No consents yet. Use{" "}

                    <strong className="text-foreground">Send consent forms to parents</strong> above,

                    or share{" "}

                    <a href="/parentsconsent" className="text-forest underline">

                      the consent form

                    </a>

                    .

                  </td>

                </tr>

              ) : (

                rows.map((row) => (

                  <tr key={row.id} className="border-b border-border/70 align-top last:border-0">

                    <td className="px-4 py-3 font-medium">{row.kidName}</td>

                    <td className="px-4 py-3">

                      {row.signedByName}

                      <div className="text-xs text-muted-foreground">{row.signedByRelation}</div>

                    </td>

                    <td className="px-4 py-3">{formatDate(row.signatureDate)}</td>

                    <td className="px-4 py-3">

                      <ContactCell name={row.motherName} email={row.motherEmail} phone={row.motherPhone} />

                    </td>

                    <td className="px-4 py-3">

                      <ContactCell name={row.fatherName} email={row.fatherEmail} phone={row.fatherPhone} />

                    </td>

                    <td className="px-4 py-3 text-muted-foreground">{formatWhen(row.createdAt)}</td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      )}

    </AdminQuickShell>

  );

}



function ContactCell({

  name,

  email,

  phone,

}: {

  name: string | null;

  email: string | null;

  phone: string | null;

}) {

  if (!name && !email && !phone) return <span className="text-muted-foreground">—</span>;

  return (

    <div className="space-y-1">

      {name && <div>{name}</div>}

      {email && (

        <a href={`mailto:${email}`} className="block text-xs text-forest underline">

          {email}

        </a>

      )}

      {phone && <div className="text-xs text-muted-foreground">{phone}</div>}

    </div>

  );

}


