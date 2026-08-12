import { useState, type ReactNode } from "react";
import { FileText, Pencil, Play, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminEdit } from "@/components/admin/inline-edit/AdminEditProvider";
import { useSiteContent } from "@/lib/site-settings-context";
import type { QuickLinkCard, SiteSettings } from "@/lib/site-settings";
import type { ResourcesPageSections } from "@/lib/resources-page-sections";
import type { SeasonDocument, SeasonVideo } from "@/lib/season-videos";
import type { SeasonVideoGroup } from "@/lib/site-content-defaults";
import { youtubeThumbnailUrl } from "@/lib/season-from-settings";

function EditPencil({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={
        className ??
        "absolute -right-1 -top-1 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-forest/30 bg-white text-forest shadow-md transition hover:bg-forest hover:text-cream"
      }
    >
      <Pencil size={14} />
    </button>
  );
}

export function EditableResourcesSectionHeading({
  title,
  description,
  titleField,
  descriptionField,
  sectionLabel,
}: {
  title: string;
  description: string;
  titleField: keyof ResourcesPageSections;
  descriptionField: keyof ResourcesPageSections;
  sectionLabel: string;
}) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description);

  if (!canInlineEdit) {
    return (
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl text-foreground md:text-4xl">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
    );
  }

  async function handleSave() {
    patchSettings({
      resourcesPageSections: {
        ...settings.resourcesPageSections,
        [titleField]: draftTitle.trim(),
        [descriptionField]: draftDescription.trim(),
      },
    });
    await saveSettings();
    setOpen(false);
  }

  return (
    <>
      <div className="group/edit relative max-w-2xl">
        <h2 className="font-display text-3xl text-foreground md:text-4xl">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <EditPencil
          label={`Edit ${sectionLabel}`}
          onClick={() => {
            setDraftTitle(title);
            setDraftDescription(description);
            setOpen(true);
          }}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {sectionLabel}</DialogTitle>
            <DialogDescription>Section heading on the Resources page.</DialogDescription>
          </DialogHeader>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Title</span>
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Description</span>
            <textarea
              rows={3}
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
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

export function EditableSeasonVideoGroupHeading({ group }: { group: SeasonVideoGroup }) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(group.title);
  const [draftCopy, setDraftCopy] = useState(group.copy);

  if (!canInlineEdit) {
    return (
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl text-foreground md:text-4xl">{group.title}</h2>
        <p className="mt-2 text-muted-foreground">{group.copy}</p>
      </div>
    );
  }

  async function handleSave() {
    const seasonVideoGroups = settings.seasonVideoGroups.map((entry) =>
      entry.key === group.key ? { ...entry, title: draftTitle.trim(), copy: draftCopy.trim() } : entry,
    );
    patchSettings({ seasonVideoGroups });
    await saveSettings();
    setOpen(false);
  }

  return (
    <>
      <div className="group/edit relative max-w-2xl">
        <h2 className="font-display text-3xl text-foreground md:text-4xl">{group.title}</h2>
        <p className="mt-2 text-muted-foreground">{group.copy}</p>
        <EditPencil
          label={`Edit ${group.title} section`}
          onClick={() => {
            setDraftTitle(group.title);
            setDraftCopy(group.copy);
            setOpen(true);
          }}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit video section</DialogTitle>
            <DialogDescription>Heading above a group of season videos.</DialogDescription>
          </DialogHeader>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Title</span>
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Description</span>
            <textarea
              rows={3}
              value={draftCopy}
              onChange={(e) => setDraftCopy(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
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

function EditableCardShell({ label, onEdit, children }: { label: string; onEdit: () => void; children: ReactNode }) {
  const { canInlineEdit } = useAdminEdit();
  if (!canInlineEdit) return <>{children}</>;
  return (
    <div className="group/edit relative">
      {children}
      <EditPencil
        label={label}
        onClick={onEdit}
        className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-forest/30 bg-white text-forest shadow-md transition hover:bg-forest hover:text-cream"
      />
    </div>
  );
}

export function EditableDocumentTile({ doc }: { doc: SeasonDocument }) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(doc);

  const tile = (
    <a
      href={doc.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 rounded-[1.25rem] border border-border bg-background p-5 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest/10 text-forest">
        <FileText size={22} />
      </div>
      <div className="min-w-0">
        <h3 className="font-display text-xl leading-tight text-foreground">{doc.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{doc.blurb}</p>
      </div>
    </a>
  );

  if (!canInlineEdit) return tile;

  async function handleSave() {
    const seasonDocuments = settings.seasonDocuments.map((entry) =>
      entry.id === doc.id
        ? { ...draft, title: draft.title.trim(), blurb: draft.blurb.trim(), href: draft.href.trim() }
        : entry,
    );
    patchSettings({ seasonDocuments });
    await saveSettings();
    setOpen(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove "${doc.title}" from Season documents?`)) return;
    const seasonDocuments = settings.seasonDocuments.filter((entry) => entry.id !== doc.id);
    patchSettings({ seasonDocuments });
    await saveSettings();
    setOpen(false);
  }

  return (
    <>
      <EditableCardShell
        label={`Edit ${doc.title}`}
        onEdit={() => {
          setDraft(doc);
          setOpen(true);
        }}
      >
        <div className="relative">
          {tile}
          <button
            type="button"
            aria-label={`Delete ${doc.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleDelete();
            }}
            className="absolute right-2 bottom-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-destructive/30 bg-white text-destructive shadow-md transition hover:bg-destructive hover:text-cream"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </EditableCardShell>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit document</DialogTitle>
          </DialogHeader>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Title</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">URL</span>
            <input
              value={draft.href}
              onChange={(e) => setDraft({ ...draft, href: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Description</span>
            <textarea
              rows={3}
              value={draft.blurb}
              onChange={(e) => setDraft({ ...draft, blurb: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <DialogFooter className="gap-2 sm:justify-between">
            <button
              type="button"
              className="btn-outline text-destructive hover:bg-destructive/10"
              disabled={saving}
              onClick={handleDelete}
            >
              Delete document
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

export function EditableVideoTile({ video, watchUrl }: { video: SeasonVideo; watchUrl: string }) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(video);

  const tile = (
    <a
      href={watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-[1.25rem] border border-border/80 bg-background transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-video overflow-hidden bg-forest-deep">
        <img
          src={youtubeThumbnailUrl(video.id)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-cream/95 text-forest shadow-lg">
            <Play size={22} className="ml-0.5" fill="currentColor" />
          </span>
        </div>
      </div>
      <div className="px-4 py-4">
        <h3 className="font-display text-xl leading-tight text-foreground">{video.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{video.blurb}</p>
      </div>
    </a>
  );

  if (!canInlineEdit) return tile;

  async function handleSave() {
    const seasonVideos = settings.seasonVideos.map((entry) =>
      entry.id === video.id
        ? { ...draft, title: draft.title.trim(), blurb: draft.blurb.trim(), id: draft.id.trim() }
        : entry,
    );
    patchSettings({ seasonVideos });
    await saveSettings();
    setOpen(false);
  }

  return (
    <>
      <EditableCardShell
        label={`Edit ${video.title}`}
        onEdit={() => {
          setDraft(video);
          setOpen(true);
        }}
      >
        {tile}
      </EditableCardShell>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit video</DialogTitle>
          </DialogHeader>
          <label className="grid gap-2">
            <span className="text-sm font-medium">YouTube video ID</span>
            <input
              value={draft.id}
              onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Title</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Description</span>
            <textarea
              rows={3}
              value={draft.blurb}
              onChange={(e) => setDraft({ ...draft, blurb: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
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

export function EditableQuickLinkCard({ link, icon }: { link: QuickLinkCard; icon: ReactNode }) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(link);

  const external = link.href.startsWith("http");
  const inner = (
    <>
      {icon}
      <div className="flex-1">
        <div className="font-display text-lg">{link.label}</div>
        <p className="mt-1 text-sm text-muted-foreground">{link.desc}</p>
      </div>
    </>
  );
  const className =
    "group flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest";

  const card = external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <a href={link.href} className={className}>
      {inner}
    </a>
  );

  if (!canInlineEdit) return card;

  async function handleSave() {
    const quickLinks = settings.quickLinks.map((entry) =>
      entry.id === link.id
        ? { ...draft, label: draft.label.trim(), desc: draft.desc.trim(), href: draft.href.trim() }
        : entry,
    );
    patchSettings({ quickLinks });
    await saveSettings();
    setOpen(false);
  }

  return (
    <>
      <EditableCardShell
        label={`Edit ${link.label}`}
        onEdit={() => {
          setDraft(link);
          setOpen(true);
        }}
      >
        {card}
      </EditableCardShell>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit link</DialogTitle>
          </DialogHeader>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Label</span>
            <input
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">URL or path</span>
            <input
              value={draft.href}
              onChange={(e) => setDraft({ ...draft, href: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Description</span>
            <textarea
              rows={3}
              value={draft.desc}
              onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
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

export function EditableResourcesButton({
  label,
  field,
  href,
  className,
}: {
  label: string;
  field: keyof ResourcesPageSections;
  href: string;
  className?: string;
}) {
  const { canInlineEdit } = useAdminEdit();
  const { settings, patchSettings, saveSettings, saving } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(label);

  const button = (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className ?? "btn-primary gap-2"}>
      {label}
    </a>
  );

  if (!canInlineEdit) return button;

  async function handleSave() {
    patchSettings({
      resourcesPageSections: {
        ...settings.resourcesPageSections,
        [field]: draft.trim(),
      },
    });
    await saveSettings();
    setOpen(false);
  }

  return (
    <>
      <span className="group/edit relative inline-flex">
        {button}
        <EditPencil
          label="Edit button label"
          onClick={() => {
            setDraft(label);
            setOpen(true);
          }}
          className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-forest/30 bg-white text-forest shadow-md"
        />
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit button label</DialogTitle>
          </DialogHeader>
          <input
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
    </>
  );
}

export function EditableSeasonName({ seasonName }: { seasonName: string }) {
  const { canInlineEdit } = useAdminEdit();
  const { patchSettings, saveSettings, saving } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(seasonName);

  if (!canInlineEdit) {
    return <span className="font-medium text-foreground">{seasonName}</span>;
  }

  async function handleSave() {
    patchSettings({ seasonName: draft.trim() } as Partial<SiteSettings>);
    await saveSettings();
    setOpen(false);
  }

  return (
    <>
      <span className="group/edit relative inline">
        <span className="font-medium text-foreground">{seasonName}</span>
        <button
          type="button"
          aria-label="Edit season name"
          onClick={() => {
            setDraft(seasonName);
            setOpen(true);
          }}
          className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-forest/30 bg-white text-forest shadow-sm"
        >
          <Pencil size={12} />
        </button>
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit current season name</DialogTitle>
          </DialogHeader>
          <input
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
    </>
  );
}
