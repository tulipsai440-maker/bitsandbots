import { useState } from "react";
import { Palette } from "lucide-react";
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
import { DEFAULT_HERO_TEXT_COLOR, normalizeHeroTextColor } from "@/lib/brand-colors";

/** Floating control on the homepage hero — adjusts overlay text color for all hero copy. */
export function EditableHeroTextColor() {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const color = normalizeHeroTextColor(settings.heroTextColor);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(color);

  if (!canInlineEdit) return null;

  async function handleSave() {
    patchSettings({ heroTextColor: normalizeHeroTextColor(draft) });
    await saveSettings();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Edit hero text color"
        title={`Hero text color ${color}`}
        onClick={() => {
          setDraft(color);
          setOpen(true);
        }}
        className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-cream/40 bg-black/35 px-3 py-1.5 text-xs font-medium text-cream shadow-md backdrop-blur-sm transition hover:bg-black/50"
      >
        <Palette size={14} />
        Text color
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hero text color</DialogTitle>
            <DialogDescription>
              Title, tagline, and subtext on the homepage hero. Use a color that contrasts with your
              photo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={normalizeHeroTextColor(draft)}
              onChange={(e) => setDraft(e.target.value)}
              className="h-12 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-1"
              aria-label="Pick hero text color"
            />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={DEFAULT_HERO_TEXT_COLOR}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
              spellCheck={false}
            />
          </div>
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
