import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, FileText, Pencil, Play, Plus, Trash2 } from "lucide-react";
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

/** The editable copy fields of a section heading — excludes the bookkeeping booleans. */
type ResourcesTextField = {
  [K in keyof ResourcesPageSections]: ResourcesPageSections[K] extends string ? K : never;
}[keyof ResourcesPageSections];

const VIDEO_GROUP_KEYS: SeasonVideo["group"][] = ["season", "game", "roles"];

const VIDEO_GROUP_LABELS: Record<SeasonVideo["group"], string> = {
  season: "Season intro",
  game: "Robot game",
  roles: "Roles",
};

/**
 * Saves an explicit next value. `patchSettings` only updates local state, so a save fired in the
 * same handler would still send the pre-edit settings to Supabase.
 */
function useResourcesEditor() {
  const { canInlineEdit } = useAdminEdit();
  const { settings, saveSettingsData, saving } = useSiteContent();

  async function commit(patch: Partial<SiteSettings>) {
    await saveSettingsData({ ...settings, ...patch });
  }

  /** Computed keys widen to a string index signature, so narrow it back once here. */
  function sectionsWith(fields: Record<string, string>): Partial<SiteSettings> {
    return {
      resourcesPageSections: {
        ...settings.resourcesPageSections,
        ...fields,
      } as ResourcesPageSections,
    };
  }

  return { canInlineEdit, settings, saving, commit, sectionsWith };
}

function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

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

function TextField({
  label,
  value,
  onChange,
  mono,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border border-input bg-background px-3 py-2 text-sm ${mono ? "font-mono" : ""}`}
      />
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function ItemDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  saving,
  canSave = true,
  onSave,
  onDelete,
  deleteLabel,
  onMove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  saving: boolean;
  canSave?: boolean;
  onSave: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  onMove?: (delta: number) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        {onMove ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Order</span>
            <button
              type="button"
              className="btn-outline gap-1 px-3 py-1 text-xs"
              disabled={saving}
              onClick={() => onMove(-1)}
            >
              <ArrowUp size={14} /> Move up
            </button>
            <button
              type="button"
              className="btn-outline gap-1 px-3 py-1 text-xs"
              disabled={saving}
              onClick={() => onMove(1)}
            >
              <ArrowDown size={14} /> Move down
            </button>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:justify-between">
          {onDelete ? (
            <button
              type="button"
              className="btn-outline text-destructive hover:bg-destructive/10"
              disabled={saving}
              onClick={onDelete}
            >
              {deleteLabel ?? "Delete"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-outline" onClick={() => onOpenChange(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={saving || !canSave}
              onClick={onSave}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[6rem] items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed border-forest/40 bg-forest/5 p-6 text-sm font-medium text-forest transition hover:border-forest hover:bg-forest/10"
    >
      <Plus size={16} /> {label}
    </button>
  );
}

function EditableCardShell({
  label,
  onEdit,
  onDelete,
  deleteLabel,
  children,
}: {
  label: string;
  onEdit: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  children: ReactNode;
}) {
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
      {onDelete ? (
        <button
          type="button"
          aria-label={deleteLabel ?? "Delete"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="absolute bottom-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-destructive/30 bg-white text-destructive shadow-md transition hover:bg-destructive hover:text-cream"
        >
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
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
  titleField: ResourcesTextField;
  descriptionField: ResourcesTextField;
  sectionLabel: string;
}) {
  const { canInlineEdit, saving, sectionsWith, commit } = useResourcesEditor();
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
    await commit(
      sectionsWith({
        [titleField]: draftTitle.trim(),
        [descriptionField]: draftDescription.trim(),
      }),
    );
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

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        title={`Edit ${sectionLabel}`}
        description="Section heading on the Resources page."
        saving={saving}
        onSave={handleSave}
      >
        <TextField label="Title" value={draftTitle} onChange={setDraftTitle} />
        <TextAreaField label="Description" value={draftDescription} onChange={setDraftDescription} />
      </ItemDialog>
    </>
  );
}

export function EditableSeasonVideoGroupHeading({ group }: { group: SeasonVideoGroup }) {
  const { canInlineEdit, settings, saving, commit } = useResourcesEditor();
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
    await commit({ seasonVideoGroups });
    setOpen(false);
  }

  async function handleDelete() {
    const videoCount = settings.seasonVideos.filter((video) => video.group === group.key).length;
    const message = videoCount
      ? `Remove the "${group.title}" section and its ${videoCount} video${videoCount === 1 ? "" : "s"}?`
      : `Remove the "${group.title}" section?`;
    if (!confirm(message)) return;
    const seasonVideoGroups = settings.seasonVideoGroups.filter((entry) => entry.key !== group.key);
    const seasonVideos = settings.seasonVideos.filter((video) => video.group !== group.key);
    await commit({
      seasonVideoGroups,
      seasonVideos,
      resourcesPageSections: {
        ...settings.resourcesPageSections,
        videoGroupsCleared: seasonVideoGroups.length === 0,
        videosCleared: seasonVideos.length === 0,
      },
    });
    setOpen(false);
  }

  async function handleMove(delta: number) {
    const index = settings.seasonVideoGroups.findIndex((entry) => entry.key === group.key);
    const seasonVideoGroups = moveItem(settings.seasonVideoGroups, index, delta);
    if (seasonVideoGroups === settings.seasonVideoGroups) return;
    await commit({ seasonVideoGroups });
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

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        title="Edit video section"
        description="Heading above a group of season videos."
        saving={saving}
        canSave={Boolean(draftTitle.trim())}
        onSave={handleSave}
        onDelete={handleDelete}
        deleteLabel="Delete section"
        onMove={handleMove}
      >
        <TextField label="Title" value={draftTitle} onChange={setDraftTitle} />
        <TextAreaField label="Description" value={draftCopy} onChange={setDraftCopy} />
      </ItemDialog>
    </>
  );
}

export function AddSeasonVideoGroupButton() {
  const { canInlineEdit, settings, saving, commit } = useResourcesEditor();
  const used = new Set(settings.seasonVideoGroups.map((group) => group.key));
  const available = VIDEO_GROUP_KEYS.filter((key) => !used.has(key));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SeasonVideoGroup>({
    key: available[0] ?? "season",
    title: "",
    copy: "",
  });

  if (!canInlineEdit || !available.length) return null;

  async function handleSave() {
    const seasonVideoGroups = [
      ...settings.seasonVideoGroups,
      { ...draft, title: draft.title.trim(), copy: draft.copy.trim() },
    ];
    await commit({
      seasonVideoGroups,
      resourcesPageSections: { ...settings.resourcesPageSections, videoGroupsCleared: false },
    });
    setOpen(false);
  }

  return (
    <section className="py-6">
      <div className="container-page">
        <AddTile
          label="Add video section"
          onClick={() => {
            setDraft({ key: available[0], title: "", copy: "" });
            setOpen(true);
          }}
        />
      </div>

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        title="Add video section"
        description="Groups the season videos on this page."
        saving={saving}
        canSave={Boolean(draft.title.trim())}
        onSave={handleSave}
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium">Group</span>
          <select
            value={draft.key}
            onChange={(e) => setDraft({ ...draft, key: e.target.value as SeasonVideo["group"] })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {available.map((key) => (
              <option key={key} value={key}>
                {VIDEO_GROUP_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <TextField label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
        <TextAreaField label="Description" value={draft.copy} onChange={(copy) => setDraft({ ...draft, copy })} />
      </ItemDialog>
    </section>
  );
}

function DocumentTile({ doc }: { doc: SeasonDocument }) {
  return (
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
}

export function EditableDocumentTile({ doc }: { doc: SeasonDocument }) {
  const { canInlineEdit, settings, saving, commit } = useResourcesEditor();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(doc);

  if (!canInlineEdit) return <DocumentTile doc={doc} />;

  async function handleSave() {
    const seasonDocuments = settings.seasonDocuments.map((entry) =>
      entry.id === doc.id
        ? { ...draft, title: draft.title.trim(), blurb: draft.blurb.trim(), href: draft.href.trim() }
        : entry,
    );
    await commit({ seasonDocuments });
    setOpen(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove "${doc.title}" from Season documents?`)) return;
    const seasonDocuments = settings.seasonDocuments.filter((entry) => entry.id !== doc.id);
    await commit({ seasonDocuments });
    setOpen(false);
  }

  async function handleMove(delta: number) {
    const index = settings.seasonDocuments.findIndex((entry) => entry.id === doc.id);
    const seasonDocuments = moveItem(settings.seasonDocuments, index, delta);
    if (seasonDocuments === settings.seasonDocuments) return;
    await commit({ seasonDocuments });
  }

  return (
    <>
      <EditableCardShell
        label={`Edit ${doc.title}`}
        onEdit={() => {
          setDraft(doc);
          setOpen(true);
        }}
        onDelete={() => void handleDelete()}
        deleteLabel={`Delete ${doc.title}`}
      >
        <DocumentTile doc={doc} />
      </EditableCardShell>

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        title="Edit document"
        saving={saving}
        canSave={Boolean(draft.title.trim() && draft.href.trim())}
        onSave={handleSave}
        onDelete={handleDelete}
        deleteLabel="Delete document"
        onMove={handleMove}
      >
        <TextField label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
        <TextField label="URL" value={draft.href} onChange={(href) => setDraft({ ...draft, href })} />
        <TextAreaField label="Description" value={draft.blurb} onChange={(blurb) => setDraft({ ...draft, blurb })} />
      </ItemDialog>
    </>
  );
}

const EMPTY_DOCUMENT: SeasonDocument = { id: "", title: "", blurb: "", href: "https://" };

export function AddDocumentTile() {
  const { canInlineEdit, settings, saving, commit } = useResourcesEditor();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DOCUMENT);

  if (!canInlineEdit) return null;

  async function handleSave() {
    const seasonDocuments = [
      ...settings.seasonDocuments,
      {
        id: newId("doc"),
        title: draft.title.trim(),
        blurb: draft.blurb.trim(),
        href: draft.href.trim(),
      },
    ];
    await commit({ seasonDocuments });
    setOpen(false);
  }

  return (
    <>
      <AddTile
        label="Add document"
        onClick={() => {
          setDraft(EMPTY_DOCUMENT);
          setOpen(true);
        }}
      />

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        title="Add document"
        description="A PDF or link shown in Season documents."
        saving={saving}
        canSave={Boolean(draft.title.trim() && draft.href.trim())}
        onSave={handleSave}
      >
        <TextField label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
        <TextField label="URL" value={draft.href} onChange={(href) => setDraft({ ...draft, href })} />
        <TextAreaField label="Description" value={draft.blurb} onChange={(blurb) => setDraft({ ...draft, blurb })} />
      </ItemDialog>
    </>
  );
}

function VideoTile({ video, watchUrl }: { video: SeasonVideo; watchUrl: string }) {
  return (
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
}

export function EditableVideoTile({ video, watchUrl }: { video: SeasonVideo; watchUrl: string }) {
  const { canInlineEdit, settings, saving, commit } = useResourcesEditor();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(video);

  if (!canInlineEdit) return <VideoTile video={video} watchUrl={watchUrl} />;

  async function handleSave() {
    const seasonVideos = settings.seasonVideos.map((entry) =>
      entry.id === video.id
        ? { ...draft, title: draft.title.trim(), blurb: draft.blurb.trim(), id: draft.id.trim() }
        : entry,
    );
    await commit({ seasonVideos });
    setOpen(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove "${video.title}" from this page?`)) return;
    const seasonVideos = settings.seasonVideos.filter((entry) => entry.id !== video.id);
    await commit({
      seasonVideos,
      resourcesPageSections: {
        ...settings.resourcesPageSections,
        videosCleared: seasonVideos.length === 0,
      },
    });
    setOpen(false);
  }

  async function handleMove(delta: number) {
    const index = settings.seasonVideos.findIndex((entry) => entry.id === video.id);
    const seasonVideos = moveItem(settings.seasonVideos, index, delta);
    if (seasonVideos === settings.seasonVideos) return;
    await commit({ seasonVideos });
  }

  return (
    <>
      <EditableCardShell
        label={`Edit ${video.title}`}
        onEdit={() => {
          setDraft(video);
          setOpen(true);
        }}
        onDelete={() => void handleDelete()}
        deleteLabel={`Delete ${video.title}`}
      >
        <VideoTile video={video} watchUrl={watchUrl} />
      </EditableCardShell>

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        title="Edit video"
        saving={saving}
        canSave={Boolean(draft.id.trim() && draft.title.trim())}
        onSave={handleSave}
        onDelete={handleDelete}
        deleteLabel="Delete video"
        onMove={handleMove}
      >
        <TextField
          label="YouTube video ID"
          value={draft.id}
          onChange={(id) => setDraft({ ...draft, id })}
          mono
        />
        <TextField label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
        <TextAreaField label="Description" value={draft.blurb} onChange={(blurb) => setDraft({ ...draft, blurb })} />
      </ItemDialog>
    </>
  );
}

export function AddVideoTile({ group }: { group: SeasonVideo["group"] }) {
  const { canInlineEdit, settings, saving, commit } = useResourcesEditor();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SeasonVideo>({ id: "", title: "", blurb: "", group });

  if (!canInlineEdit) return null;

  const trimmedId = draft.id.trim();
  const duplicate = settings.seasonVideos.some((entry) => entry.id === trimmedId);

  async function handleSave() {
    const seasonVideos = [
      ...settings.seasonVideos,
      { ...draft, id: trimmedId, title: draft.title.trim(), blurb: draft.blurb.trim() },
    ];
    await commit({
      seasonVideos,
      resourcesPageSections: { ...settings.resourcesPageSections, videosCleared: false },
    });
    setOpen(false);
  }

  return (
    <>
      <AddTile
        label="Add video"
        onClick={() => {
          setDraft({ id: "", title: "", blurb: "", group });
          setOpen(true);
        }}
      />

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        title="Add video"
        description="Paste the YouTube video ID — the part after v= in the watch URL."
        saving={saving}
        canSave={Boolean(trimmedId && draft.title.trim() && !duplicate)}
        onSave={handleSave}
      >
        <TextField
          label="YouTube video ID"
          value={draft.id}
          onChange={(id) => setDraft({ ...draft, id })}
          mono
          hint={duplicate ? "This video is already on the page." : undefined}
        />
        <TextField label="Title" value={draft.title} onChange={(title) => setDraft({ ...draft, title })} />
        <TextAreaField label="Description" value={draft.blurb} onChange={(blurb) => setDraft({ ...draft, blurb })} />
      </ItemDialog>
    </>
  );
}

function QuickLinkTile({ link, icon }: { link: QuickLinkCard; icon: ReactNode }) {
  const external = link.href.startsWith("http");
  const className =
    "group flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest";
  const inner = (
    <>
      {icon}
      <div className="flex-1">
        <div className="font-display text-lg">{link.label}</div>
        <p className="mt-1 text-sm text-muted-foreground">{link.desc}</p>
      </div>
    </>
  );

  return external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <a href={link.href} className={className}>
      {inner}
    </a>
  );
}

export function EditableQuickLinkCard({ link, icon }: { link: QuickLinkCard; icon: ReactNode }) {
  const { canInlineEdit, settings, saving, commit } = useResourcesEditor();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(link);

  if (!canInlineEdit) return <QuickLinkTile link={link} icon={icon} />;

  async function handleSave() {
    const quickLinks = settings.quickLinks.map((entry) =>
      entry.id === link.id
        ? { ...draft, label: draft.label.trim(), desc: draft.desc.trim(), href: draft.href.trim() }
        : entry,
    );
    await commit({ quickLinks });
    setOpen(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove the "${link.label}" link?`)) return;
    const quickLinks = settings.quickLinks.filter((entry) => entry.id !== link.id);
    await commit({
      quickLinks,
      resourcesPageSections: {
        ...settings.resourcesPageSections,
        quickLinksCleared: quickLinks.length === 0,
      },
    });
    setOpen(false);
  }

  async function handleMove(delta: number) {
    const index = settings.quickLinks.findIndex((entry) => entry.id === link.id);
    const quickLinks = moveItem(settings.quickLinks, index, delta);
    if (quickLinks === settings.quickLinks) return;
    await commit({ quickLinks });
  }

  return (
    <>
      <EditableCardShell
        label={`Edit ${link.label}`}
        onEdit={() => {
          setDraft(link);
          setOpen(true);
        }}
        onDelete={() => void handleDelete()}
        deleteLabel={`Delete ${link.label}`}
      >
        <QuickLinkTile link={link} icon={icon} />
      </EditableCardShell>

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        title="Edit link"
        saving={saving}
        canSave={Boolean(draft.label.trim() && draft.href.trim())}
        onSave={handleSave}
        onDelete={handleDelete}
        deleteLabel="Delete link"
        onMove={handleMove}
      >
        <TextField label="Label" value={draft.label} onChange={(label) => setDraft({ ...draft, label })} />
        <TextField label="URL or path" value={draft.href} onChange={(href) => setDraft({ ...draft, href })} />
        <TextAreaField label="Description" value={draft.desc} onChange={(desc) => setDraft({ ...draft, desc })} />
      </ItemDialog>
    </>
  );
}

/** `program` links point off-site; `team` links point at a page on this site. */
export function AddQuickLinkCard({ kind }: { kind: "program" | "team" }) {
  const { canInlineEdit, settings, saving, commit } = useResourcesEditor();
  const blank: QuickLinkCard = {
    id: "",
    label: "",
    href: kind === "program" ? "https://" : "/",
    desc: "",
  };
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(blank);

  if (!canInlineEdit) return null;

  async function handleSave() {
    const quickLinks = [
      ...settings.quickLinks,
      {
        id: newId("link"),
        label: draft.label.trim(),
        href: draft.href.trim(),
        desc: draft.desc.trim(),
      },
    ];
    await commit({
      quickLinks,
      resourcesPageSections: { ...settings.resourcesPageSections, quickLinksCleared: false },
    });
    setOpen(false);
  }

  return (
    <>
      <AddTile
        label={kind === "program" ? "Add program link" : "Add page link"}
        onClick={() => {
          setDraft(blank);
          setOpen(true);
        }}
      />

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        title={kind === "program" ? "Add program link" : "Add page link"}
        description={
          kind === "program"
            ? "Links starting with https:// appear under the program links heading."
            : "Links starting with / point at a page on this site, like /calendar."
        }
        saving={saving}
        canSave={Boolean(draft.label.trim() && draft.href.trim())}
        onSave={handleSave}
      >
        <TextField label="Label" value={draft.label} onChange={(label) => setDraft({ ...draft, label })} />
        <TextField label="URL or path" value={draft.href} onChange={(href) => setDraft({ ...draft, href })} />
        <TextAreaField label="Description" value={draft.desc} onChange={(desc) => setDraft({ ...draft, desc })} />
      </ItemDialog>
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
  field: ResourcesTextField;
  href: string;
  className?: string;
}) {
  const { canInlineEdit, saving, commit, sectionsWith } = useResourcesEditor();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(label);

  const button = (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className ?? "btn-primary gap-2"}>
      {label}
    </a>
  );

  if (!canInlineEdit) return button;

  async function handleSave() {
    await commit(sectionsWith({ [field]: draft.trim() }));
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

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        title="Edit button label"
        saving={saving}
        canSave={Boolean(draft.trim())}
        onSave={handleSave}
      >
        <TextField label="Label" value={draft} onChange={setDraft} />
      </ItemDialog>
    </>
  );
}

export function EditableSeasonName({ seasonName }: { seasonName: string }) {
  const { canInlineEdit, saving, commit } = useResourcesEditor();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(seasonName);

  if (!canInlineEdit) {
    return <span className="font-medium text-foreground">{seasonName}</span>;
  }

  async function handleSave() {
    await commit({ seasonName: draft.trim() });
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

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        title="Edit current season name"
        saving={saving}
        canSave={Boolean(draft.trim())}
        onSave={handleSave}
      >
        <TextField label="Season name" value={draft} onChange={setDraft} />
      </ItemDialog>
    </>
  );
}
