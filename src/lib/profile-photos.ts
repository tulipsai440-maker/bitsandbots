import { supabase } from "@/integrations/supabase/client";

export const PROFILE_PHOTOS_BUCKET = "profile-photos";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateProfilePhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return "Use a JPG, PNG, or WebP photo.";
  if (file.size > MAX_BYTES) return "Photo must be 5 MB or smaller.";
  return null;
}

function fileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadProfilePhoto(
  file: File,
  folder: "team" | "coaches" | "sponsors",
  recordId?: string,
): Promise<string> {
  const validation = validateProfilePhotoFile(file);
  if (validation) throw new Error(validation);

  const id = recordId ?? "new";
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExtension(file)}`;
  const path = `${folder}/${id}/${filename}`;

  const { error } = await supabase.storage.from(PROFILE_PHOTOS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    if (error.message.toLowerCase().includes("bucket")) {
      throw new Error(
        "Photo storage is not set up yet. Run supabase/setup-profile-photos-storage.sql in the Supabase SQL Editor.",
      );
    }
    throw error;
  }

  const { data } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
