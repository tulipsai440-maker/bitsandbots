import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AdminQuickShell } from "@/components/admin/AdminQuickShell";
import { TeamPhoto } from "@/components/site/TeamPhoto";
import {
  fetchSiteImageRowsForAdmin,
  isSiteImagesSetupMissing,
  resetSiteImageOverride,
  SITE_IMAGES_SETUP_SQL,
  siteImagesErrorMessage,
  uploadSiteImageOverride,
  type SiteImageKey,
} from "@/lib/site-images";
import { toast } from "sonner";
import { AlertTriangle, Copy, RotateCcw, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/site-images")({
  component: AdminSiteImagesPage,
});

const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new";

async function copySetupSql() {
  try {
    await navigator.clipboard.writeText(SITE_IMAGES_SETUP_SQL);
    toast.success("SQL copied — paste into Supabase SQL Editor and click Run");
  } catch {
    toast.error("Could not copy — open supabase/setup-site-images.sql in the project");
  }
}

function AdminSiteImagesPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof fetchSiteImageRowsForAdmin>>>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<SiteImageKey | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchSiteImageRowsForAdmin());
      setNeedsSetup(false);
      setError(null);
    } catch (e) {
      if (isSiteImagesSetupMissing(e)) {
        setNeedsSetup(true);
        setError(null);
      } else {
        setError(siteImagesErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onUpload(key: SiteImageKey, file: File) {
    setBusyKey(key);
    try {
      await uploadSiteImageOverride(key, file);
      toast.success("Image updated — refresh the homepage to preview");
      await load();
    } catch (e) {
      toast.error(siteImagesErrorMessage(e));
    } finally {
      setBusyKey(null);
    }
  }

  async function onReset(key: SiteImageKey) {
    if (!confirm("Reset this image to the bundled default?")) return;
    setBusyKey(key);
    try {
      await resetSiteImageOverride(key);
      toast.success("Reset to default");
      await load();
    } catch (e) {
      toast.error(siteImagesErrorMessage(e));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <AdminQuickShell>
      {needsSetup && (
        <div className="mb-8 rounded-2xl border border-amber-300/60 bg-amber-50 p-6 text-sm text-amber-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-medium">One-time setup required</p>
              <p className="mt-2 text-amber-900/90">
                Run <code className="rounded bg-white/70 px-1">supabase/setup-site-images.sql</code> in
                the Supabase SQL Editor, then refresh this page.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={SQL_EDITOR_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Open SQL Editor
                </a>
                <button type="button" onClick={copySetupSql} className="btn-outline gap-2">
                  <Copy size={16} /> Copy reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading site images…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {rows.map((row) => (
            <article key={row.key} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div
                className={`overflow-hidden bg-sand ${row.aspect === "16/9" ? "aspect-video" : "aspect-[4/3]"}`}
              >
                <TeamPhoto
                  src={row.url}
                  alt={row.alt}
                  className="h-full w-full object-cover"
                  label={row.label}
                />
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl">{row.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{row.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      row.isOverride
                        ? "bg-forest/10 text-forest"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.isOverride ? "Custom upload" : "Default"}
                  </span>
                </div>

                {row.updatedAt && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Updated {new Date(row.updatedAt).toLocaleString()}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <input
                    ref={(el) => {
                      fileInputs.current[row.key] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onUpload(row.key, file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    disabled={busyKey === row.key || needsSetup}
                    onClick={() => fileInputs.current[row.key]?.click()}
                    className="btn-primary gap-2"
                  >
                    <Upload size={16} />
                    {busyKey === row.key ? "Uploading…" : "Upload replacement"}
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === row.key || !row.isOverride || needsSetup}
                    onClick={() => void onReset(row.key)}
                    className="btn-outline gap-2"
                  >
                    <RotateCcw size={16} /> Reset default
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminQuickShell>
  );
}
