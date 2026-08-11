import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { TeamPhoto } from "@/components/site/TeamPhoto";
import { GalleryUploadForm } from "@/components/site/GalleryUploadForm";
import { galleryPhotos } from "@/lib/gallery-photos";
import {
  GALLERY_STATIC_PHOTOS_PUBLIC,
  GALLERY_UPLOADS_PUBLIC,
} from "@/lib/gallery-config";
import {
  fetchApprovedGalleryPhotos,
  type ApprovedGalleryPhoto,
} from "@/lib/gallery-uploads";
import { photos } from "@/lib/photos";
import { brandingRouteLoader, routeTeamName } from "@/lib/team-branding";
import { useSiteSettings } from "@/lib/site-settings-context";
import { ArrowRight, ChevronLeft, ChevronRight, Upload, X } from "lucide-react";

export const Route = createFileRoute("/gallery")({
  loader: async () => {
    const [{ branding }, uploaded] = await Promise.all([
      brandingRouteLoader(),
      (async () => {
        if (!GALLERY_UPLOADS_PUBLIC) return [] as ApprovedGalleryPhoto[];
        try {
          return await fetchApprovedGalleryPhotos();
        } catch {
          return [] as ApprovedGalleryPhoto[];
        }
      })(),
    ]);
    return { branding, uploaded };
  },
  head: ({ loaderData }) => {
    const name = routeTeamName(loaderData);
    return {
      meta: [
        { title: `Photo Gallery — ${name}` },
        {
          name: "description",
          content: `Photos from ${name} practices, builds, and FIRST LEGO League events.`,
        },
        { property: "og:title", content: `${name} Photo Gallery` },
        {
          property: "og:description",
          content: "Photos from practices, builds, and FLL events.",
        },
        { property: "og:image", content: photos.ogLogo },
      ],
    };
  },
  component: GalleryPage,
});

type DisplayPhoto = {
  key: string;
  src: string;
  thumb: string;
  width: number | null;
  height: number | null;
  caption: string | null;
};

function toDisplayPhotos(rows: ApprovedGalleryPhoto[]): DisplayPhoto[] {
  return rows.map((row) => ({
    key: row.id,
    src: row.url,
    thumb: row.url,
    width: row.width,
    height: row.height,
    caption: row.caption,
  }));
}

const staticPhotos: DisplayPhoto[] = GALLERY_STATIC_PHOTOS_PUBLIC
  ? galleryPhotos.map((photo) => ({
      key: photo.src,
      src: photo.src,
      thumb: photo.thumb,
      width: photo.width,
      height: photo.height,
      caption: null,
    }))
  : [];

function GalleryPage() {
  const { uploaded: loaderUploaded } = Route.useLoaderData();
  const {
    siteName,
    galleryHeroTitle,
    galleryHeroDescription,
    galleryEmptyTitle,
    galleryEmptyMessage,
    galleryShareButtonLabel,
  } = useSiteSettings();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [uploaded, setUploaded] = useState<DisplayPhoto[]>(() => toDisplayPhotos(loaderUploaded));

  useEffect(() => {
    if (!GALLERY_UPLOADS_PUBLIC) {
      setUploaded([]);
      return;
    }
    let cancelled = false;
    fetchApprovedGalleryPhotos()
      .then((rows) => {
        if (cancelled) return;
        setUploaded(toDisplayPhotos(rows));
      })
      .catch((error) => {
        console.error("[gallery] Could not refresh approved photos", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allPhotos = useMemo(() => [...uploaded, ...staticPhotos], [uploaded]);
  const total = allPhotos.length;

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null ? i : (i + delta + total) % total)),
    [total],
  );

  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, step]);

  const active = openIndex === null ? null : allPhotos[openIndex];

  return (
    <SiteLayout>
      <PageHero
        title={galleryHeroTitle}
        align="center"
        description={
          total > 0
            ? galleryHeroDescription
            : galleryEmptyMessage
        }
      />

      <section className="py-16">
        <div className="container-page">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#share-photos" className="btn-primary gap-2">
              <Upload size={16} /> {galleryShareButtonLabel}
            </a>
          </div>

          {total === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="font-display text-2xl text-foreground">{galleryEmptyTitle}</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {galleryEmptyMessage}
              </p>
              <Link to="/events" className="btn-outline mt-6 inline-flex gap-2">
                See upcoming events <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allPhotos.map((photo, index) => (
                  <button
                    key={photo.key}
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-sand shadow-sm transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                    aria-label={`Open photo ${index + 1} of ${total}`}
                  >
                    <TeamPhoto
                      src={photo.thumb}
                      alt={photo.caption ?? `${siteName} team photo ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      label="Team photo"
                    />
                    <span className="pointer-events-none absolute inset-0 bg-forest-deep/0 transition-colors group-hover:bg-forest-deep/15" />
                  </button>
                ))}
              </div>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Select any photo to view it full size.
              </p>
            </>
          )}
        </div>
      </section>

      <section id="share-photos" className="scroll-mt-20 border-t border-border bg-sand/40 py-16">
        <div className="container-page max-w-3xl">
          <GalleryUploadForm />
        </div>
      </section>

      {active && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-forest-deep/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${(openIndex ?? 0) + 1} of ${total}`}
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20"
            aria-label="Close photo"
          >
            <X size={20} />
          </button>

          {total > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20 md:left-6"
                aria-label="Previous photo"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20 md:right-6"
                aria-label="Next photo"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <figure className="max-h-full w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={active.src}
              alt={active.caption ?? `${siteName} team photo ${(openIndex ?? 0) + 1}`}
              width={active.width ?? undefined}
              height={active.height ?? undefined}
              className="mx-auto max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            <figcaption className="mt-4 text-center text-sm text-cream/70">
              {active.caption ? `${active.caption} · ` : ""}
              {(openIndex ?? 0) + 1} of {total}
            </figcaption>
          </figure>
        </div>
      )}
    </SiteLayout>
  );
}
