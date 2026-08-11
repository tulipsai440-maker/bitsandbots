import { Plus, Trash2 } from "lucide-react";
import type { SiteContentAdminData } from "@/lib/site-settings-admin";
import type {
  NavLinkItem,
  QuickLinkCard,
  SeasonDocument,
  SeasonVideo,
  SeasonVideoGroup,
  SiteSettings,
} from "@/lib/site-settings";
import { DEFAULT_ACCENT_COLOR } from "@/lib/site-content-defaults";
import { DEFAULT_BRAND_COLOR, normalizeAccentColor } from "@/lib/brand-colors";

type SetForm = React.Dispatch<React.SetStateAction<SiteContentAdminData | null>>;

export function SiteContentExtendedSections({
  form,
  setForm,
  patchSettings,
}: {
  form: SiteContentAdminData;
  setForm: SetForm;
  patchSettings: (patch: Partial<SiteSettings>) => void;
}) {
  return (
    <>
      <Section title="Accent color & Zoom">
        <Grid>
          <AccentColorField
            value={form.settings.accentColor}
            onChange={(accentColor) => patchSettings({ accentColor })}
          />
          <Field
            label="Zoom meeting URL"
            value={form.settings.zoomUrl ?? ""}
            onChange={(v) => patchSettings({ zoomUrl: v.trim() || null })}
          />
        </Grid>
      </Section>

      <Section title="Homepage buttons">
        <Grid>
          <Field label="Hero primary label" value={form.settings.heroPrimaryLabel} onChange={(v) => patchSettings({ heroPrimaryLabel: v })} />
          <Field label="Hero primary path" value={form.settings.heroPrimaryPath} onChange={(v) => patchSettings({ heroPrimaryPath: v })} />
          <Field label="Hero secondary label" value={form.settings.heroSecondaryLabel} onChange={(v) => patchSettings({ heroSecondaryLabel: v })} />
          <Field label="Hero secondary path" value={form.settings.heroSecondaryPath} onChange={(v) => patchSettings({ heroSecondaryPath: v })} />
          <Field label="CTA primary label" value={form.settings.ctaPrimaryLabel} onChange={(v) => patchSettings({ ctaPrimaryLabel: v })} />
          <Field label="CTA primary path" value={form.settings.ctaPrimaryPath} onChange={(v) => patchSettings({ ctaPrimaryPath: v })} />
          <Field label="CTA secondary label" value={form.settings.ctaSecondaryLabel} onChange={(v) => patchSettings({ ctaSecondaryLabel: v })} />
          <Field label="CTA secondary path" value={form.settings.ctaSecondaryPath} onChange={(v) => patchSettings({ ctaSecondaryPath: v })} />
        </Grid>
      </Section>

      <Section title="Page titles & heroes">
        <Grid>
          <Field label="Gallery title" value={form.settings.galleryHeroTitle} onChange={(v) => patchSettings({ galleryHeroTitle: v })} />
          <Field label="Events title" value={form.settings.eventsHeroTitle} onChange={(v) => patchSettings({ eventsHeroTitle: v })} />
          <Field label="Calendar title" value={form.settings.calendarHeroTitle} onChange={(v) => patchSettings({ calendarHeroTitle: v })} />
          <Field label="Videos title" value={form.settings.videosHeroTitle} onChange={(v) => patchSettings({ videosHeroTitle: v })} />
          <Field label="Quick links title" value={form.settings.quickLinksHeroTitle} onChange={(v) => patchSettings({ quickLinksHeroTitle: v })} />
          <Field label="Consent title" value={form.settings.consentHeroTitle} onChange={(v) => patchSettings({ consentHeroTitle: v })} />
        </Grid>
        <TextArea label="Gallery hero description" value={form.settings.galleryHeroDescription} onChange={(v) => patchSettings({ galleryHeroDescription: v })} />
        <TextArea label="Events hero description" value={form.settings.eventsHeroDescription} onChange={(v) => patchSettings({ eventsHeroDescription: v })} />
        <TextArea label="Calendar hero description" value={form.settings.calendarHeroDescription} onChange={(v) => patchSettings({ calendarHeroDescription: v })} />
        <TextArea label="Videos hero description" value={form.settings.videosHeroDescription} onChange={(v) => patchSettings({ videosHeroDescription: v })} />
        <TextArea label="Quick links hero description" value={form.settings.quickLinksHeroDescription} onChange={(v) => patchSettings({ quickLinksHeroDescription: v })} />
        <TextArea label="Consent hero description" value={form.settings.consentHeroDescription} onChange={(v) => patchSettings({ consentHeroDescription: v })} />
        <Grid>
          <Field label="Gallery empty title" value={form.settings.galleryEmptyTitle} onChange={(v) => patchSettings({ galleryEmptyTitle: v })} />
          <Field label="Gallery share button" value={form.settings.galleryShareButtonLabel} onChange={(v) => patchSettings({ galleryShareButtonLabel: v })} />
        </Grid>
        <TextArea label="Gallery empty message" value={form.settings.galleryEmptyMessage} onChange={(v) => patchSettings({ galleryEmptyMessage: v })} />
      </Section>

      <Section title="Season videos & resources">
        <Grid>
          <Field label="Season name" value={form.settings.seasonName} onChange={(v) => patchSettings({ seasonName: v })} />
          <Field label="YouTube playlist ID" value={form.settings.seasonPlaylistId} onChange={(v) => patchSettings({ seasonPlaylistId: v })} />
          <Field label="Playlist URL" value={form.settings.seasonPlaylistUrl} onChange={(v) => patchSettings({ seasonPlaylistUrl: v })} />
          <Field label="Resources URL" value={form.settings.seasonResourcesUrl} onChange={(v) => patchSettings({ seasonResourcesUrl: v })} />
        </Grid>
        <SeasonDocumentsEditor
          documents={form.settings.seasonDocuments}
          onChange={(seasonDocuments) => patchSettings({ seasonDocuments })}
        />
        <SeasonVideoGroupsEditor
          groups={form.settings.seasonVideoGroups}
          onChange={(seasonVideoGroups) => patchSettings({ seasonVideoGroups })}
        />
        <SeasonVideosEditor
          videos={form.settings.seasonVideos}
          onChange={(seasonVideos) => patchSettings({ seasonVideos })}
        />
      </Section>

      <Section title="Quick links page">
        <QuickLinksEditor links={form.settings.quickLinks} onChange={(quickLinks) => patchSettings({ quickLinks })} />
      </Section>

      <Section title="Footer external links">
        <NavLinksEditor
          links={form.settings.footerExternalLinks}
          onChange={(footerExternalLinks) => patchSettings({ footerExternalLinks })}
        />
      </Section>

      <Section title="Generic bios & footer">
        <TextArea label="Default coach bio" value={form.settings.genericCoachBio} onChange={(v) => patchSettings({ genericCoachBio: v })} />
        <TextArea label="Default member bio" value={form.settings.genericMemberBio} onChange={(v) => patchSettings({ genericMemberBio: v })} />
        <Field label="Footer meet team link" value={form.settings.footerMeetTeamLabel} onChange={(v) => patchSettings({ footerMeetTeamLabel: v })} />
        <TextArea label="Assignments intro" value={form.settings.assignmentsIntro} onChange={(v) => patchSettings({ assignmentsIntro: v })} />
      </Section>

      <Section title="Join & consent messages">
        <Grid>
          <Field label="Join success title" value={form.settings.joinSuccessTitle} onChange={(v) => patchSettings({ joinSuccessTitle: v })} />
          <Field label="Consent success title" value={form.settings.consentSuccessTitle} onChange={(v) => patchSettings({ consentSuccessTitle: v })} />
        </Grid>
        <TextArea label="Join success message" value={form.settings.joinSuccessMessage} onChange={(v) => patchSettings({ joinSuccessMessage: v })} />
        <TextArea label="Consent success message" value={form.settings.consentSuccessMessage} onChange={(v) => patchSettings({ consentSuccessMessage: v })} />
        <TextArea label="Consent intro override (blank = auto)" value={form.settings.consentIntroOverride} onChange={(v) => patchSettings({ consentIntroOverride: v })} />
        <StringListEditor
          label="Consent terms override (blank list = auto)"
          items={form.settings.consentTermsOverride}
          onChange={(consentTermsOverride) => patchSettings({ consentTermsOverride })}
        />
        <TextArea
          label="Both parents note override (blank = auto)"
          value={form.settings.consentBothParentsNoteOverride}
          onChange={(v) => patchSettings({ consentBothParentsNoteOverride: v })}
        />
      </Section>

      <Section title="Core Values — names & definitions">
        <TextArea
          label="Official blurb"
          value={form.settings.coreValuesOfficialBlurb}
          onChange={(v) => patchSettings({ coreValuesOfficialBlurb: v })}
        />
        {form.settings.coreValues.map((value, index) => (
          <div key={value.id} className="rounded-xl border border-border p-4">
            <Field
              label="Name"
              value={value.name}
              onChange={(name) => {
                setForm((current) => {
                  if (!current) return current;
                  const coreValues = [...current.settings.coreValues];
                  coreValues[index] = { ...coreValues[index], name };
                  return { ...current, settings: { ...current.settings, coreValues } };
                });
              }}
            />
            <TextArea
              label="Official definition"
              value={value.definition}
              onChange={(definition) => {
                setForm((current) => {
                  if (!current) return current;
                  const coreValues = [...current.settings.coreValues];
                  coreValues[index] = { ...coreValues[index], definition };
                  return { ...current, settings: { ...current.settings, coreValues } };
                });
              }}
            />
            <TextArea
              label="How we live it"
              value={value.howWeLiveIt}
              onChange={(howWeLiveIt) => {
                setForm((current) => {
                  if (!current) return current;
                  const coreValues = [...current.settings.coreValues];
                  coreValues[index] = { ...coreValues[index], howWeLiveIt };
                  return { ...current, settings: { ...current.settings, coreValues } };
                });
              }}
            />
          </div>
        ))}
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function AccentColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const color = normalizeAccentColor(value);
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">Accent color (gold)</span>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-11 cursor-pointer rounded-lg border border-input bg-transparent p-1"
          aria-label="Pick accent color"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={DEFAULT_ACCENT_COLOR}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
          spellCheck={false}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Highlights, badges, and gold buttons. Brand green stays {DEFAULT_BRAND_COLOR}.
      </p>
    </label>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[index] = e.target.value;
              onChange(next);
            }}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <button type="button" className="btn-outline px-3" onClick={() => onChange(items.filter((_, i) => i !== index))}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="btn-outline gap-2 text-sm" onClick={() => onChange([...items, ""])}>
        <Plus size={14} /> Add line
      </button>
    </div>
  );
}

function NavLinksEditor({ links, onChange }: { links: NavLinkItem[]; onChange: (links: NavLinkItem[]) => void }) {
  return (
    <div className="space-y-3">
      {links.map((link, index) => (
        <div key={index} className="grid gap-2 rounded-xl border border-border/80 p-3 md:grid-cols-[120px_1fr_1fr_auto] md:items-end">
          <label className="grid gap-1">
            <span className="text-xs font-medium">Type</span>
            <select
              value={link.kind}
              onChange={(e) => {
                const next = [...links];
                if (e.target.value === "external") {
                  next[index] = { kind: "external", label: link.label, href: "https://" };
                } else {
                  next[index] = { kind: "internal", label: link.label, to: "/" };
                }
                onChange(next);
              }}
              className="rounded-lg border border-input bg-background px-2 py-2 text-sm"
            >
              <option value="internal">Internal page</option>
              <option value="external">External URL</option>
            </select>
          </label>
          <Field label="Label" value={link.label} onChange={(label) => {
            const next = [...links];
            next[index] = { ...next[index], label } as NavLinkItem;
            onChange(next);
          }} />
          {link.kind === "internal" ? (
            <Field label="Path" value={link.to} onChange={(to) => {
              const next = [...links];
              next[index] = { kind: "internal", label: link.label, to };
              onChange(next);
            }} />
          ) : (
            <Field label="URL" value={link.href} onChange={(href) => {
              const next = [...links];
              next[index] = { kind: "external", label: link.label, href };
              onChange(next);
            }} />
          )}
          <button type="button" className="btn-outline px-3" onClick={() => onChange(links.filter((_, i) => i !== index))}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="btn-outline gap-2 text-sm" onClick={() => onChange([...links, { kind: "external", label: "New link", href: "https://" }])}>
        <Plus size={14} /> Add link
      </button>
    </div>
  );
}

function SeasonDocumentsEditor({
  documents,
  onChange,
}: {
  documents: SeasonDocument[];
  onChange: (documents: SeasonDocument[]) => void;
}) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">Season PDFs</span>
      {documents.map((doc, index) => (
        <div key={doc.id || index} className="space-y-2 rounded-xl border border-border/80 p-3">
          <Grid>
            <Field label="ID" value={doc.id} onChange={(id) => {
              const next = [...documents];
              next[index] = { ...next[index], id };
              onChange(next);
            }} />
            <Field label="Title" value={doc.title} onChange={(title) => {
              const next = [...documents];
              next[index] = { ...next[index], title };
              onChange(next);
            }} />
          </Grid>
          <Field label="URL" value={doc.href} onChange={(href) => {
            const next = [...documents];
            next[index] = { ...next[index], href };
            onChange(next);
          }} />
          <TextArea label="Blurb" value={doc.blurb} onChange={(blurb) => {
            const next = [...documents];
            next[index] = { ...next[index], blurb };
            onChange(next);
          }} />
          <button type="button" className="btn-outline text-sm" onClick={() => onChange(documents.filter((_, i) => i !== index))}>
            Remove document
          </button>
        </div>
      ))}
      <button type="button" className="btn-outline gap-2 text-sm" onClick={() => onChange([...documents, { id: `doc-${Date.now()}`, title: "", blurb: "", href: "https://" }])}>
        <Plus size={14} /> Add document
      </button>
    </div>
  );
}

function SeasonVideosEditor({
  videos,
  onChange,
}: {
  videos: SeasonVideo[];
  onChange: (videos: SeasonVideo[]) => void;
}) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">Season videos</span>
      {videos.map((video, index) => (
        <div key={video.id || index} className="space-y-2 rounded-xl border border-border/80 p-3">
          <Grid>
            <Field label="YouTube video ID" value={video.id} onChange={(id) => {
              const next = [...videos];
              next[index] = { ...next[index], id };
              onChange(next);
            }} />
            <label className="grid gap-2">
              <span className="text-sm font-medium">Group</span>
              <select
                value={video.group}
                onChange={(e) => {
                  const next = [...videos];
                  next[index] = { ...next[index], group: e.target.value as SeasonVideo["group"] };
                  onChange(next);
                }}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="season">Season intro</option>
                <option value="game">Robot game</option>
                <option value="roles">Roles</option>
              </select>
            </label>
          </Grid>
          <Field label="Title" value={video.title} onChange={(title) => {
            const next = [...videos];
            next[index] = { ...next[index], title };
            onChange(next);
          }} />
          <TextArea label="Blurb" value={video.blurb} onChange={(blurb) => {
            const next = [...videos];
            next[index] = { ...next[index], blurb };
            onChange(next);
          }} />
          <button type="button" className="btn-outline text-sm" onClick={() => onChange(videos.filter((_, i) => i !== index))}>
            Remove video
          </button>
        </div>
      ))}
      <button type="button" className="btn-outline gap-2 text-sm" onClick={() => onChange([...videos, { id: "", title: "", blurb: "", group: "season" }])}>
        <Plus size={14} /> Add video
      </button>
    </div>
  );
}

function SeasonVideoGroupsEditor({
  groups,
  onChange,
}: {
  groups: SeasonVideoGroup[];
  onChange: (groups: SeasonVideoGroup[]) => void;
}) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">Video section headings</span>
      {groups.map((group, index) => (
        <div key={group.key} className="space-y-2 rounded-xl border border-border/80 p-3">
          <Field label="Title" value={group.title} onChange={(title) => {
            const next = [...groups];
            next[index] = { ...next[index], title };
            onChange(next);
          }} />
          <TextArea label="Copy" value={group.copy} onChange={(copy) => {
            const next = [...groups];
            next[index] = { ...next[index], copy };
            onChange(next);
          }} />
        </div>
      ))}
    </div>
  );
}

function QuickLinksEditor({
  links,
  onChange,
}: {
  links: QuickLinkCard[];
  onChange: (links: QuickLinkCard[]) => void;
}) {
  return (
    <div className="space-y-3">
      {links.map((link, index) => (
        <div key={link.id || index} className="space-y-2 rounded-xl border border-border/80 p-3">
          <Grid>
            <Field label="ID" value={link.id} onChange={(id) => {
              const next = [...links];
              next[index] = { ...next[index], id };
              onChange(next);
            }} />
            <Field label="Label" value={link.label} onChange={(label) => {
              const next = [...links];
              next[index] = { ...next[index], label };
              onChange(next);
            }} />
          </Grid>
          <Field label="URL or path" value={link.href} onChange={(href) => {
            const next = [...links];
            next[index] = { ...next[index], href };
            onChange(next);
          }} />
          <TextArea label="Description" value={link.desc} onChange={(desc) => {
            const next = [...links];
            next[index] = { ...next[index], desc };
            onChange(next);
          }} />
          <button type="button" className="btn-outline text-sm" onClick={() => onChange(links.filter((_, i) => i !== index))}>
            Remove link
          </button>
        </div>
      ))}
      <button type="button" className="btn-outline gap-2 text-sm" onClick={() => onChange([...links, { id: `link-${Date.now()}`, label: "", href: "/", desc: "" }])}>
        <Plus size={14} /> Add quick link
      </button>
    </div>
  );
}