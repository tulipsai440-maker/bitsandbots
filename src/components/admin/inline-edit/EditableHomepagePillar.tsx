import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import type { HomepagePillar } from "@/lib/site-settings";

export function EditableHomepagePillar({
  pillar,
  index,
}: {
  pillar: HomepagePillar;
  index: number;
}) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const live = settings.homepagePillars[index] ?? pillar;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(live.title);
  const [copy, setCopy] = useState(live.copy);
  const [href, setHref] = useState(live.href ?? "");
  const [linkLabel, setLinkLabel] = useState(live.linkLabel ?? "");

  async function handleSave() {
    const nextPillars = [...settings.homepagePillars];
    nextPillars[index] = {
      title: title.trim(),
      copy: copy.trim(),
      href: href.trim() || undefined,
      linkLabel: linkLabel.trim() || undefined,
    };
    patchSettings({ homepagePillars: nextPillars });
    await saveSettings();
    setOpen(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove "${live.title}" from the homepage?`)) return;
    const nextPillars = settings.homepagePillars.filter((_, i) => i !== index);
    patchSettings({ homepagePillars: nextPillars });
    await saveSettings();
    setOpen(false);
  }

  return (
    <>
      <article
        className="animate-rise relative border-t border-forest/25 pt-6"
        style={{ animationDelay: `${120 + index * 90}ms` }}
      >
        {canInlineEdit && (
          <button
            type="button"
            aria-label={`Edit ${live.title}`}
            onClick={() => {
              setTitle(live.title);
              setCopy(live.copy);
              setHref(live.href ?? "");
              setLinkLabel(live.linkLabel ?? "");
              setOpen(true);
            }}
            className="absolute right-0 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-forest/30 bg-white text-forest shadow-md transition hover:bg-forest hover:text-cream"
          >
            <Pencil size={14} />
          </button>
        )}
        <p className="font-display text-sm text-forest">0{index + 1}</p>
        <h3 className="mt-2 font-display text-2xl md:text-3xl">{live.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{live.copy}</p>
        {live.href ? (
          <Link
            to={live.href as "/"}
            className="mt-4 inline-block text-sm font-medium text-forest hover:underline"
          >
            {live.linkLabel ?? "Learn more →"}
          </Link>
        ) : null}
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit pillar {index + 1}</DialogTitle>
            <DialogDescription>
              One of the three “how we work” cards on the homepage.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Description</span>
            <textarea
              rows={4}
              value={copy}
              onChange={(e) => setCopy(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Optional link path</span>
            <input
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="/core-values"
              className="rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Optional link label</span>
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Read our Core Values →"
              className="rounded-lg border border-input bg-background px-3 py-2"
            />
          </label>
          <DialogFooter className="gap-2 sm:justify-between">
            <button
              type="button"
              className="btn-outline text-destructive hover:bg-destructive/10"
              disabled={saving}
              onClick={handleDelete}
            >
              <Trash2 size={14} className="mr-1 inline" /> Remove pillar
            </button>
            <div className="flex gap-2">
              <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
