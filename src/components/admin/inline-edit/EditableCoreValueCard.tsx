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
import type { CoreValueContent } from "@/lib/site-settings";

export function EditableCoreValueCard({
  value,
  displayHowWeLiveIt,
}: {
  value: CoreValueContent;
  displayHowWeLiveIt: string;
}) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const live = settings.coreValues.find((row) => row.id === value.id) ?? value;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(live.name);
  const [definition, setDefinition] = useState(live.definition);
  const [howWeLiveIt, setHowWeLiveIt] = useState(live.howWeLiveIt);

  async function handleSave() {
    patchSettings({
      coreValues: settings.coreValues.map((row) =>
        row.id === value.id ? { ...row, name, definition, howWeLiveIt } : row,
      ),
    });
    await saveSettings();
    setOpen(false);
  }

  return (
    <>
      <article className="relative rounded-2xl border border-border bg-card p-6 md:p-8">
        {canInlineEdit && (
          <button
            type="button"
            aria-label={`Edit ${live.name}`}
            onClick={() => {
              setName(live.name);
              setDefinition(live.definition);
              setHowWeLiveIt(live.howWeLiveIt);
              setOpen(true);
            }}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-forest/30 bg-white text-forest shadow-md transition hover:bg-forest hover:text-cream"
          >
            <Pencil size={14} />
          </button>
        )}
        <h2 className="font-display text-2xl text-foreground md:text-3xl">{live.name}</h2>
        <p className="mt-2 text-sm font-medium text-forest">{live.definition}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{displayHowWeLiveIt}</p>
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {live.name}</DialogTitle>
            <DialogDescription>Changes appear on this page after you save.</DialogDescription>
          </DialogHeader>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-input px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Definition</span>
            <input value={definition} onChange={(e) => setDefinition(e.target.value)} className="rounded-lg border border-input px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">How we live it</span>
            <textarea rows={5} value={howWeLiveIt} onChange={(e) => setHowWeLiveIt(e.target.value)} className="rounded-lg border border-input px-3 py-2" />
          </label>
          <DialogFooter>
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
