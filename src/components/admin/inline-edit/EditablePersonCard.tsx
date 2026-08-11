import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { Building2, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminEdit } from "./AdminEditProvider";
import { uploadProfilePhoto } from "@/lib/profile-photos";
import { toast } from "sonner";

export type InlinePerson = {
  id: string;
  name: string;
  description?: string;
  photoUrl?: string;
  sortOrder?: number;
};

type SavePersonPayload = {
  id?: string;
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  sortOrder?: number;
};

function PersonEditDialog({
  open,
  onOpenChange,
  initial,
  title,
  photoKind,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: InlinePerson | null;
  title: string;
  photoKind: "team" | "coaches";
  onSave: (payload: SavePersonPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function resetDraft() {
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setPhotoUrl(initial?.photoUrl ?? "");
    setSortOrder(String(initial?.sortOrder ?? 0));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setBusy(true);
    try {
      await onSave({
        id: initial?.id,
        name,
        description,
        photoUrl: photoUrl || null,
        sortOrder: Number(sortOrder) || 0,
      });
      toast.success(initial?.id ? "Saved" : "Added");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) resetDraft();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Changes appear on this page after you save.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-[120px_1fr]">
          <div>
            <div className="overflow-hidden rounded-xl border border-border bg-sand">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <div className="grid aspect-square place-items-center text-xs text-muted-foreground">No photo</div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  const url = await uploadProfilePhoto(file, photoKind, initial?.id);
                  setPhotoUrl(url);
                  toast.success("Photo uploaded");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Upload failed");
                }
              }}
            />
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline mt-2 w-full !px-2 !py-1 text-xs">
              Upload photo
            </button>
          </div>
          <div className="space-y-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-input px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Bio</span>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg border border-input px-3 py-2"
                placeholder="Optional — leave blank for placeholder text"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Sort order</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-24 rounded-lg border border-input px-3 py-2"
              />
            </label>
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          {initial?.id && onDelete ? (
            <button
              type="button"
              className="btn-outline !border-destructive/40 !text-destructive"
              disabled={busy}
              onClick={async () => {
                if (!confirm(`Delete ${initial.name}?`)) return;
                setBusy(true);
                try {
                  await onDelete(initial.id);
                  toast.success("Deleted");
                  onOpenChange(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Delete failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 size={14} className="mr-1 inline" /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-outline" onClick={() => onOpenChange(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={busy} onClick={handleSave}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPencil({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-forest/30 bg-white text-forest shadow-md transition hover:bg-forest hover:text-cream"
    >
      <Pencil size={14} />
    </button>
  );
}

function personInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function EditableTeamMemberCard({
  member,
  displayDescription,
  onSave,
  onDelete,
}: {
  member: InlinePerson;
  displayDescription: string;
  onSave: (payload: SavePersonPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { canInlineEdit } = useAdminEdit();
  const [open, setOpen] = useState(false);
  const initials = personInitials(member.name);

  return (
    <>
      <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-border/50">
        {canInlineEdit && <EditPencil label={`Edit ${member.name}`} onClick={() => setOpen(true)} />}
        <div className="relative aspect-[4/5] overflow-hidden bg-sand">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover object-top" loading="lazy" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-forest/15 via-sand to-navy/10 px-4 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full border border-dashed border-forest/30 bg-white/70 text-forest">
                <span className="font-display text-2xl">{initials}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserRound size={14} /> Photo placeholder
              </div>
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="font-display text-xl leading-tight text-foreground">{member.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{displayDescription}</p>
        </div>
      </article>
      {canInlineEdit && (
        <PersonEditDialog
          open={open}
          onOpenChange={setOpen}
          initial={member}
          title={`Edit ${member.name}`}
          photoKind="team"
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

export function EditableCoachCard({
  coach,
  displayDescription,
  onSave,
  onDelete,
}: {
  coach: InlinePerson;
  displayDescription: string;
  onSave: (payload: SavePersonPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { canInlineEdit } = useAdminEdit();
  const [open, setOpen] = useState(false);
  const initials = personInitials(coach.name);

  return (
    <>
      <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-border/50">
        {canInlineEdit && <EditPencil label={`Edit ${coach.name}`} onClick={() => setOpen(true)} />}
        <div className="flex flex-col items-center gap-4 p-5 min-[420px]:flex-row min-[420px]:items-start sm:gap-6 sm:p-6">
          <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-sand sm:h-48 sm:w-48">
            {coach.photoUrl ? (
              <img src={coach.photoUrl} alt={coach.name} className="h-full w-full object-cover object-top" loading="lazy" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-forest/15 via-sand to-navy/10 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full border border-dashed border-forest/30 bg-white/70 text-forest sm:h-16 sm:w-16">
                  <span className="font-display text-lg sm:text-xl">{initials}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserRound size={14} /> Photo placeholder
                </div>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-center min-[420px]:text-left sm:space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest">Coach</p>
            <h2 className="font-display text-2xl leading-tight text-foreground sm:text-3xl">{coach.name}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{displayDescription}</p>
          </div>
        </div>
      </article>
      {canInlineEdit && (
        <PersonEditDialog
          open={open}
          onOpenChange={setOpen}
          initial={coach}
          title={`Edit ${coach.name}`}
          photoKind="coaches"
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

function SponsorEditDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: InlinePerson | null;
  onSave: (payload: SavePersonPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.photoUrl ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setBusy(true);
    try {
      await onSave({
        id: initial?.id,
        name: name.trim() || "Coming soon",
        description,
        photoUrl: logoUrl || null,
        sortOrder: Number(sortOrder) || 0,
      });
      toast.success(initial?.id ? "Saved" : "Added");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? `Edit ${initial.name}` : "Add sponsor"}</DialogTitle>
          <DialogDescription>Changes appear on this page after you save.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-border bg-sand">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="mx-auto aspect-[4/3] max-h-40 object-contain p-4" />
            ) : (
              <div className="grid aspect-[4/3] place-items-center text-xs text-muted-foreground">No logo</div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                const url = await uploadProfilePhoto(file, "sponsors", initial?.id);
                setLogoUrl(url);
                toast.success("Logo uploaded");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Upload failed");
              }
            }}
          />
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline text-xs">
            Upload logo
          </button>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-input px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Description</span>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-lg border border-input px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Sort order</span>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-24 rounded-lg border border-input px-3 py-2" />
          </label>
        </div>
        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          {initial?.id && onDelete ? (
            <button
              type="button"
              className="btn-outline !border-destructive/40 !text-destructive"
              disabled={busy}
              onClick={async () => {
                if (!confirm(`Delete ${initial.name}?`)) return;
                await onDelete(initial.id);
                toast.success("Deleted");
                onOpenChange(false);
              }}
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-outline" onClick={() => onOpenChange(false)}>Cancel</button>
            <button type="button" className="btn-primary" disabled={busy} onClick={handleSave}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditableSponsorCard({
  sponsor,
  displayDescription,
  onSave,
  onDelete,
}: {
  sponsor: InlinePerson;
  displayDescription: string;
  onSave: (payload: SavePersonPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { canInlineEdit } = useAdminEdit();
  const [open, setOpen] = useState(false);

  return (
    <>
      <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-border/50">
        {canInlineEdit && <EditPencil label={`Edit ${sponsor.name}`} onClick={() => setOpen(true)} />}
        <div className="relative aspect-[4/3] overflow-hidden bg-sand">
          {sponsor.photoUrl ? (
            <img src={sponsor.photoUrl} alt={sponsor.name} className="h-full w-full object-contain p-6" loading="lazy" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-forest/15 via-sand to-navy/10 px-4 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-dashed border-forest/30 bg-white/70 text-forest">
                <Building2 size={28} />
              </div>
              <div className="text-xs text-muted-foreground">Logo placeholder</div>
            </div>
          )}
        </div>
        <div className="p-5">
          <h2 className="font-display text-xl leading-tight text-foreground">{sponsor.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{displayDescription}</p>
        </div>
      </article>
      {canInlineEdit && (
        <SponsorEditDialog open={open} onOpenChange={setOpen} initial={sponsor} onSave={onSave} onDelete={onDelete} />
      )}
    </>
  );
}

export function InlineAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  const { canInlineEdit } = useAdminEdit();
  if (!canInlineEdit) return null;

  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-full border border-dashed border-forest/40 bg-forest/5 px-4 py-2 text-sm font-medium text-forest hover:bg-forest/10">
      <Plus size={16} /> {label}
    </button>
  );
}

export function InlineAddPersonDialog({
  open,
  onOpenChange,
  title,
  photoKind,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  photoKind: "team" | "coaches";
  onSave: (payload: SavePersonPayload) => Promise<void>;
}) {
  return (
    <PersonEditDialog
      open={open}
      onOpenChange={onOpenChange}
      initial={null}
      title={title}
      photoKind={photoKind}
      onSave={onSave}
    />
  );
}

export function InlineAddSponsorDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: SavePersonPayload) => Promise<void>;
}) {
  return <SponsorEditDialog open={open} onOpenChange={onOpenChange} initial={null} onSave={onSave} />;
}

export function useInlineEditRefresh() {
  const router = useRouter();
  return () => router.invalidate();
}
