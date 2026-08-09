import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { SITE_NAME } from "@/lib/photos";
import { fetchCoaches, coachDisplayBio, type Coach } from "@/lib/coaches";
import { UserRound } from "lucide-react";

export const Route = createFileRoute("/coaches")({
  head: () => ({
    meta: [
      { title: `Coaches — ${SITE_NAME}` },
      {
        name: "description",
        content: `Meet the coaches who guide ${SITE_NAME} through FIRST LEGO League.`,
      },
      { property: "og:title", content: `Coaches — ${SITE_NAME}` },
      { property: "og:description", content: `Meet the ${SITE_NAME} coaching team.` },
    ],
  }),
  loader: async () => ({
    coaches: await fetchCoaches(),
  }),
  component: CoachesPage,
});

function CoachesPage() {
  const { coaches } = Route.useLoaderData();

  return (
    <SiteLayout>
      <PageHero
        title="Coaches"
        align="center"
        description={`The coaches who guide ${SITE_NAME} through builds, coding, Core Values, and competition season.`}
      />

      <section className="py-14 md:py-16">
        <div className="container-page">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {coaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function coachInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function CoachCard({ coach }: { coach: Coach }) {
  const initials = coachInitials(coach.name);
  const description = coachDisplayBio(coach.description);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-border/50">
      <div className="flex flex-col items-center gap-4 p-5 min-[420px]:flex-row min-[420px]:items-start sm:gap-6 sm:p-6">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-sand sm:h-48 sm:w-48">
          {coach.photoUrl ? (
            <img
              src={coach.photoUrl}
              alt={coach.name}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              decoding="async"
            />
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
          <h2 className="font-display text-2xl leading-tight text-foreground sm:text-3xl">
            {coach.name}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
