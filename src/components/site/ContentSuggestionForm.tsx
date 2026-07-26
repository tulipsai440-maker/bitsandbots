import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

type EagleFields = { year: string; name: string; project: string; email: string };
type ScoutmasterFields = { name: string; years: string; bio: string; email: string };

type Props =
  | {
      kind: "eagle";
      title: string;
      description: string;
      onSubmit: (data: Omit<EagleFields, "email"> & { submittedByEmail?: string }) => Promise<void>;
    }
  | {
      kind: "scoutmaster";
      title: string;
      description: string;
      onSubmit: (data: Omit<ScoutmasterFields, "email"> & { submittedByEmail?: string }) => Promise<void>;
    };

const fieldClass = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const labelClass = "text-xs font-medium uppercase tracking-widest text-muted-foreground";

export function ContentSuggestionForm(props: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [eagle, setEagle] = useState<EagleFields>({ year: "", name: "", project: "", email: "" });
  const [scoutmaster, setScoutmaster] = useState<ScoutmasterFields>({ name: "", years: "", bio: "", email: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      if (props.kind === "eagle") {
        await props.onSubmit({
          year: eagle.year,
          name: eagle.name,
          project: eagle.project,
          submittedByEmail: eagle.email || undefined,
        });
        setEagle({ year: "", name: "", project: "", email: "" });
      } else {
        await props.onSubmit({
          name: scoutmaster.name,
          years: scoutmaster.years,
          bio: scoutmaster.bio,
          submittedByEmail: scoutmaster.email || undefined,
        });
        setScoutmaster({ name: "", years: "", bio: "", email: "" });
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-forest/30 bg-forest/5 p-8 text-center">
        <CheckCircle2 className="mx-auto text-forest" size={36} />
        <h3 className="mt-4 font-display text-2xl">Thank you!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your submission was sent for admin review. It will appear on the site once approved.
        </p>
        <button type="button" onClick={() => setStatus("idle")} className="btn-outline mt-6">
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <h3 className="font-display text-2xl">{props.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{props.description}</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {props.kind === "eagle" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Year</label>
                <input required value={eagle.year} onChange={(e) => setEagle((f) => ({ ...f, year: e.target.value }))} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Scout name</label>
                <input required value={eagle.name} onChange={(e) => setEagle((f) => ({ ...f, name: e.target.value }))} className={fieldClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Eagle project</label>
              <textarea required value={eagle.project} onChange={(e) => setEagle((f) => ({ ...f, project: e.target.value }))} className={fieldClass} rows={3} />
            </div>
            <div>
              <label className={labelClass}>Your email (optional)</label>
              <input type="email" value={eagle.email} onChange={(e) => setEagle((f) => ({ ...f, email: e.target.value }))} className={fieldClass} />
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Name</label>
                <input required value={scoutmaster.name} onChange={(e) => setScoutmaster((f) => ({ ...f, name: e.target.value }))} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Years served</label>
                <input required value={scoutmaster.years} onChange={(e) => setScoutmaster((f) => ({ ...f, years: e.target.value }))} className={fieldClass} placeholder="2018–2020" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Bio</label>
              <textarea value={scoutmaster.bio} onChange={(e) => setScoutmaster((f) => ({ ...f, bio: e.target.value }))} className={fieldClass} rows={3} />
            </div>
            <div>
              <label className={labelClass}>Your email (optional)</label>
              <input type="email" value={scoutmaster.email} onChange={(e) => setScoutmaster((f) => ({ ...f, email: e.target.value }))} className={fieldClass} />
            </div>
          </>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={status === "submitting"} className="btn-primary gap-2">
          <Send size={16} /> {status === "submitting" ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
