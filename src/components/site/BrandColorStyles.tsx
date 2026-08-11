import { useEffect } from "react";
import { applyBrandThemeToDocument } from "@/lib/brand-colors";
import { useSiteSettings } from "@/lib/site-settings-context";

/** Injects team brand + accent colors into CSS variables for the whole site. */
export function BrandColorStyles() {
  const { brandColor, accentColor } = useSiteSettings();

  useEffect(() => {
    applyBrandThemeToDocument(brandColor, accentColor);
  }, [brandColor, accentColor]);

  return null;
}
