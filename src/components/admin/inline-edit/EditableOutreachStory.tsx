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
import type { OutreachStoryRow } from "@/lib/site-settings";

export function EditableOutreachStory({
  story,
  reverse,
  imageUrl,
  imageAlt,
}: {
  story: OutreachStoryRow;
  reverse: boolean;
  imageUrl: string;
  imageAlt: string;
}) {
  const { canInlineEdit } = useAdminEdit();
  const { outreachStories, patchOutreachStory, saveOutreachStoriesNow, saving } = useSiteContent();
  const live = outreachStories.find((row) => row.id === story.id) ?? story;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(live.title);
  const [description, setDescription] = useState(live.description);

  async function handleSave() {
    patchOutreachStory(story.id, { title, description });
    await saveOutreachStoriesNow();
    setOpen(false);
  }

  return (
    <article className="relative grid items-center gap-8 md:grid-cols-2 md:gap-12">
      {canInlineEdit && (
        <button
          type="button"
          aria-label={`Edit ${live.title}`}
          onClick={() => {
            setTitle(live.title);
            setDescription(live.description);
            setOpen(true);
          }}
          className="absolute -right-1 -top-1 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-forest/30 bg-white text-forest shadow-md transition hover:bg-forest hover:text-cream"
        >
          <Pencil size={14} />
        </button>
      )}
      <div className={`overflow-hidden rounded-[1.5rem] ${reverse ? "md:order-2" : ""}`}>
        <img src={imageUrl} alt={imageAlt} className="aspect-[16/10] w-full object-cover md:aspect-[4/3]" loading="lazy" />
      </div>
      <div className={reverse ? "md:order-1" : ""}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest">Outreach</p>
        <h2 className="mt-2 font-display text-3xl leading-tight text-foreground md:text-4xl">{live.title}</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{live.description}</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit outreach story</DialogTitle>
            <DialogDescription>Changes appear on this page after you save.</DialogDescription>
          </DialogHeader>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-input px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Description</span>
            <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-lg border border-input px-3 py-2" />
          </label>
          <DialogFooter>
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
