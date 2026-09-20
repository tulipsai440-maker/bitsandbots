import { useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminEdit } from "./AdminEditProvider";
import { useSiteContent } from "@/lib/site-settings-context";
import type { SiteSettings } from "@/lib/site-settings";
import { propagateTeamNameChange, propagateTeamNameInOutreach } from "@/lib/site-settings";
import { DEFAULT_HERO_TEXT_COLOR, normalizeHeroTextColor } from "@/lib/brand-colors";

type StringSettingKey = {
  [K in keyof SiteSettings]: SiteSettings[K] extends string ? K : never;
}[keyof SiteSettings];

type EditableTextProps = {
  settingKey: StringSettingKey;
  label: string;
  multiline?: boolean;
  className?: string;
  children?: ReactNode;
  /** Show hero text color picker (homepage hero overlay). */
  heroText?: boolean;
};

function HeroTextColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const color = normalizeHeroTextColor(value);
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">Hero text color</span>
      <p className="text-xs text-muted-foreground">
        Pick a color that stays readable on your hero photo (try white on dark photos, navy on light sky).
      </p>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-1"
          aria-label="Pick hero text color"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={DEFAULT_HERO_TEXT_COLOR}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
          spellCheck={false}
        />
      </div>
    </label>
  );
}

export function EditableText({ settingKey, label, multiline, className, children, heroText }: EditableTextProps) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, outreachStories, patchSettings, saveSettings, saveSettingsData, saving } =
    useSiteContent();
  const value = settings[settingKey] as string;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [draftHeroColor, setDraftHeroColor] = useState(settings.heroTextColor);

  if (!canInlineEdit) {
    return <span className={className}>{children ?? value}</span>;
  }

  async function handleSave() {
    const trimmed = draft.trim();
    const heroColor = normalizeHeroTextColor(draftHeroColor);
    if (settingKey === "siteName" && trimmed !== value.trim()) {
      const nextSettings = propagateTeamNameChange(settings, value.trim(), trimmed);
      const nextOutreach = propagateTeamNameInOutreach(outreachStories, value.trim(), trimmed);
      if (heroText) nextSettings.heroTextColor = heroColor;
      patchSettings(nextSettings);
      await saveSettingsData(nextSettings, nextOutreach);
    } else {
      const patch: Partial<SiteSettings> = { [settingKey]: draft };
      if (heroText) patch.heroTextColor = heroColor;
      patchSettings(patch);
      await saveSettings();
    }
    setOpen(false);
  }

  return (
    <>
      <span className={`group/edit relative inline ${className ?? ""}`}>
        <span>{children ?? value}</span>
        <button
          type="button"
          aria-label={`Edit ${label}`}
          onClick={() => {
            setDraft(value);
            setDraftHeroColor(settings.heroTextColor);
            setOpen(true);
          }}
          className="ml-1.5 inline-flex h-6 w-6 translate-y-0.5 items-center justify-center rounded-full border border-forest/30 bg-white/90 text-forest opacity-90 shadow-sm transition hover:bg-forest hover:text-cream"
        >
          <Pencil size={12} />
        </button>
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {label}</DialogTitle>
            <DialogDescription>Changes appear on the live site after you save.</DialogDescription>
          </DialogHeader>
          {multiline ? (
            <textarea
              rows={5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          ) : (
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          )}
          {heroText ? (
            <HeroTextColorField value={draftHeroColor} onChange={setDraftHeroColor} />
          ) : null}
          <DialogFooter>
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Block wrapper with floating pencil for longer content regions. */
export function EditableBlock({
  settingKey,
  label,
  multiline = true,
  className,
  children,
  heroText,
}: EditableTextProps & { children: ReactNode }) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const value = settings[settingKey] as string;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [draftHeroColor, setDraftHeroColor] = useState(settings.heroTextColor);

  if (!canInlineEdit) {
    return <div className={className}>{children}</div>;
  }

  async function handleSave() {
    const patch: Partial<SiteSettings> = { [settingKey]: draft };
    if (heroText) patch.heroTextColor = normalizeHeroTextColor(draftHeroColor);
    patchSettings(patch);
    await saveSettings();
    setOpen(false);
  }

  return (
    <div className={`group/edit relative ${className ?? ""}`}>
      {children}
      <button
        type="button"
        aria-label={`Edit ${label}`}
        onClick={() => {
          setDraft(value);
          setDraftHeroColor(settings.heroTextColor);
          setOpen(true);
        }}
        className="absolute -right-1 -top-1 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-forest/30 bg-white text-forest shadow-md transition hover:bg-forest hover:text-cream"
      >
        <Pencil size={14} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {label}</DialogTitle>
            <DialogDescription>Changes appear on the live site after you save.</DialogDescription>
          </DialogHeader>
          <textarea
            rows={multiline ? 6 : 3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          {heroText ? (
            <HeroTextColorField value={draftHeroColor} onChange={setDraftHeroColor} />
          ) : null}
          <DialogFooter>
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
