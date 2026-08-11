import { DEFAULT_ACCENT_COLOR } from "@/lib/site-content-defaults";

/** Default Bits & Bots forest green — matches src/styles.css */
export const DEFAULT_BRAND_COLOR = "#1f3d1f";

function normalizeHexColor(input: string | null | undefined, fallback: string): string {
  if (!input?.trim()) return fallback;
  let hex = input.trim();
  if (!hex.startsWith("#")) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  return fallback;
}

export function normalizeBrandColor(input: string | null | undefined): string {
  return normalizeHexColor(input, DEFAULT_BRAND_COLOR);
}

export function normalizeAccentColor(input: string | null | undefined): string {
  return normalizeHexColor(input, DEFAULT_ACCENT_COLOR);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeBrandColor(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Darker shade for hovers, hero backgrounds, etc. */
export function darkenBrandColor(hex: string, factor = 0.22): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - factor), g * (1 - factor), b * (1 - factor));
}

/** CSS custom properties applied to :root — drives text-forest, btn-primary, gold accents, etc. */
export function brandThemeCssVariables(brandColor: string, accentColor?: string): Record<string, string> {
  const main = normalizeBrandColor(brandColor);
  const deep = darkenBrandColor(main);
  const accent = normalizeAccentColor(accentColor);
  return {
    "--forest": main,
    "--forest-deep": deep,
    "--primary": main,
    "--ring": main,
    "--gold": accent,
    "--accent": accent,
  };
}

/** @deprecated Use brandThemeCssVariables */
export function brandColorCssVariables(brandColor: string): Record<string, string> {
  return brandThemeCssVariables(brandColor);
}

export function applyBrandThemeToDocument(brandColor: string, accentColor?: string): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(brandThemeCssVariables(brandColor, accentColor))) {
    root.style.setProperty(key, value);
  }
  const theme = normalizeBrandColor(brandColor);
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", theme);
}

/** @deprecated Use applyBrandThemeToDocument */
export function applyBrandColorToDocument(brandColor: string): void {
  applyBrandThemeToDocument(brandColor);
}
