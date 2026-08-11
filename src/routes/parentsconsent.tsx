import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { type TeamMember } from "@/lib/team-members";
import {
  fetchConsentEligibleMembers,
  isParentConsentSetupMissing,
  parentConsentErrorMessage,
  type ParentMediaConsentInput,
} from "@/lib/parent-consent";
import { resolveConsentCopy } from "@/lib/consent-copy";
import { fetchSiteSettings } from "@/lib/site-settings";
import { brandingFromSettings } from "@/lib/team-branding";

export const Route = createFileRoute("/parentsconsent")({
  loader: async () => {
    const [members, settings] = await Promise.all([
      fetchConsentEligibleMembers(),
      fetchSiteSettings(),
    ]);
    const branding = brandingFromSettings(settings);
    const consent = resolveConsentCopy(settings, branding);
    return {
      members,
      branding,
      ...consent,
    };
  },
  head: ({ loaderData }) => {
    const siteName = loaderData?.branding.siteName ?? "Our Team";
    return {
      meta: [
        { title: `Photo & Media Consent — ${siteName}` },
        {
          name: "description",
          content: `Parent permission for ${siteName} to share team photos and videos on the website and social media.`,
        },
        { property: "og:title", content: `Photo & Media Consent — ${siteName}` },
        {
          property: "og:description",
          content: "Electronic consent form for team photo and video use.",
        },
      ],
    };
  },
  component: ParentsConsentPage,
});

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): ParentMediaConsentInput => ({
  teamMemberId: "",
  motherName: "",
  motherEmail: "",
  motherPhone: "",
  fatherName: "",
  fatherEmail: "",
  fatherPhone: "",
  signedByName: "",
  signedByRelation: "Mother",
  signatureDate: todayIso(),
  agreesWebsite: false,
  agreesSocialMedia: false,
});

function ParentsConsentPage() {
  const { members: initialMembers, intro, terms, bothParentsNote, heroTitle, heroDescription, successTitle, successMessage } =
    Route.useLoaderData();
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [form, setForm] = useState<ParentMediaConsentInput>(emptyForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [submittedKid, setSubmittedKid] = useState<string | null>(null);

  useEffect(() => {
    fetchConsentEligibleMembers()
      .then(setMembers)
      .catch((err) => console.error("[parentsconsent]", parentConsentErrorMessage(err)));
  }, []);

  const onChange =
    <K extends keyof ParentMediaConsentInput>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const { submitParentMediaConsent } = await import("@/lib/parent-consent.functions");
      const result = await submitParentMediaConsent({ data: form });
      setSubmittedKid(result.memberName);
      setMembers((current) => current.filter((m) => m.id !== result.memberId));
      setStatus("success");
      setForm(emptyForm());
    } catch (err) {
      setStatus("error");
      setError(parentConsentErrorMessage(err));
    }
  };

  return (
    <SiteLayout>
      <PageHero title={heroTitle} description={heroDescription} />
      <section className="py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.35fr]">
          <aside>
            <div className="rounded-2xl border border-border bg-card p-8">
              <h2 className="font-display text-xl">What you are agreeing to</h2>
              <p className="mt-4 text-sm leading-relaxed text-foreground/85">{intro}</p>
              <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-foreground/85">
                {terms.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ol>
              <div className="mt-8 rounded-xl bg-sand p-5 text-sm text-foreground/90">
                <p className="font-medium">Do both parents need to sign?</p>
                <p className="mt-2 text-muted-foreground">{bothParentsNote}</p>
              </div>
            </div>
          </aside>

          <div>
            {status === "success" ? (
              <div className="rounded-2xl border border-forest/30 bg-forest/5 p-10 text-center">
                <CheckCircle2 size={40} className="mx-auto text-forest" />
                <h2 className="mt-4 font-display text-3xl">{successTitle}</h2>
                <p className="mt-2 text-muted-foreground">
                  {successMessage}
                  {submittedKid ? ` (${submittedKid})` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setSubmittedKid(null);
                  }}
                  className="btn-outline mt-6"
                  disabled={members.length === 0}
                >
                  {members.length === 0 ? "All teammates done" : "Submit another"}
                </button>
              </div>
            ) : members.length === 0 ? (
              <div className="rounded-2xl border border-forest/30 bg-forest/5 p-10 text-center">
                <CheckCircle2 size={40} className="mx-auto text-forest" />
                <h2 className="mt-4 font-display text-3xl">All set</h2>
                <p className="mt-2 text-muted-foreground">
                  Every teammate on the roster already has consent on file. Contact a coach if you
                  need to update anything.
                </p>
              </div>
            ) : (
              <ConsentForm
                members={members}
                form={form}
                setForm={setForm}
                onChange={onChange}
                onSubmit={onSubmit}
                status={status}
                error={error}
                setupMissing={error ? isParentConsentSetupMissing(error) : false}
              />
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function ConsentForm({
  members,
  form,
  setForm,
  onChange,
  onSubmit,
  status,
  error,
  setupMissing,
}: {
  members: TeamMember[];
  form: ParentMediaConsentInput;
  setForm: React.Dispatch<React.SetStateAction<ParentMediaConsentInput>>;
  onChange: <K extends keyof ParentMediaConsentInput>(
    key: K,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  status: "idle" | "submitting" | "error";
  error: string | null;
  setupMissing: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-6 rounded-2xl border border-border bg-card p-8">
      <label className="grid gap-2">
        <span className="text-sm font-medium">
          Teammate name <span className="text-forest">*</span>
        </span>
        <select
          required
          value={form.teamMemberId}
          onChange={onChange("teamMemberId")}
          className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-forest/30"
        >
          <option value="">Select your child</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="grid gap-4 rounded-xl border border-border/80 p-5">
        <legend className="px-1 text-sm font-medium">Mother / guardian</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" value={form.motherName} onChange={onChange("motherName")} />
          <Field label="Phone" type="tel" value={form.motherPhone} onChange={onChange("motherPhone")} />
        </div>
        <Field label="Email" type="email" value={form.motherEmail} onChange={onChange("motherEmail")} />
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-border/80 p-5">
        <legend className="px-1 text-sm font-medium">Father / guardian</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" value={form.fatherName} onChange={onChange("fatherName")} />
          <Field label="Phone" type="tel" value={form.fatherPhone} onChange={onChange("fatherPhone")} />
        </div>
        <Field label="Email" type="email" value={form.fatherEmail} onChange={onChange("fatherEmail")} />
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-forest/20 bg-forest/5 p-5">
        <legend className="px-1 text-sm font-medium">Electronic signature</legend>
        <p className="text-xs text-muted-foreground">
          Type your full legal name below. One parent or guardian signature is sufficient.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Signed by (full name)"
            required
            value={form.signedByName}
            onChange={onChange("signedByName")}
          />
          <label className="grid gap-2">
            <span className="text-sm font-medium">
              I am the <span className="text-forest">*</span>
            </span>
            <select
              required
              value={form.signedByRelation}
              onChange={onChange("signedByRelation")}
              className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-forest/30"
            >
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Legal guardian</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>
        <Field
          label="Date"
          required
          type="date"
          value={form.signatureDate}
          onChange={onChange("signatureDate")}
        />
      </fieldset>

      <div className="grid gap-3 text-sm">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            required
            checked={form.agreesWebsite}
            onChange={(e) => setForm((f) => ({ ...f, agreesWebsite: e.target.checked }))}
            className="mt-1"
          />
          <span>I agree to website use of photos and videos as described above.</span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            required
            checked={form.agreesSocialMedia}
            onChange={(e) => setForm((f) => ({ ...f, agreesSocialMedia: e.target.checked }))}
            className="mt-1"
          />
          <span>I agree to social media use (Facebook, Instagram, and similar team accounts).</span>
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          {setupMissing && (
            <p className="mt-2 text-foreground/80">
              A coach needs to run{" "}
              <code className="rounded bg-white/60 px-1">supabase/setup-parent-media-consents.sql</code>{" "}
              in Supabase first.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Submissions are stored securely for coach records only.
        </p>
        <button type="submit" disabled={status === "submitting"} className="btn-primary disabled:opacity-60">
          {status === "submitting" ? "Saving…" : <>Submit consent <Send size={15} /></>}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  ...rest
}: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-forest"> *</span>}
      </span>
      <input
        {...rest}
        required={required}
        className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-forest/30"
      />
    </label>
  );
}
