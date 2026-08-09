import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminReviewPage } from "@/components/admin/AdminShell";
import {
  fetchParentMediaConsentsAdmin,
  isParentConsentSetupMissing,
  parentConsentErrorMessage,
  type ParentMediaConsentRow,
} from "@/lib/parent-consent-admin";
import { Copy, ExternalLink } from "lucide-react";
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
  const [rows, setRows] = useState<ParentMediaConsentRow[]>([]);
  const [needsSetup, setNeedsSetup] = useState(false);

  async function load() {
    try {
      setRows(await fetchParentMediaConsentsAdmin());
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
  }, []);

  return (
    <AdminReviewPage
      active="parent-consents"
      title="Media consents"
      description="Signed parent permission for photos and video. Public form: /parentsconsent"
      toolbar={
        <a href="/parentsconsent" target="_blank" rel="noreferrer" className="btn-outline text-sm">
          Open public form
        </a>
      }
    >
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
                    No consents yet. Share{" "}
                    <a href="/parentsconsent" className="text-forest underline">
                      fllbots.com/parentsconsent
                    </a>{" "}
                    with families.
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
    </AdminReviewPage>
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
