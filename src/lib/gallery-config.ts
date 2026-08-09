/** Bundled photos from public/photos/gallery/ — off while the collection is refreshed. */
export const GALLERY_STATIC_PHOTOS_PUBLIC = false;

/** Admin-approved parent uploads from Supabase — show on /gallery. */
export const GALLERY_UPLOADS_PUBLIC = true;

/** @deprecated Use GALLERY_STATIC_PHOTOS_PUBLIC and GALLERY_UPLOADS_PUBLIC instead. */
export const GALLERY_PHOTOS_PUBLIC =
  GALLERY_STATIC_PHOTOS_PUBLIC || GALLERY_UPLOADS_PUBLIC;
