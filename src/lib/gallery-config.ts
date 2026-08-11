import { usesDemoPlaceholders } from "@/lib/demo/app-mode";
import { isDemoTenant } from "@/lib/tenant/context";

/** Bundled photos from public/photos/gallery/ — off while the collection is refreshed. */
export const GALLERY_STATIC_PHOTOS_PUBLIC = false;

/** Demo tenants use bundled sample gallery photos under public/photos/demo/. */
export function galleryStaticPhotosEnabled(isDemo?: boolean): boolean {
  const demo = isDemo ?? (usesDemoPlaceholders() || isDemoTenant());
  return demo || GALLERY_STATIC_PHOTOS_PUBLIC;
}

/** Admin-approved parent uploads from Supabase — show on /gallery (not on demo tenants). */
export function galleryUploadsEnabled(isDemo?: boolean): boolean {
  const demo = isDemo ?? (usesDemoPlaceholders() || isDemoTenant());
  return !demo;
}

/** @deprecated Use galleryUploadsEnabled(). */
export const GALLERY_UPLOADS_PUBLIC = true;
/** @deprecated Use galleryStaticPhotosEnabled() and GALLERY_UPLOADS_PUBLIC instead. */
export const GALLERY_PHOTOS_PUBLIC =
  galleryStaticPhotosEnabled() || GALLERY_UPLOADS_PUBLIC;
