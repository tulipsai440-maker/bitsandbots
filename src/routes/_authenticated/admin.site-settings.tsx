import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AdminQuickShell } from "@/components/admin/AdminQuickShell";
import { SiteContentExtendedSections } from "@/components/admin/SiteContentExtendedSections";
import {
  fetchSiteContentAdmin,
  isSiteSettingsSetupMissing,
  saveSiteContentAdmin,
  siteSettingsErrorMessage,
  type SiteContentAdminData,
} from "@/lib/site-settings-admin";
import type { HomepagePillar, NavLinkItem, SiteSettings } from "@/lib/site-settings";
import { propagateTeamNameChange, propagateTeamNameInOutreach } from "@/lib/site-settings";
import { DEFAULT_BRAND_COLOR, normalizeBrandColor } from "@/lib/brand-colors";
import { toast } from "sonner";
import { ExternalLink, Plus, Save, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/site-settings")({
  component: AdminSiteSettingsPage,
});

const SQL_EDITOR_URL = "https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new";

function AdminSiteSettingsPage() {
  const [form, setForm] = useState<SiteContentAdminData | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadedSiteName = useRef<string | null>(null);

  async function load() {
    try {
      const data = await fetchSiteContentAdmin();
      setForm(data);
      loadedSiteName.current = data.settings.siteName;
      setNeedsSetup(false);
    } catch (e) {
      if (isSiteSettingsSetupMissing(e)) setNeedsSetup(true);
      else toast.error(siteSettingsErrorMessage(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSave() {
    if (!form) return;
    setSaving(true);
    try {
      let toSave = form;
      const previousName = loadedSiteName.current?.trim() ?? "";
      const nextName = form.settings.siteName.trim();
      if (previousName && previousName !== nextName) {
        toSave = {
          settings: propagateTeamNameChange(form.settings, previousName, nextName),
          outreachStories: propagateTeamNameInOutreach(form.outreachStories, previousName, nextName),
        };
        setForm(toSave);
      }
      await saveSiteContentAdmin(toSave);
      loadedSiteName.current = toSave.settings.siteName;
      toast.success("Site content saved");
      await load();
    } catch (e) {
      toast.error(siteSettingsErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminQuickShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">Site content</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Team name, navigation links, homepage text, meetings info, outreach stories, and Core
            Values copy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/" target="_blank" rel="noreferrer" className="btn-outline text-sm">
            View site
          </Link>
          <Link to="/admin/site-images" className="btn-outline text-sm">
            Site images
          </Link>
          <button
            type="button"
            className="btn-primary gap-2 text-sm"
            disabled={!form || saving}
            onClick={onSave}
          >
            <Save size={16} /> {saving ? "Saving…" : "Save all"}
          </button>
        </div>
      </div>

      {needsSetup && (
        <div className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-medium">One-time setup required</p>
          <p className="mt-1">
            Run <code className="rounded bg-white/70 px-1">supabase/setup-site-settings.sql</code> then{" "}
            <code className="rounded bg-white/70 px-1">supabase/patch-site-settings-full-admin.sql</code> in Supabase.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={SQL_EDITOR_URL} target="_blank" rel="noreferrer" className="btn-outline gap-2">
              <ExternalLink size={16} /> Open SQL Editor
            </a>
            <button type="button" className="btn-outline gap-2" onClick={load}>
              Check again
            </button>
          </div>
        </div>
      )}

      {!form ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-8">
          <Section title="Brand & meetings">
            <Grid>
              <Field label="Team name" value={form.settings.siteName} onChange={(v) => patchSettings(setForm, { siteName: v })} />
              <BrandColorField
                value={form.settings.brandColor}
                onChange={(brandColor) => patchSettings(setForm, { brandColor })}
              />
              <Field label="Tagline" value={form.settings.siteTagline} onChange={(v) => patchSettings(setForm, { siteTagline: v })} />
              <Field label="Founded year" value={form.settings.foundedYear} onChange={(v) => patchSettings(setForm, { foundedYear: v })} />
              <Field label="Site URL" value={form.settings.siteUrl} onChange={(v) => patchSettings(setForm, { siteUrl: v })} />
              <Field label="Practice summary" value={form.settings.practiceSummary} onChange={(v) => patchSettings(setForm, { practiceSummary: v })} />
              <Field label="Practice place" value={form.settings.practicePlace} onChange={(v) => patchSettings(setForm, { practicePlace: v })} />
              <Field label="Zoom summary" value={form.settings.zoomSummary} onChange={(v) => patchSettings(setForm, { zoomSummary: v })} />
              <Field label="Zoom place" value={form.settings.zoomPlace} onChange={(v) => patchSettings(setForm, { zoomPlace: v })} />
            </Grid>
            <TextArea label="Meetings blurb" value={form.settings.meetingsBlurb} onChange={(v) => patchSettings(setForm, { meetingsBlurb: v })} />
            <TextArea label="About page blurb" value={form.settings.aboutBlurb} onChange={(v) => patchSettings(setForm, { aboutBlurb: v })} />
          </Section>

          <Section title="Header navigation">
            <NavLinksEditor
              links={form.settings.navLinks}
              onChange={(navLinks) => patchSettings(setForm, { navLinks })}
            />
          </Section>

          <Section title="Footer explore links">
            <NavLinksEditor
              links={form.settings.footerExploreLinks}
              onChange={(footerExploreLinks) => patchSettings(setForm, { footerExploreLinks })}
            />
          </Section>

          <Section title="Mobile bottom bar links">
            <NavLinksEditor
              links={form.settings.visitBarLinks}
              onChange={(visitBarLinks) => patchSettings(setForm, { visitBarLinks })}
            />
          </Section>

          <Section title="Homepage hero & sections">
            <TextArea label="Hero subtext" value={form.settings.heroSubtext} onChange={(v) => patchSettings(setForm, { heroSubtext: v })} />
            <Grid>
              <Field label="Season eyebrow" value={form.settings.seasonEyebrow} onChange={(v) => patchSettings(setForm, { seasonEyebrow: v })} />
              <Field label="Season story title" value={form.settings.seasonStoryTitle} onChange={(v) => patchSettings(setForm, { seasonStoryTitle: v })} />
            </Grid>
            <TextArea label="Season story body" value={form.settings.seasonStoryBody} onChange={(v) => patchSettings(setForm, { seasonStoryBody: v })} />
            <Field label="Season story link label" value={form.settings.seasonStoryLinkLabel} onChange={(v) => patchSettings(setForm, { seasonStoryLinkLabel: v })} />
            <Grid>
              <Field label="What we do title" value={form.settings.whatWeDoTitle} onChange={(v) => patchSettings(setForm, { whatWeDoTitle: v })} />
            </Grid>
            <TextArea label="What we do subtitle" value={form.settings.whatWeDoSubtitle} onChange={(v) => patchSettings(setForm, { whatWeDoSubtitle: v })} />
            <PillarsEditor
              pillars={form.settings.homepagePillars}
              onChange={(homepagePillars) => patchSettings(setForm, { homepagePillars })}
            />
            <Grid>
              <Field label="CTA title" value={form.settings.ctaTitle} onChange={(v) => patchSettings(setForm, { ctaTitle: v })} />
            </Grid>
            <TextArea label="CTA body" value={form.settings.ctaBody} onChange={(v) => patchSettings(setForm, { ctaBody: v })} />
          </Section>

          <Section title="Join page">
            <TextArea label="Hero description" value={form.settings.joinHeroDescription} onChange={(v) => patchSettings(setForm, { joinHeroDescription: v })} />
            <StringListEditor
              label="What happens next bullets"
              items={form.settings.joinNextSteps}
              onChange={(joinNextSteps) => patchSettings(setForm, { joinNextSteps })}
            />
          </Section>

          <Section title="Outreach stories">
            <p className="text-sm text-muted-foreground">
              Story text here. Photos are managed under{" "}
              <Link to="/admin/site-images" className="text-forest underline">
                Site Images
              </Link>
              .
            </p>
            {form.outreachStories.map((story, index) => (
              <div key={story.id} className="rounded-xl border border-border p-4">
                <Field
                  label="Title"
                  value={story.title}
                  onChange={(title) => {
                    setForm((current) => {
                      if (!current) return current;
                      const outreachStories = [...current.outreachStories];
                      outreachStories[index] = { ...outreachStories[index], title };
                      return { ...current, outreachStories };
                    });
                  }}
                />
                <TextArea
                  label="Description"
                  value={story.description}
                  onChange={(description) => {
                    setForm((current) => {
                      if (!current) return current;
                      const outreachStories = [...current.outreachStories];
                      outreachStories[index] = { ...outreachStories[index], description };
                      return { ...current, outreachStories };
                    });
                  }}
                />
              </div>
            ))}
          </Section>

          <Section title="Core Values">
            <TextArea label="Page intro" value={form.settings.coreValuesIntro} onChange={(v) => patchSettings(setForm, { coreValuesIntro: v })} />
          </Section>

          <SiteContentExtendedSections
            form={form}
            setForm={setForm}
            patchSettings={(patch) => patchSettings(setForm, patch)}
          />
        </div>
      )}
    </AdminQuickShell>
  );
}

function patchSettings(
  setForm: React.Dispatch<React.SetStateAction<SiteContentAdminData | null>>,
  patch: Partial<SiteSettings>,
) {
  setForm((current) => (current ? { ...current, settings: { ...current.settings, ...patch } } : current));
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

function BrandColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const color = normalizeBrandColor(value);
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">Brand color</span>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-11 cursor-pointer rounded-lg border border-input bg-transparent p-1"
          aria-label="Pick brand color"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={DEFAULT_BRAND_COLOR}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
          spellCheck={false}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Buttons, links, and accents. Default green for Bits &amp; Bots is {DEFAULT_BRAND_COLOR}.
      </p>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
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

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
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
          <button
            type="button"
            className="btn-outline px-3"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
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

function NavLinksEditor({
  links,
  onChange,
}: {
  links: NavLinkItem[];
  onChange: (links: NavLinkItem[]) => void;
}) {
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
          <Field
            label="Label"
            value={link.label}
            onChange={(label) => {
              const next = [...links];
              next[index] = { ...next[index], label } as NavLinkItem;
              onChange(next);
            }}
          />
          {link.kind === "internal" ? (
            <Field
              label="Path"
              value={link.to}
              onChange={(to) => {
                const next = [...links];
                next[index] = { kind: "internal", label: link.label, to };
                onChange(next);
              }}
            />
          ) : (
            <Field
              label="URL"
              value={link.href}
              onChange={(href) => {
                const next = [...links];
                next[index] = { kind: "external", label: link.label, href };
                onChange(next);
              }}
            />
          )}
          <button type="button" className="btn-outline px-3" onClick={() => onChange(links.filter((_, i) => i !== index))}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-outline gap-2 text-sm"
        onClick={() => onChange([...links, { kind: "internal", label: "New link", to: "/" }])}
      >
        <Plus size={14} /> Add link
      </button>
    </div>
  );
}

function PillarsEditor({
  pillars,
  onChange,
}: {
  pillars: HomepagePillar[];
  onChange: (pillars: HomepagePillar[]) => void;
}) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">Homepage pillars</span>
      {pillars.map((pillar, index) => (
        <div key={index} className="space-y-2 rounded-xl border border-border/80 p-3">
          <Field
            label="Title"
            value={pillar.title}
            onChange={(title) => {
              const next = [...pillars];
              next[index] = { ...next[index], title };
              onChange(next);
            }}
          />
          <TextArea
            label="Copy"
            value={pillar.copy}
            onChange={(copy) => {
              const next = [...pillars];
              next[index] = { ...next[index], copy };
              onChange(next);
            }}
          />
          <Grid>
            <Field
              label="Optional link path"
              value={pillar.href ?? ""}
              onChange={(href) => {
                const next = [...pillars];
                next[index] = { ...next[index], href: href || undefined };
                onChange(next);
              }}
            />
            <Field
              label="Optional link label"
              value={pillar.linkLabel ?? ""}
              onChange={(linkLabel) => {
                const next = [...pillars];
                next[index] = { ...next[index], linkLabel: linkLabel || undefined };
                onChange(next);
              }}
            />
          </Grid>
        </div>
      ))}
    </div>
  );
}
