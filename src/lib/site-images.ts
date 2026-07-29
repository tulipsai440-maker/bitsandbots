import { supabase } from "@/integrations/supabase/client";
import { photos } from "@/lib/photos";

export const SITE_IMAGES_BUCKET = "site-images";

export type SiteImageKey =
  | "hero"
  | "camping"
  | "hiking"
  | "aquatics"
  | "trailToEagle";

export type SiteImageSlot = {
  key: SiteImageKey;
  label: string;
  description: string;
  defaultUrl: string;
  defaultAlt: string;
  aspect: "16/9" | "4/3";
};

export const SITE_IMAGE_SLOTS: SiteImageSlot[] = [
  {
    key: "hero",
    label: "Homepage hero",
    description: "Background for the landing page hero. Naples / Gulf Coast theme works well.",
    defaultUrl: "/photos/site/hero-naples.png",
    defaultAlt: "Naples Florida Gulf Coast beach at sunset",
    aspect: "16/9",
  },
  {
    key: "camping",
    label: "Camping card",
    description: "Campouts and activities section — camping tile on the homepage.",
    defaultUrl: "/photos/site/camping-tents.png",
    defaultAlt: "Scout camp tents in a wooded clearing",
    aspect: "4/3",
  },
  {
    key: "hiking",
    label: "Hiking card",
    description: "Campouts and activities section — hiking tile on the homepage.",
    defaultUrl: photos.outdoorAdventure.hiking,
    defaultAlt: "Scouts hiking on a trail",
    aspect: "4/3",
  },
  {
    key: "aquatics",
    label: "Aquatics card",
    description: "Campouts and activities section — aquatics tile on the homepage.",
    defaultUrl: photos.outdoorAdventure.waterSports,
    defaultAlt: "Scouts canoeing on the water",
    aspect: "4/3",
  },
  {
    key: "trailToEagle",
    label: "Trail to Eagle",
    description: "Eagle Scouts preview section when the roll is empty.",
    defaultUrl: photos.trailToEagle,
    defaultAlt: "Eagle Scout medal on uniform",
    aspect: "4/3",
  },
];

export type SiteImageOverride = {
  url: string;
  alt: string;
  updatedAt: string | null;
  isOverride: boolean;
};

export type SiteImageOverrides = Record<SiteImageKey, SiteImageOverride>;

const SLOT_BY_KEY = Object.fromEntries(SITE_IMAGE_SLOTS.map((slot) => [slot.key, slot])) as Record<
  SiteImageKey,
  SiteImageSlot
>;

function defaultOverride(key: SiteImageKey): SiteImageOverride {
  const slot = SLOT_BY_KEY[key];
  return {
    url: slot.defaultUrl,
    alt: slot.defaultAlt,
    updatedAt: null,
    isOverride: false,
  };
}

export function buildDefaultSiteImageOverrides(): SiteImageOverrides {
  return SITE_IMAGE_SLOTS.reduce((acc, slot) => {
    acc[slot.key] = defaultOverride(slot.key);
    return acc;
  }, {} as SiteImageOverrides);
}

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

export function siteImagesErrorMessage(error: unknown): string {
  return toError(error).message;
}

export function isSiteImagesSetupMissing(error: unknown): boolean {
  const wrapped = toError(error);
  if (wrapped.code === "PGRST202" || wrapped.code === "PGRST205" || wrapped.code === "42883") {
    return true;
  }
  const message = wrapped.message.toLowerCase();
  return (
    message.includes("site_images") ||
    message.includes("list_site_images") ||
    message.includes("site-images") ||
    message.includes("bucket not found") ||
    message.includes("schema cache") ||
    (message.includes("function") && message.includes("does not exist"))
  );
}

export const SITE_IMAGES_SETUP_SQL = `-- Site image overrides (run once in Supabase SQL Editor)
-- File: supabase/setup-site-images.sql

CREATE TABLE IF NOT EXISTS public.site_images (
  key text PRIMARY KEY,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT ALL ON public.site_images TO service_role;
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site images are publicly readable" ON public.site_images;
CREATE POLICY "Site images are publicly readable"
ON public.site_images FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage site images" ON public.site_images;
CREATE POLICY "Admins manage site images"
ON public.site_images FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_images TO authenticated;

DROP TRIGGER IF EXISTS site_images_set_updated_at ON public.site_images;
CREATE TRIGGER site_images_set_updated_at
BEFORE UPDATE ON public.site_images
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.list_site_images()
RETURNS TABLE (
  key text,
  public_url text,
  alt text,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.key, s.public_url, s.alt, s.updated_at
  FROM public.site_images s
  ORDER BY s.key;
$$;

REVOKE EXECUTE ON FUNCTION public.list_site_images() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_site_images() TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('site-images', 'site-images', true, 8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read site images" ON storage.objects;
CREATE POLICY "Public read site images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'site-images');

DROP POLICY IF EXISTS "Admins upload site images" ON storage.objects;
CREATE POLICY "Admins upload site images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-images'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins update site images" ON storage.objects;
CREATE POLICY "Admins update site images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-images'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins delete site images" ON storage.objects;
CREATE POLICY "Admins delete site images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-images'
  AND public.has_role(auth.uid(), 'admin')
);`;

export async function fetchSiteImageOverrides(): Promise<SiteImageOverrides> {
  const defaults = buildDefaultSiteImageOverrides();

  const { data, error } = await supabase.rpc("list_site_images");
  if (error) throw error;

  for (const row of data ?? []) {
    const key = row.key as SiteImageKey;
    if (!SLOT_BY_KEY[key]) continue;
    defaults[key] = {
      url: row.public_url,
      alt: row.alt || SLOT_BY_KEY[key].defaultAlt,
      updatedAt: row.updated_at ?? null,
      isOverride: true,
    };
  }

  return defaults;
}

export function resolveSiteImage(
  key: SiteImageKey,
  overrides: SiteImageOverrides,
): SiteImageOverride {
  return overrides[key] ?? defaultOverride(key);
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not read that image file."));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressSiteImage(file: File, maxDimension = 2000): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a JPEG, PNG, or WebP image.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Image must be 12 MB or smaller.");
  }

  const img = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image for upload.");
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not compress the image."))),
      "image/webp",
      0.86,
    );
  });

  return blob;
}

export async function uploadSiteImageOverride(
  key: SiteImageKey,
  file: File,
  alt?: string,
): Promise<void> {
  const slot = SLOT_BY_KEY[key];
  const blob = await compressSiteImage(file);
  const storagePath = `${key}/${Date.now()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(SITE_IMAGES_BUCKET)
    .upload(storagePath, blob, {
      contentType: "image/webp",
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage.from(SITE_IMAGES_BUCKET).getPublicUrl(storagePath);
  const publicUrl = publicData.publicUrl;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const { error: upsertError } = await supabase.from("site_images").upsert(
    {
      key,
      storage_path: storagePath,
      public_url: publicUrl,
      alt: alt?.trim() || slot.defaultAlt,
      updated_by: userId,
    },
    { onConflict: "key" },
  );
  if (upsertError) throw upsertError;
}

export async function resetSiteImageOverride(key: SiteImageKey): Promise<void> {
  const { data, error: selectError } = await supabase
    .from("site_images")
    .select("storage_path")
    .eq("key", key)
    .maybeSingle();
  if (selectError) throw selectError;

  if (data?.storage_path) {
    const { error: removeError } = await supabase.storage
      .from(SITE_IMAGES_BUCKET)
      .remove([data.storage_path]);
    if (removeError) throw removeError;
  }

  const { error: deleteError } = await supabase.from("site_images").delete().eq("key", key);
  if (deleteError) throw deleteError;
}

export async function fetchSiteImageRowsForAdmin(): Promise<
  Array<SiteImageSlot & SiteImageOverride>
> {
  const overrides = await fetchSiteImageOverrides();
  return SITE_IMAGE_SLOTS.map((slot) => ({
    ...slot,
    ...overrides[slot.key],
  }));
}
