import { supabase } from "@/integrations/supabase/client";
import { usesDemoPlaceholders } from "@/lib/demo/app-mode";
import { shouldUseDemoAssets } from "@/lib/demo/demo-tenant";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

export const PENDING_BUCKET = "gallery-pending";
export const APPROVED_BUCKET = "gallery-approved";

export const MAX_FILES_PER_SUBMISSION = 5;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 1800;
const OUTPUT_QUALITY = 0.82;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ApprovedGalleryPhoto = {
  id: string;
  url: string;
  caption: string | null;
  width: number | null;
  height: number | null;
};

export type PendingGalleryPhoto = {
  id: string;
  pendingPath: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  createdAt: string;
  previewUrl: string | null;
};

function toError(error: unknown): Error & { code?: string } {
  if (error instanceof Error) return error;
  if (error && typeof error === "object") {
    const { message, details, hint, code } = error as Record<string, unknown>;
    const text = [message, details, hint].filter(Boolean).join(" — ");
    const wrapped = new Error(text || "Request failed") as Error & { code?: string };
    if (typeof code === "string") wrapped.code = code;
    return wrapped;
  }
  return new Error(String(error ?? "Request failed"));
}

export function galleryErrorMessage(error: unknown): string {
  return toError(error).message;
}

/** True when setup-gallery-uploads.sql has not been run on this project yet. */
export function isGalleryUploadsSetupMissing(error: unknown): boolean {
  const wrapped = toError(error);
  if (wrapped.code === "PGRST202" || wrapped.code === "PGRST205" || wrapped.code === "42883") {
    return true;
  }
  const message = wrapped.message.toLowerCase();
  return (
    message.includes("gallery_photos") ||
    message.includes("list_approved_gallery_photos") ||
    message.includes("submit_gallery_photo") ||
    message.includes("gallery-pending") ||
    message.includes("gallery-approved") ||
    message.includes("bucket not found") ||
    message.includes("schema cache") ||
    (message.includes("function") && message.includes("does not exist"))
  );
}

/** Mirror of supabase/setup-gallery-uploads.sql, for the one-click copy button in admin. */
export const GALLERY_UPLOADS_SETUP_SQL = `-- Gallery photo uploads with admin review (run once in the Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status public.content_status NOT NULL DEFAULT 'pending',
  pending_path text,
  approved_path text,
  caption text,
  width integer,
  height integer,
  submitted_by_name text,
  submitted_by_email text,
  consent_confirmed boolean NOT NULL DEFAULT false,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT ALL ON public.gallery_photos TO service_role;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage gallery photos" ON public.gallery_photos;
CREATE POLICY "Admins manage gallery photos"
ON public.gallery_photos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_photos TO authenticated;

DROP TRIGGER IF EXISTS gallery_photos_set_updated_at ON public.gallery_photos;
CREATE TRIGGER gallery_photos_set_updated_at
BEFORE UPDATE ON public.gallery_photos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.list_approved_gallery_photos()
RETURNS TABLE (
  id uuid,
  approved_path text,
  caption text,
  width integer,
  height integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.approved_path, g.caption, g.width, g.height, g.created_at
  FROM public.gallery_photos g
  WHERE g.status = 'approved' AND g.approved_path IS NOT NULL
  ORDER BY g.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.submit_gallery_photo(
  p_pending_path text,
  p_caption text,
  p_submitted_by_name text,
  p_submitted_by_email text,
  p_consent_confirmed boolean,
  p_width integer,
  p_height integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF p_pending_path IS NULL OR length(trim(p_pending_path)) = 0 THEN
    RAISE EXCEPTION 'A photo file is required';
  END IF;

  IF p_consent_confirmed IS NOT TRUE THEN
    RAISE EXCEPTION 'Photo permission must be confirmed before uploading';
  END IF;

  IF p_submitted_by_name IS NULL OR length(trim(p_submitted_by_name)) = 0 THEN
    RAISE EXCEPTION 'Your name is required';
  END IF;

  IF p_submitted_by_email IS NULL OR p_submitted_by_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$' THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  INSERT INTO public.gallery_photos (
    status, pending_path, caption, width, height,
    submitted_by_name, submitted_by_email, consent_confirmed
  )
  VALUES (
    'pending', trim(p_pending_path), nullif(trim(coalesce(p_caption, '')), ''),
    p_width, p_height,
    trim(p_submitted_by_name), lower(trim(p_submitted_by_email)), true
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_approved_gallery_photos() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_gallery_photo(text, text, text, text, boolean, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_approved_gallery_photos() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_gallery_photo(text, text, text, text, boolean, integer, integer) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery-pending', 'gallery-pending', false, 8388608,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery-approved', 'gallery-approved', true, 8388608,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Anyone can upload pending gallery photos" ON storage.objects;
CREATE POLICY "Anyone can upload pending gallery photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'gallery-pending');

DROP POLICY IF EXISTS "Admins read pending gallery photos" ON storage.objects;
CREATE POLICY "Admins read pending gallery photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'gallery-pending'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins delete pending gallery photos" ON storage.objects;
CREATE POLICY "Admins delete pending gallery photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-pending'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Public read approved gallery photos" ON storage.objects;
CREATE POLICY "Public read approved gallery photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery-approved');

DROP POLICY IF EXISTS "Admins upload approved gallery photos" ON storage.objects;
CREATE POLICY "Admins upload approved gallery photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery-approved'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins delete approved gallery photos" ON storage.objects;
CREATE POLICY "Admins delete approved gallery photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-approved'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
`;

export function validateGalleryFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return `${file.name}: use a JPG, PNG, or WebP image.`;
  if (file.size > MAX_SOURCE_BYTES) return `${file.name}: must be 25 MB or smaller.`;
  return null;
}

type ResizedImage = { blob: Blob; width: number; height: number; mime: string; extension: string };

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // Honours EXIF rotation so phone photos are not sideways.
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Safari fallback below.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That image could not be read."));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/** Shrinks a phone-sized photo to something reasonable before it ever leaves the browser. */
export async function resizeForUpload(file: File): Promise<ResizedImage> {
  const source = await loadBitmap(file);
  const sourceWidth = "width" in source ? source.width : 0;
  const sourceHeight = "height" in source ? source.height : 0;
  if (!sourceWidth || !sourceHeight) throw new Error("That image could not be read.");

  const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process that image.");
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  if ("close" in source) source.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", OUTPUT_QUALITY),
  );
  if (!blob) throw new Error("That image could not be processed.");

  // Browsers without WebP encoding silently hand back a PNG, so follow the blob.
  const mime = ALLOWED_TYPES.has(blob.type) ? blob.type : "image/png";
  const extension = mime === "image/webp" ? "webp" : mime === "image/jpeg" ? "jpg" : "png";

  return { blob, width, height, mime, extension };
}

export type GallerySubmission = {
  name: string;
  email: string;
  caption: string;
  consent: boolean;
};

export async function submitGalleryPhotos(
  files: File[],
  details: GallerySubmission,
): Promise<number> {
  if (files.length === 0) throw new Error("Choose at least one photo to share.");
  if (files.length > MAX_FILES_PER_SUBMISSION) {
    throw new Error(`Please upload up to ${MAX_FILES_PER_SUBMISSION} photos at a time.`);
  }
  if (!details.consent) {
    throw new Error("Please confirm you have permission to share these photos.");
  }

  for (const file of files) {
    const problem = validateGalleryFile(file);
    if (problem) throw new Error(problem);
  }

  let saved = 0;
  for (const file of files) {
    const { blob, width, height, mime, extension } = await resizeForUpload(file);
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(PENDING_BUCKET).upload(path, blob, {
      contentType: mime,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw toError(uploadError);

    const tenantId = await tenantIdForQuery();
    const { error: rowError } = await supabase.rpc("submit_gallery_photo", {
      p_pending_path: path,
      p_caption: details.caption,
      p_submitted_by_name: details.name,
      p_submitted_by_email: details.email,
      p_consent_confirmed: true,
      p_width: width,
      p_height: height,
      p_tenant_id: tenantId,
    });

    if (rowError) {
      // Don't leave an orphaned file behind if the row could not be recorded.
      await supabase.storage.from(PENDING_BUCKET).remove([path]);
      throw toError(rowError);
    }
    saved += 1;
  }

  return saved;
}

export async function fetchApprovedGalleryPhotos(): Promise<ApprovedGalleryPhoto[]> {
  if (await shouldUseDemoAssets()) return [];

  const tenantId = await tenantIdForQuery();
  const { data, error } = await supabase.rpc("list_approved_gallery_photos", {
    p_tenant_id: tenantId,
  });
  if (error) throw toError(error);

  return (data ?? [])
    .filter((row: { approved_path: string | null }) => Boolean(row.approved_path))
    .map(
      (row: {
        id: string;
        approved_path: string;
        caption: string | null;
        width: number | null;
        height: number | null;
      }) => ({
        id: row.id,
        url: supabase.storage.from(APPROVED_BUCKET).getPublicUrl(row.approved_path).data
          .publicUrl,
        caption: row.caption ?? null,
        width: row.width ?? null,
        height: row.height ?? null,
      }),
    );
}

export async function fetchPendingGalleryPhotos(): Promise<PendingGalleryPhoto[]> {
  const tenantId = await tenantIdForQuery();
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw toError(error);

  const rows = data ?? [];
  const paths = rows.map((row) => row.pending_path).filter((p): p is string => Boolean(p));

  const signedUrls = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(PENDING_BUCKET)
      .createSignedUrls(paths, 60 * 60);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    pendingPath: row.pending_path,
    caption: row.caption,
    width: row.width,
    height: row.height,
    submittedByName: row.submitted_by_name,
    submittedByEmail: row.submitted_by_email,
    createdAt: row.created_at,
    previewUrl: row.pending_path ? (signedUrls.get(row.pending_path) ?? null) : null,
  }));
}

export async function approveGalleryPhoto(photo: PendingGalleryPhoto): Promise<void> {
  if (!photo.pendingPath) throw new Error("This submission has no photo file.");

  const approvedPath = photo.pendingPath;

  const { error: copyError } = await supabase.storage
    .from(PENDING_BUCKET)
    .copy(photo.pendingPath, approvedPath, { destinationBucket: APPROVED_BUCKET });

  if (copyError) {
    // Older storage versions don't support cross-bucket copy; fall back to a re-upload.
    const { data: file, error: downloadError } = await supabase.storage
      .from(PENDING_BUCKET)
      .download(photo.pendingPath);
    if (downloadError || !file) throw toError(downloadError ?? copyError);

    const { error: uploadError } = await supabase.storage
      .from(APPROVED_BUCKET)
      .upload(approvedPath, file, { contentType: file.type || "image/webp", upsert: true });
    if (uploadError) throw toError(uploadError);
  }

  const { data: userData } = await supabase.auth.getUser();
  const { error: rowError } = await supabase
    .from("gallery_photos")
    .update({
      status: "approved",
      approved_path: approvedPath,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userData.user?.id ?? null,
    })
    .eq("id", photo.id);
  if (rowError) throw toError(rowError);

  await supabase.storage.from(PENDING_BUCKET).remove([photo.pendingPath]);
}

export async function rejectGalleryPhoto(photo: PendingGalleryPhoto): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("gallery_photos")
    .update({
      status: "rejected",
      pending_path: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userData.user?.id ?? null,
    })
    .eq("id", photo.id);
  if (error) throw toError(error);

  if (photo.pendingPath) {
    await supabase.storage.from(PENDING_BUCKET).remove([photo.pendingPath]);
  }
}

/**
 * Admin-only: upload photos straight into the public gallery (no pending review).
 */
export async function addApprovedGalleryPhotos(
  files: File[],
  options?: { caption?: string },
): Promise<number> {
  if (files.length === 0) throw new Error("Choose at least one photo to add.");
  if (files.length > MAX_FILES_PER_SUBMISSION) {
    throw new Error(`Please add up to ${MAX_FILES_PER_SUBMISSION} photos at a time.`);
  }

  for (const file of files) {
    const problem = validateGalleryFile(file);
    if (problem) throw new Error(problem);
  }

  const { data: userData } = await supabase.auth.getUser();
  const caption = options?.caption?.trim() || null;
  const submittedByName =
    userData.user?.user_metadata?.full_name?.trim() ||
    userData.user?.email?.split("@")[0] ||
    "Coach";
  const now = new Date().toISOString();

  let saved = 0;
  for (const file of files) {
    const { blob, width, height, mime, extension } = await resizeForUpload(file);
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(APPROVED_BUCKET).upload(path, blob, {
      contentType: mime,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw toError(uploadError);

    const tenantId = await tenantIdForQuery();
    const { error: rowError } = await supabase.from("gallery_photos").insert({
      status: "approved",
      pending_path: null,
      approved_path: path,
      caption,
      width,
      height,
      submitted_by_name: submittedByName,
      submitted_by_email: userData.user?.email ?? null,
      consent_confirmed: true,
      reviewed_at: now,
      reviewed_by: userData.user?.id ?? null,
      tenant_id: tenantId,
    });

    if (rowError) {
      await supabase.storage.from(APPROVED_BUCKET).remove([path]);
      throw toError(rowError);
    }
    saved += 1;
  }

  return saved;
}

/** Removes an approved photo from the public gallery and deletes the file. */
export async function deleteApprovedGalleryPhoto(id: string, approvedPath: string): Promise<void> {
  const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
  if (error) throw toError(error);
  await supabase.storage.from(APPROVED_BUCKET).remove([approvedPath]);
}

export async function fetchApprovedGalleryRows() {
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw toError(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    approvedPath: row.approved_path,
    caption: row.caption,
    submittedByName: row.submitted_by_name,
    createdAt: row.created_at,
    url: row.approved_path
      ? supabase.storage.from(APPROVED_BUCKET).getPublicUrl(row.approved_path).data.publicUrl
      : null,
  }));
}
