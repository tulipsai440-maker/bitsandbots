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

type StringSettingKey = {
  [K in keyof SiteSettings]: SiteSettings[K] extends string ? K : never;
}[keyof SiteSettings];

type EditableTextProps = {
  settingKey: StringSettingKey;
  label: string;
  multiline?: boolean;
  className?: string;
  children?: ReactNode;
};

export function EditableText({ settingKey, label, multiline, className, children }: EditableTextProps) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, outreachStories, patchSettings, saveSettings, saveSettingsData, saving } =
    useSiteContent();
  const value = settings[settingKey] as string;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!canInlineEdit) {
    return <span className={className}>{children ?? value}</span>;
  }

  async function handleSave() {
    const trimmed = draft.trim();
    if (settingKey === "siteName" && trimmed !== value.trim()) {
      const nextSettings = propagateTeamNameChange(settings, value.trim(), trimmed);
      const nextOutreach = propagateTeamNameInOutreach(outreachStories, value.trim(), trimmed);
      patchSettings(nextSettings);
      await saveSettingsData(nextSettings, nextOutreach);
    } else {
      patchSettings({ [settingKey]: draft } as Partial<SiteSettings>);
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
}: EditableTextProps & { children: ReactNode }) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const value = settings[settingKey] as string;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!canInlineEdit) {
    return <div className={className}>{children}</div>;
  }

  async function handleSave() {
    patchSettings({ [settingKey]: draft } as Partial<SiteSettings>);
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
