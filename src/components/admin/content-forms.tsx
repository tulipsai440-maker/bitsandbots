import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ContentStatus, EagleScoutRow, ScoutmasterRow } from "@/lib/content";
import {
  removeScoutmasterPhoto,
  uploadScoutmasterPhoto,
  validateScoutmasterPhotoFile,
} from "@/lib/scoutmaster-photos";
import { toast } from "sonner";

export function statusBadge(status: ContentStatus) {
  const styles: Record<ContentStatus, string> = {
    pending: "bg-gold/20 text-forest-deep",
    approved: "bg-forest/15 text-forest",
    rejected: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}

export function EagleForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: EagleScoutRow | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [year, setYear] = useState(initial?.year ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [project, setProject] = useState(initial?.project ?? "");
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? "approved");
  const [busy, setBusy] = useState(false);
  const field = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const label = "text-xs font-medium uppercase tracking-widest text-muted-foreground";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = { year, name, project, status };
    const { error } = initial
      ? await supabase.from("eagle_scouts").update(payload).eq("id", initial.id)
      : await supabase.from("eagle_scouts").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Updated" : "Created");
    onDone();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={label}>Year</label>
          <input required value={year} onChange={(e) => setYear(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Project</label>
          <textarea required value={project} onChange={(e) => setProject(e.target.value)} className={field} rows={3} />
        </div>
        <div>
          <label className={label}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)} className={field}>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary">
          {initial ? "Save" : "Create"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ScoutmasterForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: ScoutmasterRow | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [years, setYears] = useState(initial?.years ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.photo_url ?? null);
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? "approved");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const field = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const label = "text-xs font-medium uppercase tracking-widest text-muted-foreground";

  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl(initial?.photo_url ?? null);
      return;
    }
    const objectUrl = URL.createObjectURL(photoFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile, initial?.photo_url]);

  function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateScoutmasterPhotoFile(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }
    setPhotoFile(file);
  }

  function clearPhotoSelection() {
    setPhotoFile(null);
    setPreviewUrl(initial?.photo_url ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const yearsValue = years.trim();
      const basePayload = {
        name: name.trim(),
        years: yearsValue,
        bio: bio.trim() || null,
        status,
      };

      if (initial) {
        let photoUrl = initial.photo_url;
        if (photoFile) {
          if (initial.photo_url?.includes("scoutmaster-photos")) {
            await removeScoutmasterPhoto(initial.photo_url);
          }
          photoUrl = await uploadScoutmasterPhoto(photoFile, initial.id);
        }
        const { error } = await supabase
          .from("scoutmasters")
          .update({ ...basePayload, photo_url: photoUrl })
          .eq("id", initial.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("scoutmasters")
          .insert({ ...basePayload, photo_url: null })
          .select("id")
          .single();
        if (error) throw error;

        if (photoFile) {
          const photoUrl = await uploadScoutmasterPhoto(photoFile, data.id);
          const { error: photoError } = await supabase
            .from("scoutmasters")
            .update({ photo_url: photoUrl })
            .eq("id", data.id);
          if (photoError) throw photoError;
        }
      }

      toast.success(initial ? "Updated" : "Created");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={label}>Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Years served</label>
          <input required value={years} onChange={(e) => setYears(e.target.value)} className={field} />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} className={field} rows={3} />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Headshot photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPhotoSelected}
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-forest file:px-3 file:py-2 file:text-sm file:font-medium file:text-cream hover:file:bg-forest/90"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Upload a headshot photo (JPG, PNG, or WebP, max 5 MB).
          </p>
          {previewUrl && (
            <div className="mt-3 flex items-start gap-4">
              <div className="overflow-hidden rounded-xl border border-border bg-sand">
                <img
                  src={previewUrl}
                  alt="Photo preview"
                  className="aspect-[3/4] h-48 w-36 object-cover object-top"
                />
              </div>
              {photoFile && (
                <button type="button" onClick={clearPhotoSelection} className="btn-outline text-xs">
                  Remove new photo
                </button>
              )}
            </div>
          )}
        </div>
        <div>
          <label className={label}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)} className={field}>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : initial ? "Save" : "Create"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}
