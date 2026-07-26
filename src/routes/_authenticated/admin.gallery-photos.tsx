import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminReviewPage } from "@/components/admin/AdminShell";
import {
  approveGalleryPhoto,
  deleteApprovedGalleryPhoto,
  fetchApprovedGalleryRows,
  fetchPendingGalleryPhotos,
  galleryErrorMessage,
  GALLERY_UPLOADS_SETUP_SQL,
  isGalleryUploadsSetupMissing,
  rejectGalleryPhoto,
  type PendingGalleryPhoto,
} from "@/lib/gallery-uploads";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, ExternalLink, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/gallery-photos")({
  component: AdminGalleryPhotosPage,
});

const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/xohaeezxzbeyzpjbngkj/sql/new";

type ApprovedRow = Awaited<ReturnType<typeof fetchApprovedGalleryRows>>[number];

async function copySetupSql() {
  try {
    await navigator.clipboard.writeText(GALLERY_UPLOADS_SETUP_SQL);
    toast.success("SQL copied — paste into Supabase SQL Editor and click Run");
  } catch {
    toast.error("Could not copy — open supabase/setup-gallery-uploads.sql in the project");
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AdminGalleryPhotosPage() {
  const [pending, setPending] = useState<PendingGalleryPhoto[]>([]);
  const [approved, setApproved] = useState<ApprovedRow[]>([]);
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [pendingRows, approvedRows] = await Promise.all([
        fetchPendingGalleryPhotos(),
        fetchApprovedGalleryRows(),
      ]);
      setPending(pendingRows);
      setApproved(approvedRows);
      setNeedsSetup(false);
      setError(null);
    } catch (e) {
      if (isGalleryUploadsSetupMissing(e)) {
        setNeedsSetup(true);
        setError(null);
      } else {
        console.error("[gallery-photos] Load failed", e);
        setError(galleryErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(photo: PendingGalleryPhoto) {
    setBusyId(photo.id);
    try {
      await approveGalleryPhoto(photo);
      toast.success("Photo approved — it is now live on the gallery");
      await load();
    } catch (e) {
      console.error("[gallery-photos] Approve failed", e);
      toast.error(galleryErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(photo: PendingGalleryPhoto) {
    if (!confirm("Reject this photo? The file will be deleted and cannot be recovered.")) return;
    setBusyId(photo.id);
    try {
      await rejectGalleryPhoto(photo);
      toast.success("Photo rejected and deleted");
      await load();
    } catch (e) {
      console.error("[gallery-photos] Reject failed", e);
      toast.error(galleryErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  async function removeApproved(row: ApprovedRow) {
    if (!row.approvedPath) return;
    if (!confirm("Remove this photo from the gallery? This cannot be undone.")) return;
    setBusyId(row.id);
    try {
      await deleteApprovedGalleryPhoto(row.id, row.approvedPath);
      toast.success("Photo removed from the gallery");
      await load();
    } catch (e) {
      console.error("[gallery-photos] Delete failed", e);
      toast.error(galleryErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminReviewPage
      active="gallery-photos"
      title="Photo Review"
      description="Photos submitted from the gallery page stay private until you approve them."
      toolbar={
        needsSetup ? undefined : (
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            <button
              onClick={() => setTab("pending")}
              className={`rounded-full px-4 py-2 text-sm ${tab === "pending" ? "bg-gold font-medium text-forest-deep" : "text-muted-foreground"}`}
            >
              Pending {pending.length > 0 ? `(${pending.length})` : ""}
            </button>
            <button
              onClick={() => setTab("approved")}
              className={`rounded-full px-4 py-2 text-sm ${tab === "approved" ? "bg-muted font-medium text-foreground" : "text-muted-foreground"}`}
            >
              In the gallery {approved.length > 0 ? `(${approved.length})` : ""}
            </button>
          </div>
        )
      }
    >
      {needsSetup && <GallerySetupBanner onRetry={load} />}

      {error && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
          <p className="font-medium text-destructive">Could not load photo submissions</p>
          <p className="mt-1 text-destructive/90">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={load} className="btn-outline">
              Try again
            </button>
            <button type="button" onClick={copySetupSql} className="btn-outline gap-2">
              <Copy size={16} /> Copy setup SQL
            </button>
            <a href={SQL_EDITOR_URL} target="_blank" rel="noreferrer" className="btn-outline gap-2">
              <ExternalLink size={16} /> Open SQL Editor
            </a>
          </div>
        </div>
      )}

      {loading && <p className="text-muted-foreground">Loading photos…</p>}

      {!loading && !needsSetup && tab === "pending" && (
        <>
          {pending.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="font-display text-xl text-foreground">Nothing waiting for review.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                New submissions from the gallery page will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pending.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="aspect-[4/3] bg-sand">
                    {photo.previewUrl ? (
                      <img
                        src={photo.previewUrl}
                        alt={photo.caption ?? "Submitted photo awaiting review"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-sm text-muted-foreground">
                        Preview unavailable
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    {photo.caption && <p className="text-sm text-foreground">{photo.caption}</p>}
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {photo.submittedByName ?? "Unknown"}
                      </p>
                      {photo.submittedByEmail && <p>{photo.submittedByEmail}</p>}
                      <p className="mt-1">Submitted {formatDate(photo.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(photo)}
                        disabled={busyId === photo.id}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-forest px-3 py-2 text-xs font-medium text-cream transition-[filter] hover:brightness-110 disabled:opacity-40"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => reject(photo)}
                        disabled={busyId === photo.id}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && !needsSetup && tab === "approved" && (
        <>
          {approved.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="font-display text-xl text-foreground">No approved submissions yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                The gallery is still showing only the built-in troop photos.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {approved.map((row) => (
                <div
                  key={row.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="aspect-[4/3] bg-sand">
                    {row.url && (
                      <img
                        src={row.url}
                        alt={row.caption ?? "Approved gallery photo"}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    {row.caption && <p className="text-sm text-foreground">{row.caption}</p>}
                    <p className="text-xs text-muted-foreground">
                      From {row.submittedByName ?? "Unknown"} · {formatDate(row.createdAt)}
                    </p>
                    <button
                      onClick={() => removeApproved(row)}
                      disabled={busyId === row.id}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                    >
                      <Trash2 size={14} /> Remove from gallery
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminReviewPage>
  );
}

function GallerySetupBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-50 px-6 py-5 text-sm dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-700" />
        <div className="space-y-3">
          <div>
            <p className="font-medium text-amber-950 dark:text-amber-100">
              One-time database setup required
            </p>
            <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
              Run the setup SQL once to turn on photo submissions and this review page.
            </p>
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-amber-900/80 dark:text-amber-100/80">
            <li>Open the Supabase SQL Editor</li>
            <li>Copy the setup SQL (button below)</li>
            <li>
              Paste it and click <strong>Run</strong>
            </li>
            <li>
              Return here and click <strong>Check again</strong>
            </li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <a href={SQL_EDITOR_URL} target="_blank" rel="noreferrer" className="btn-primary gap-2">
              <ExternalLink size={16} /> Open SQL Editor
            </a>
            <button type="button" onClick={copySetupSql} className="btn-outline gap-2">
              <Copy size={16} /> Copy setup SQL
            </button>
            <button type="button" onClick={onRetry} className="btn-outline">
              Check again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
