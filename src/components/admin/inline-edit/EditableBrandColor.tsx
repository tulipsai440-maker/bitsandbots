import { useState } from "react";
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
import { DEFAULT_BRAND_COLOR, normalizeBrandColor } from "@/lib/brand-colors";

export function EditableBrandColor() {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const color = normalizeBrandColor(settings.brandColor);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(color);

  if (!canInlineEdit) {
    return (
      <span
        className="inline-block h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
        style={{ backgroundColor: color }}
        aria-hidden
      />
    );
  }

  async function handleSave() {
    const next = normalizeBrandColor(draft);
    patchSettings({ brandColor: next });
    await saveSettings();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Edit brand color"
        title={`Brand color ${color}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDraft(color);
          setOpen(true);
        }}
        className="group/color relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-black/10 transition hover:ring-forest/40"
        style={{ backgroundColor: color }}
      >
        <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full border border-forest/30 bg-white text-forest opacity-0 shadow-sm transition group-hover/color:opacity-100">
          <Pencil size={9} />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Brand color</DialogTitle>
            <DialogDescription>
              Used for buttons, links, headers, and accents across the site.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={normalizeBrandColor(draft)}
              onChange={(e) => setDraft(e.target.value)}
              className="h-12 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-1"
              aria-label="Pick brand color"
            />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={DEFAULT_BRAND_COLOR}
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
