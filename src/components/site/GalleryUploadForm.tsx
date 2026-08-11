import { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Upload, X } from "lucide-react";
import {
  MAX_FILES_PER_SUBMISSION,
  submitGalleryPhotos,
  validateGalleryFile,
} from "@/lib/gallery-uploads";

const fieldClass = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const labelClass = "text-xs font-medium uppercase tracking-widest text-muted-foreground";

type Selected = { file: File; previewUrl: string };

export function GalleryUploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Selected[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setError(null);

    const incoming = Array.from(fileList);
    const room = MAX_FILES_PER_SUBMISSION - selected.length;
    if (room <= 0) {
      setError(`You can share up to ${MAX_FILES_PER_SUBMISSION} photos at a time.`);
      return;
    }

    const accepted: Selected[] = [];
    for (const file of incoming.slice(0, room)) {
      const problem = validateGalleryFile(file);
      if (problem) {
        setError(problem);
        continue;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    if (incoming.length > room) {
      setError(
        `Only the first ${room} photo${room === 1 ? "" : "s"} were added — limit is ${MAX_FILES_PER_SUBMISSION}.`,
      );
    }
    setSelected((current) => [...current, ...accepted]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    setSelected((current) => {
      URL.revokeObjectURL(current[index].previewUrl);
      return current.filter((_, i) => i !== index);
    });
  }

  function reset() {
    selected.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setSelected([]);
    setName("");
    setEmail("");
    setCaption("");
    setConsent(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) {
      setError("Choose at least one photo to share.");
      return;
    }

    setStatus("submitting");
    setError(null);
    try {
      await submitGalleryPhotos(
        selected.map((item) => item.file),
        { name, email, caption, consent },
      );
      reset();
      setStatus("success");
    } catch (err) {
      setStatus("idle");
      setError(
        err instanceof Error ? err.message : "Your photos could not be sent. Please try again.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-forest/30 bg-forest/5 p-8 text-center">
        <CheckCircle2 className="mx-auto text-forest" size={36} />
        <h3 className="mt-4 font-display text-2xl">Thank you for sharing!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your photos were sent for review. Once approved, they will appear in the
          gallery above.
        </p>
        <button type="button" onClick={() => setStatus("idle")} className="btn-outline mt-6">
          Share more photos
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <h3 className="font-display text-2xl">Share your team photos</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Have photos from a practice, build session, or FLL event? Send them here and a coach
        will review them before they appear in the gallery.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className={labelClass}>Photos</label>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => addFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={submitting || selected.length >= MAX_FILES_PER_SUBMISSION}
            className="mt-2 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-background px-6 py-8 text-sm text-muted-foreground transition-colors hover:border-forest hover:text-forest disabled:opacity-50"
          >
            <ImagePlus size={26} />
            <span className="font-medium">Choose photos</span>
            <span className="text-xs">
              JPG, PNG, or WebP · up to {MAX_FILES_PER_SUBMISSION} at a time
            </span>
          </button>

          {selected.length > 0 && (
            <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {selected.map((item, index) => (
                <li
                  key={item.previewUrl}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-sand"
                >
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    disabled={submitting}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-forest-deep/80 text-cream transition-colors hover:bg-forest-deep"
                    aria-label="Remove photo"
                  >
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="gallery-name">
              Your name
            </label>
            <input
              id="gallery-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="gallery-email">
              Your email
            </label>
            <input
              id="gallery-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="gallery-caption">
            Caption (optional)
          </label>
          <input
            id="gallery-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className={fieldClass}
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-border bg-sand/50 p-4 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-forest"
          />
          <span className="text-muted-foreground">
            I took these photos or have permission to share them, and I have permission from the
            parents or guardians of any teammates pictured to publish them on this website.
          </span>
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !consent || selected.length === 0}
          className="btn-primary gap-2 disabled:opacity-50"
        >
          <Upload size={16} />
          {submitting ? "Sending photos…" : "Send for review"}
        </button>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Photos are resized in your browser before uploading, so large phone photos are fine. Your
          name and email are only visible to coaches and are never published.
        </p>
      </form>
    </div>
  );
}
