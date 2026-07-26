import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useEffect, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { fetchJoinContactEmail, sendJoinEmailFromBrowser } from "@/lib/join-client-email";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join Troop 2001 Naples — Scouts BSA" },
      { name: "description", content: "Ready to join Troop 2001? Send us a short form and we'll be in touch." },
      { property: "og:title", content: "Join Troop 2001 Naples" },
      { property: "og:description", content: "Start your scouting adventure with Troop 2001." },
    ],
  }),
  component: JoinPage,
});

type FormState = {
  parentName: string; scoutName: string; scoutAge: string; grade: string;
  school: string; parentEmail: string; parentPhone: string; questions: string;
};

const empty: FormState = {
  parentName: "", scoutName: "", scoutAge: "", grade: "",
  school: "", parentEmail: "", parentPhone: "", questions: "",
};

function JoinPage() {
  const [form, setForm] = useState<FormState>(empty);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchJoinContactEmail().then(setContactEmail);
  }, []);

  const onChange = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const { submitJoinRequest } = await import("@/lib/join.functions");
      const result = await submitJoinRequest({ data: form });
      if (result.useClientFormSubmit) {
        await sendJoinEmailFromBrowser(form);
      }
      setStatus("success");
      setForm(empty);
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg.toLowerCase().includes("fetch")) {
        setError(
          contactEmail
            ? `Network blocked the email request. Try again on home Wi‑Fi, or email ${contactEmail} directly.`
            : "Network blocked the email request. Try again on home Wi‑Fi, or contact the troop directly.",
        );
      } else {
        setError(msg);
      }
    }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Join Us"
        title="Start your scouting adventure."
        description="Fill in a few details and a troop leader will reach out. Prospective scouts and parents are welcome to visit any Wednesday meeting at 7 PM."
      />
      <section className="py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <aside>
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="eyebrow">What to expect</div>
              <ul className="mt-4 space-y-4 text-sm text-foreground/85">
                <li className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-forest" /> A troop leader replies within a few days.</li>
                <li className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-forest" /> We'll invite you to a Wednesday meeting to visit.</li>
                <li className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-forest" /> No uniform or gear needed for your first visit.</li>
                <li className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-forest" /> Youth ages 11 (or 5th grade) through 17 are eligible for Scouts BSA.</li>
              </ul>
              <div className="mt-8 rounded-xl bg-sand p-5 text-sm">
                <div className="font-medium">Meets every Wednesday · 7:00 PM</div>
                <div className="mt-1 text-muted-foreground">North Collier Fire Station #45<br/>1885 Veterans Park Dr, Naples, FL 34109</div>
              </div>
            </div>
          </aside>

          <div>
            {status === "success" ? (
              <div className="rounded-2xl border border-forest/30 bg-forest/5 p-10 text-center">
                <CheckCircle2 size={40} className="mx-auto text-forest" />
                <h2 className="mt-4 font-display text-3xl">Message received</h2>
                <p className="mt-2 text-muted-foreground">
                  Thanks for reaching out! A troop leader will be in touch shortly.
                </p>
                <button onClick={() => setStatus("idle")} className="btn-outline mt-6">Send another</button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-5 rounded-2xl border border-border bg-card p-8">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Parent Name" required value={form.parentName} onChange={onChange("parentName")} />
                  <Field label="Scout Name" required value={form.scoutName} onChange={onChange("scoutName")} />
                  <Field label="Scout Age" required type="number" min={10} max={18} value={form.scoutAge} onChange={onChange("scoutAge")} />
                  <Field label="Grade" required value={form.grade} onChange={onChange("grade")} />
                  <Field label="School" required value={form.school} onChange={onChange("school")} />
                  <Field label="Parent Phone" required type="tel" value={form.parentPhone} onChange={onChange("parentPhone")} />
                </div>
                <Field label="Parent Email" required type="email" value={form.parentEmail} onChange={onChange("parentEmail")} />
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Questions or notes</span>
                  <textarea
                    rows={5}
                    value={form.questions}
                    onChange={onChange("questions")}
                    className="rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-forest/30"
                    placeholder="Anything you'd like the troop to know?"
                  />
                </label>

                {error && (
                  <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                    {contactEmail && (
                      <p className="mt-2 text-foreground/80">
                        Or email{" "}
                        <a href={`mailto:${contactEmail}`} className="font-medium text-forest underline">
                          {contactEmail}
                        </a>{" "}
                        directly.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">Submissions are sent securely to the troop.</p>
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="btn-primary disabled:opacity-60"
                  >
                    {status === "submitting" ? "Sending…" : <>Send request <Send size={15} /></>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  label, required, ...rest
}: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}{required && <span className="text-forest"> *</span>}</span>
      <input
        {...rest}
        required={required}
        className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-forest/30"
      />
    </label>
  );
}
